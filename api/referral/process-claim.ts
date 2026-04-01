import {
  calcInviterClaimableByBucket,
  enforceRateLimit,
  getDb,
  logReferralAudit,
  logReferralError,
  redactWallet,
  setPrivateApiHeaders,
  verifyAdminSession,
} from "./_lib";
import type { ProcessClaimRequest, ProcessClaimResponse } from "@shared/referral";

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "process-claim", 30, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const adminWallet = verifyAdminSession(req);
  if (!adminWallet) {
    return res.status(401).json({ ok: false, error: "Unauthorised. Admin session required." });
  }

  const body = req.body as Partial<ProcessClaimRequest>;
  const { claimId, action, adminNote, txnHash } = body;

  if (!claimId || typeof claimId !== "string") {
    return res.status(400).json({ ok: false, error: "claimId is required." });
  }
  if (!["approved", "rejected", "sent"].includes(action as string)) {
    return res.status(400).json({ ok: false, error: "action must be 'approved', 'rejected', or 'sent'." });
  }
  if (action === "sent" && (!txnHash || typeof txnHash !== "string")) {
    return res.status(400).json({ ok: false, error: "txnHash is required when marking as sent." });
  }
  if (adminNote !== undefined && (typeof adminNote !== "string" || adminNote.length > 500)) {
    return res.status(400).json({ ok: false, error: "adminNote must be a short text value." });
  }

  const db = await getDb();
  const claimRef = db.collection("referralClaimRequests").doc(claimId);
  const claimSnap = await claimRef.get();

  if (!claimSnap.exists) {
    logReferralAudit("claim-process-rejected", {
      reason: "claim-not-found",
      claimId,
      adminWallet: redactWallet(adminWallet),
    });
    return res.status(404).json({ ok: false, error: "Claim not found." });
  }

  const claim = claimSnap.data()!;
  if (claim.status === "sent") {
    logReferralAudit("claim-process-rejected", {
      reason: "claim-already-sent",
      claimId,
      adminWallet: redactWallet(adminWallet),
    });
    return res.status(409).json({ ok: false, error: "This claim has already been marked as sent." });
  }

  const now = Date.now();
  let finalAmountUSD: number = claim.requestedAmountUSD;
  let recalcNote = "";

  if (action === "sent") {
    try {
      const calc = await calcInviterClaimableByBucket(db, claim.inviterWallet, "manual");
      const selectedBucket = calc.buckets.find(
        (bucket) =>
          bucket.network === String(claim.network || claim.receivingNetwork || "") &&
          bucket.tokenAddress === String(claim.tokenAddress || "").toLowerCase(),
      );
      const serverAmount = selectedBucket?.claimableAmountUSD ?? 0;
      if (claim.requestedAmountUSD > serverAmount + 0.01) {
        recalcNote =
          `[Server recalc: requested $${claim.requestedAmountUSD.toFixed(2)}, ` +
          `current claimable $${serverAmount.toFixed(2)}]`;
        logReferralError("process-claim-discrepancy", new Error("Claim amount discrepancy"), { claimId });
      }
      finalAmountUSD = Math.min(claim.requestedAmountUSD, serverAmount);
    } catch (error) {
      logReferralError("process-claim-recalc", error, { claimId });
      recalcNote = "[Server recalc failed - using stored amount]";
    }

    await db.collection("referralPayoutHistory").add({
      inviterWallet: claim.inviterWallet,
      claimId,
      claimRequestId: claimId,
      amountUSD: finalAmountUSD,
      currency: claim.currency,
      network: claim.network || claim.receivingNetwork,
      tokenAddress: claim.tokenAddress || null,
      tokenSymbol: claim.tokenSymbol || claim.currency || null,
      receivingNetwork: claim.receivingNetwork,
      receivingWallet: claim.receivingWallet,
      txnHash: txnHash!,
      processedByAdmin: adminWallet,
      processedAt: now,
      sentAt: now,
    });
  }

  const updatePayload: Record<string, any> = {
    status: action,
    updatedAt: now,
    processedByAdmin: adminWallet,
  };
  if (adminNote !== undefined) {
    updatePayload.adminNote = recalcNote
      ? `${adminNote} ${recalcNote}`.trim()
      : adminNote;
  } else if (recalcNote) {
    updatePayload.adminNote = recalcNote;
  }
  if (txnHash) updatePayload.txnHash = txnHash;
  if (action === "sent") updatePayload.finalAmountUSD = finalAmountUSD;

  try {
    await claimRef.update(updatePayload);
  } catch (error) {
    logReferralError("process-claim-update", error, { claimId, action, adminWallet });
    return res.status(500).json({ ok: false, error: "Unable to update the claim right now." });
  }

  logReferralAudit("claim-processed", {
    claimId,
    action,
    adminWallet: redactWallet(adminWallet),
    inviterWallet: redactWallet(claim.inviterWallet),
    network: claim.network || claim.receivingNetwork || null,
    tokenAddress: claim.tokenAddress || null,
    amountUSD: action === "sent" ? finalAmountUSD : claim.requestedAmountUSD,
  });

  const response: ProcessClaimResponse = {
    ok: true,
    claimId,
    newStatus: action as "approved" | "rejected" | "sent",
    message: `Claim ${action === "sent" ? "marked as sent" : action} successfully.`,
  };
  return res.status(200).json(response);
}
