import type {
  ReferralAdminCodePolicyRequest,
  ReferralAdminCodePolicyResponse,
} from "@shared/referral";
import {
  enforceRateLimit,
  getDb,
  isReservedReferralCode,
  logReferralAudit,
  logReferralError,
  normalizeReferralCode,
  redactReferralCode,
  redactWallet,
  setPrivateApiHeaders,
  verifyAdminSession,
  WALLET_REGEX,
} from "./_lib";

const ALLOCATION_MODES = new Set(["owner_only", "owner_master_80_20"]);

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "admin-code-policy", 30, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const adminWallet = verifyAdminSession(req);
  if (!adminWallet) {
    return res.status(401).json({ ok: false, error: "Unauthorised. Admin session required." });
  }

  const code = normalizeReferralCode(
    req.method === "GET" ? String(req.query?.code || "") : String((req.body || {}).code || ""),
  );
  if (!code || isReservedReferralCode(code)) {
    logReferralAudit("admin-code-policy-rejected", {
      reason: "invalid-code",
      adminWallet: redactWallet(adminWallet),
      code: redactReferralCode(code),
    });
    return res.status(400).json({ ok: false, error: "Invalid referral code." });
  }

  const updates: Record<string, any> = {};
  const body = (req.body || {}) as ReferralAdminCodePolicyRequest;
  if (req.method === "POST") {
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.isKOL === "boolean") updates.isKOL = body.isKOL;
    if (body.allocationMode !== undefined) {
      if (!ALLOCATION_MODES.has(String(body.allocationMode))) {
        return res.status(400).json({ ok: false, error: "Invalid allocation mode." });
      }
      updates.allocationMode = body.allocationMode;
    }
    if (body.contractEnd !== undefined) {
      if (body.contractEnd !== null) {
        const parsed = Number(body.contractEnd);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return res.status(400).json({ ok: false, error: "Invalid contract end timestamp." });
        }
        updates.contractEnd = Math.floor(parsed);
      } else {
        updates.contractEnd = null;
      }
    }
    if (body.masterWallet !== undefined) {
      if (body.masterWallet !== null) {
        const normalizedMasterWallet = String(body.masterWallet).trim().toLowerCase();
        if (!WALLET_REGEX.test(normalizedMasterWallet)) {
          return res.status(400).json({ ok: false, error: "Invalid master wallet." });
        }
        updates.masterWallet = normalizedMasterWallet;
      } else {
        updates.masterWallet = null;
      }
    }
  }

  if (req.method === "POST" && Object.keys(updates).length === 0) {
    logReferralAudit("admin-code-policy-rejected", {
      reason: "empty-update",
      adminWallet: redactWallet(adminWallet),
      code: redactReferralCode(code),
    });
    return res.status(400).json({ ok: false, error: "No policy updates were provided." });
  }

  try {
    const db = await getDb();
    const ref = db.collection("referralCodes").doc(code);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Referral code not found." });
    }

    let next = snap.data() || {};
    if (req.method === "POST") {
      await ref.set(
        {
          ...updates,
          policyUpdatedAt: Date.now(),
          policyUpdatedBy: adminWallet,
        },
        { merge: true },
      );
      next = { ...next, ...updates };
    }

    const response: ReferralAdminCodePolicyResponse = {
      ok: true,
      code,
      inviterWallet: String(next.inviterWallet || "").trim().toLowerCase() || undefined,
      createdAt: Number.isFinite(Number(next.createdAt)) ? Number(next.createdAt) : undefined,
      isActive: next.isActive !== false,
      isKOL: Boolean(next.isKOL),
      allocationMode:
        String(next.allocationMode || "").trim().toLowerCase() === "owner_only"
          ? "owner_only"
          : "owner_master_80_20",
      contractEnd: Number.isFinite(Number(next.contractEnd)) && Number(next.contractEnd) > 0
        ? Number(next.contractEnd)
        : null,
      masterWallet: WALLET_REGEX.test(String(next.masterWallet || "").trim().toLowerCase())
        ? String(next.masterWallet || "").trim().toLowerCase()
        : null,
      masterWalletConfigured: WALLET_REGEX.test(String(next.masterWallet || "").trim().toLowerCase()),
    };

    if (req.method === "POST") {
      logReferralAudit("admin-code-policy-updated", {
        adminWallet: redactWallet(adminWallet),
        code: redactReferralCode(code),
        fields: Object.keys(updates).sort(),
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    logReferralError("admin-code-policy", error, { adminWallet, code });
    return res.status(500).json({
      ok: false,
      error:
        req.method === "GET"
          ? "Unable to load referral code policy right now."
          : "Unable to update referral code policy right now.",
    });
  }
}
