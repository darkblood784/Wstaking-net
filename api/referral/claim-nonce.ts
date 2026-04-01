import {
  createClaimNonce,
  enforceRateLimit,
  isValidWallet,
  logReferralAudit,
  redactWallet,
  setPrivateApiHeaders,
} from "./_lib";
import type { ClaimNonceResponse } from "@shared/referral";

export default function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "claim-nonce", 20, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const wallet = String(req.query.wallet || "").trim();
  if (!isValidWallet(wallet)) {
    logReferralAudit("claim-nonce-rejected", {
      reason: "invalid-wallet",
      wallet: redactWallet(wallet),
    });
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }

  const { challengeToken, message } = createClaimNonce(wallet);
  logReferralAudit("claim-nonce-issued", {
    wallet: redactWallet(wallet),
  });
  const responseBody: ClaimNonceResponse = { ok: true, challengeToken, message };
  return res.status(200).json(responseBody);
}
