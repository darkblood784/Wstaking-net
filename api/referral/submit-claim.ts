import {
  calcInviterClaimableByBucket,
  enforceRateLimit,
  getDb,
  isValidWallet,
  logReferralAudit,
  logReferralError,
  redactWallet,
  resolveClaimTokenForNetwork,
  setPrivateApiHeaders,
  verifyClaimSignature,
} from "./_lib";
import type { SubmitClaimRequest, SubmitClaimResponse } from "@shared/referral";

const AMOUNT_TOLERANCE_USD = 0.01;

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "submit-claim", 8, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const body = req.body as Partial<SubmitClaimRequest>;
  const {
    walletAddress,
    signature,
    challengeToken,
    requestedAmountUSD,
    receivingNetwork,
    receivingWallet,
    tokenAddress,
  } = body;

  if (!walletAddress || !isValidWallet(walletAddress)) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ ok: false, error: "Signature is required." });
  }
  if (!challengeToken || typeof challengeToken !== "string") {
    return res.status(400).json({ ok: false, error: "Challenge token is required." });
  }
  if (
    typeof requestedAmountUSD !== "number" ||
    requestedAmountUSD <= 0 ||
    !isFinite(requestedAmountUSD)
  ) {
    return res.status(400).json({ ok: false, error: "Invalid requested amount." });
  }
  if (!receivingNetwork || typeof receivingNetwork !== "string" || receivingNetwork.length > 64) {
    return res.status(400).json({ ok: false, error: "Receiving network is required." });
  }
  if (!receivingWallet || !isValidWallet(receivingWallet)) {
    return res.status(400).json({ ok: false, error: "Invalid receiving wallet address." });
  }
  if (!tokenAddress || !isValidWallet(tokenAddress)) {
    return res.status(400).json({ ok: false, error: "Invalid token address." });
  }

  let verifiedWallet: string;
  try {
    verifiedWallet = await verifyClaimSignature(walletAddress, signature, challengeToken);
  } catch {
    logReferralAudit("claim-submit-rejected", {
      reason: "invalid-signature",
      wallet: redactWallet(walletAddress),
    });
    return res.status(401).json({ ok: false, error: "Signature verification failed." });
  }

  const db = await getDb();

  let claimableAmountUSD: number;
  let totalEarnedUSD: number;
  let breakdown: any[];
  let resolvedToken:
    | { network: string; tokenAddress: string; tokenSymbol: string; currency?: "USDT" | "USDC" }
    | null = null;
  try {
    resolvedToken = await resolveClaimTokenForNetwork(receivingNetwork, tokenAddress);
    if (!resolvedToken) {
      logReferralAudit("claim-submit-rejected", {
        reason: "unsupported-bucket",
        wallet: redactWallet(verifiedWallet),
        network: receivingNetwork,
      });
      return res.status(400).json({ ok: false, error: "Unsupported claim bucket." });
    }

    const calc = await calcInviterClaimableByBucket(db, verifiedWallet, "claim-trigger");
    const selectedBucket = calc.buckets.find(
      (bucket) =>
        bucket.network === resolvedToken!.network &&
        bucket.tokenAddress === resolvedToken!.tokenAddress,
    );
    claimableAmountUSD = selectedBucket?.claimableAmountUSD ?? 0;
    totalEarnedUSD = calc.totalEarnedUSD;
    breakdown = calc.breakdown.filter(
      (item) =>
        item.network === resolvedToken!.network &&
        item.tokenAddress === resolvedToken!.tokenAddress,
    );
  } catch (error) {
    logReferralError("submit-claim-recalc", error, { walletAddress: verifiedWallet });
    return res.status(500).json({ ok: false, error: "Could not calculate reward amount. Please try again." });
  }

  if (requestedAmountUSD > claimableAmountUSD + AMOUNT_TOLERANCE_USD) {
    logReferralAudit("claim-submit-rejected", {
      reason: "amount-exceeds-claimable",
      wallet: redactWallet(verifiedWallet),
      network: resolvedToken?.network,
      tokenAddress: resolvedToken?.tokenAddress,
    });
    return res.status(400).json({
      ok: false,
      error: `Requested amount ($${requestedAmountUSD.toFixed(2)}) exceeds server-calculated claimable amount ($${claimableAmountUSD.toFixed(2)}).`,
    });
  }
  if (claimableAmountUSD < 0.01) {
    logReferralAudit("claim-submit-rejected", {
      reason: "no-claimable-balance",
      wallet: redactWallet(verifiedWallet),
      network: resolvedToken?.network,
      tokenAddress: resolvedToken?.tokenAddress,
    });
    return res.status(400).json({ ok: false, error: "No claimable rewards available." });
  }

  const existingPending = await db
    .collection("referralClaimRequests")
    .where("inviterWallet", "==", verifiedWallet)
    .where("network", "==", resolvedToken.network)
    .where("tokenAddress", "==", resolvedToken.tokenAddress)
    .where("status", "in", ["pending", "approved"])
    .limit(1)
    .get();

  if (!existingPending.empty) {
    const blocker = existingPending.docs[0].data();
    logReferralAudit("claim-submit-rejected", {
      reason: blocker.status === "approved" ? "claim-already-approved" : "claim-already-pending",
      wallet: redactWallet(verifiedWallet),
      network: resolvedToken.network,
      tokenAddress: resolvedToken.tokenAddress,
    });
    return res.status(409).json({
      ok: false,
      error: blocker.status === "approved"
        ? "You have an approved claim awaiting payment. Please wait for it to be marked as sent before submitting a new request."
        : "You already have a pending claim request. Please wait for it to be processed.",
    });
  }

  const now = Date.now();
  const docRef = await db.collection("referralClaimRequests").add({
    inviterWallet: verifiedWallet,
    requestedAmountUSD,
    snapshotClaimableUSD: claimableAmountUSD,
    serverCalculatedClaimableUSD: claimableAmountUSD,
    totalEarnedUSD,
    rewardBreakdown: breakdown.map((b) => ({
      inviteeWallet: b.inviteeWallet,
      earnedUSD: b.earnedUSD,
    })),
    currency: resolvedToken.currency,
    network: resolvedToken.network,
    tokenAddress: resolvedToken.tokenAddress,
    tokenSymbol: resolvedToken.tokenSymbol,
    receivingNetwork,
    receivingWallet: receivingWallet.toLowerCase(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    adminNote: "",
    txnHash: "",
    submittedViaApi: true,
  });
  logReferralAudit("claim-submitted", {
    claimId: docRef.id,
    wallet: redactWallet(verifiedWallet),
    network: resolvedToken.network,
    tokenAddress: resolvedToken.tokenAddress,
    amountUSD: requestedAmountUSD,
  });

  const response: SubmitClaimResponse = {
    ok: true,
    claimId: docRef.id,
    serverCalculatedClaimableUSD: claimableAmountUSD,
    message: "Claim request submitted successfully. An admin will process it shortly.",
  };
  return res.status(200).json(response);
}
