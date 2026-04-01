import type { ReferralCheckCodeResponse } from "@shared/referral";
import {
  enforceRateLimit,
  getReferralCodeValidationError,
  logReferralError,
  normalizeReferralCode,
  setPrivateApiHeaders,
} from "./_lib";

async function getDb() {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (getApps().length === 0) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
    initializeApp({ credential: cert(JSON.parse(json)) });
  }
  return getFirestore();
}

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "check-code", 30, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const code = normalizeReferralCode(req.query?.code || "");
  const validationError = getReferralCodeValidationError(code);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  try {
    const db = await getDb();
    const snap = await db.collection("referralCodes").doc(code).get();
    const response: ReferralCheckCodeResponse = {
      ok: true,
      code,
      available: !snap.exists,
    };
    return res.status(200).json(response);
  } catch (error) {
    logReferralError("check-code", error);
    return res.status(500).json({ ok: false, error: "Check failed." });
  }
}
