import {
  enforceRateLimit,
  isValidReferralCode,
  logReferralAudit,
  normalizeReferralCode,
  redactReferralCode,
  setPrivateApiHeaders,
  setReferralCaptureCookie,
} from "./_lib";
import type { ReferralCaptureRequest, ReferralCaptureResponse } from "@shared/referral";

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "referral-capture", 20, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const body = req.body as Partial<ReferralCaptureRequest>;
  const code = normalizeReferralCode(body?.code || "");
  if (!isValidReferralCode(code)) {
    logReferralAudit("capture-rejected", {
      reason: "invalid-code",
      code: redactReferralCode(code),
    });
    return res.status(400).json({ ok: false, error: "Invalid referral code." });
  }

  setReferralCaptureCookie(res, code);
  logReferralAudit("capture-accepted", {
    code: redactReferralCode(code),
  });
  const response: ReferralCaptureResponse = {
    ok: true,
    accepted: true,
  };
  return res.status(200).json(response);
}
