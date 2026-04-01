import {
  clearReferralCaptureCookie,
  createBindNonce,
  enforceRateLimit,
  getCapturedReferralCode,
  getDb,
  logReferralAudit,
  logReferralError,
  normalizeReferralPolicy,
  redactReferralCode,
  redactWallet,
  resolveReferralBindingDecision,
  setPrivateApiHeaders,
  verifyBindSignature,
  WALLET_REGEX,
} from "./_lib";
import type { ReferralBindNonceResponse, ReferralBindResponse } from "@shared/referral";

export async function handleGetNonce(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (!enforceRateLimit(req, res, "bind-nonce", 20, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const wallet = String(req.query.wallet || "").trim();
  if (!WALLET_REGEX.test(wallet)) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }

  const { challengeToken, message } = createBindNonce(wallet);
  const response: ReferralBindNonceResponse = { ok: true, challengeToken, message };
  return res.status(200).json(response);
}

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method === "GET") {
    return handleGetNonce(req, res);
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "bind", 10, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const {
    walletAddress,
    signature,
    challengeToken,
    network,
    isNewUser,
  } = req.body ?? {};

  if (!walletAddress || !WALLET_REGEX.test(String(walletAddress))) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ ok: false, error: "Signature is required." });
  }
  if (!challengeToken || typeof challengeToken !== "string") {
    return res.status(400).json({ ok: false, error: "Challenge token is required." });
  }
  if (!network || typeof network !== "string" || network.length > 64) {
    return res.status(400).json({ ok: false, error: "Network is required." });
  }

  let normalizedWallet: string;
  try {
    normalizedWallet = await verifyBindSignature(walletAddress, signature, challengeToken);
  } catch {
    logReferralAudit("bind-rejected", {
      reason: "invalid-signature",
      wallet: redactWallet(walletAddress),
    });
    return res.status(401).json({ ok: false, error: "Signature verification failed." });
  }

  try {
    const normalizedCode = getCapturedReferralCode(req);
    if (!normalizedCode) {
      logReferralAudit("bind-rejected", {
        reason: "missing-captured-code",
        wallet: redactWallet(normalizedWallet),
      });
      return res.status(400).json({ ok: false, error: "No captured referral code available." });
    }
    const db = await getDb();
    const ip =
      String(req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() || null;
    const country = req.headers["x-vercel-ip-country"] || null;

    try {
      await db.runTransaction(async (tx: any) => {
        const existingDocRef = db.collection("referrals").doc(normalizedWallet);
        const codeDocRef = db.collection("referralCodes").doc(normalizedCode);
        const existingDoc = await tx.get(existingDocRef);
        if (existingDoc.exists) {
          const error: any = new Error("Wallet is already bound to a referral code.");
          error.statusCode = 409;
          throw error;
        }

        const codeDoc = await tx.get(codeDocRef);
        if (!codeDoc.exists) {
          const error: any = new Error("Referral code not found.");
          error.statusCode = 404;
          throw error;
        }

        const policy = normalizeReferralPolicy(codeDoc.data() || {});
        if (!policy.isActive) {
          const error: any = new Error("Referral code is inactive.");
          error.statusCode = 400;
          throw error;
        }
        if (!WALLET_REGEX.test(policy.inviterWallet) || policy.inviterWallet === normalizedWallet) {
          const error: any = new Error("Invalid referral code.");
          error.statusCode = 400;
          throw error;
        }

        const codeBindingsQuery = db
          .collection("referrals")
          .where("referralCode", "==", normalizedCode);
        const codeBindingsSnap = await tx.get(codeBindingsQuery);
        const decision = resolveReferralBindingDecision(policy, codeBindingsSnap.size);
        const boundAt = Date.now();

        tx.set(existingDocRef, {
          inviteeWallet: normalizedWallet,
          inviterWallet: policy.inviterWallet,
          referralCode: normalizedCode,
          boundAt,
          ip,
          country,
          network,
          isNewUser: Boolean(isNewUser),
          env: process.env.NODE_ENV ?? "production",
          verifiedByServer: true,
          beneficiaryWallet: decision.beneficiaryWallet,
          beneficiaryType: decision.beneficiaryType,
          secondaryBeneficiaryWallet: decision.secondaryBeneficiaryWallet,
          bindingSequence: decision.bindingSequence,
          protectedThreshold: decision.protectedThreshold,
          wasProtectedBucket: decision.wasProtectedBucket,
          allocationModeAtBind: decision.allocationModeAtBind,
          masterWalletAtBind: decision.masterWalletAtBind,
          contractExpiredAtBind: decision.contractExpired,
          isKOLAtBind: decision.isKOLAtBind,
          routingVersion: decision.routingVersion,
          routingResolvedAt: boundAt,
        });
      });
    } catch (error: any) {
      clearReferralCaptureCookie(res);
      logReferralAudit("bind-rejected", {
        reason: error?.statusCode ? String(error.message || "bind-rejected") : "transaction-failed",
        wallet: redactWallet(normalizedWallet),
        code: redactReferralCode(normalizedCode),
      });
      if (error?.statusCode) {
        return res.status(error.statusCode).json({ ok: false, error: error.message });
      }
      throw error;
    }

    clearReferralCaptureCookie(res);
    logReferralAudit("bind-completed", {
      wallet: redactWallet(normalizedWallet),
      code: redactReferralCode(normalizedCode),
      network,
    });

    const response: ReferralBindResponse = {
      ok: true,
      message: "Wallet successfully bound to referral code.",
    };
    return res.status(200).json(response);
  } catch (error) {
    logReferralError("bind", error, { walletAddress: normalizedWallet });
    return res.status(500).json({ ok: false, error: "Unable to complete referral binding right now." });
  }
}
