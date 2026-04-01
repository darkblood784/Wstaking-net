import {
  enforceRateLimit,
  getDb,
  logReferralError,
  setPrivateApiHeaders,
  verifyAdminSession,
} from "./_lib";
import type { AdminClaimsListResponse } from "@shared/referral";

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "admin-claims", 60, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const adminWallet = verifyAdminSession(req);
  if (!adminWallet) {
    return res.status(401).json({ ok: false, error: "Unauthorised. Admin session required." });
  }

  try {
    const db = await getDb();
    const snap = await db
      .collection("referralClaimRequests")
      .orderBy("createdAt", "desc")
      .get();

    const claims = snap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const response: AdminClaimsListResponse = { ok: true, claims };
    return res.status(200).json(response);
  } catch (error) {
    logReferralError("admin-claims", error, { adminWallet });
    return res.status(500).json({ ok: false, error: "Unable to load claim requests right now." });
  }
}
