import type {
  ReferralAdminCodeDirectoryItem,
  ReferralAdminRecentBinding,
  ReferralAdminSummaryResponse,
  ReferralAdminTopInviter,
} from "@shared/referral";
import {
  enforceRateLimit,
  getDb,
  logReferralError,
  setPrivateApiHeaders,
  verifyAdminSession,
} from "./_lib";

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "admin-summary", 60, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const adminWallet = verifyAdminSession(req);
  if (!adminWallet) {
    return res.status(401).json({ ok: false, error: "Unauthorised. Admin session required." });
  }

  try {
    const db = await getDb();
    const [codesSnap, bindingsSnap, claimsSnap, payoutsSnap] = await Promise.all([
      db.collection("referralCodes").get(),
      db.collection("referrals").get(),
      db.collection("referralClaimRequests").get(),
      db.collection("referralPayoutHistory").get(),
    ]);

    const codeByInviter = new Map<string, string>();
    const codeDirectory: ReferralAdminCodeDirectoryItem[] = [];
    let activeCodes = 0;
    for (const doc of codesSnap.docs) {
      const data = doc.data();
      const inviterWallet = String(data.inviterWallet || "").toLowerCase();
      const code = String(data.code || doc.id || "");
      const createdAt = Number(data.createdAt || 0);
      const isActive = data.isActive !== false;
      if (inviterWallet && code && !codeByInviter.has(inviterWallet)) {
        codeByInviter.set(inviterWallet, code);
      }
      if (isActive) activeCodes += 1;
      if (code && inviterWallet) {
        codeDirectory.push({
          code,
          inviterWallet,
          createdAt,
          isActive,
        });
      }
    }

    const inviterStats = new Map<string, ReferralAdminTopInviter>();
    const recentBindings: ReferralAdminRecentBinding[] = bindingsSnap.docs
      .map((doc: any) => {
        const data = doc.data();
        const inviterWallet = String(data.inviterWallet || "").toLowerCase();
        const referralCode = String(data.referralCode || "");
        const entry = inviterStats.get(inviterWallet) ?? {
          inviterWallet,
          referralCode: codeByInviter.get(inviterWallet) ?? referralCode ?? null,
          inviteeCount: 0,
          totalRequestedUSD: 0,
          totalPaidUSD: 0,
        };
        entry.inviteeCount += 1;
        inviterStats.set(inviterWallet, entry);

        return {
          inviteeWallet: String(data.inviteeWallet || doc.id || "").toLowerCase(),
          inviterWallet,
          referralCode,
          network: String(data.network || ""),
          boundAt: Number(data.boundAt || 0),
        };
      })
      .sort((a, b) => b.boundAt - a.boundAt)
      .slice(0, 8);

    let pendingClaims = 0;
    let approvedClaims = 0;
    let sentClaims = 0;
    let totalRequestedUSD = 0;
    for (const doc of claimsSnap.docs) {
      const data = doc.data();
      const inviterWallet = String(data.inviterWallet || "").toLowerCase();
      const requestedAmountUSD = Number(data.requestedAmountUSD || 0);
      totalRequestedUSD += requestedAmountUSD;

      if (data.status === "pending") pendingClaims += 1;
      if (data.status === "approved") approvedClaims += 1;
      if (data.status === "sent") sentClaims += 1;

      const entry = inviterStats.get(inviterWallet) ?? {
        inviterWallet,
        referralCode: codeByInviter.get(inviterWallet) ?? null,
        inviteeCount: 0,
        totalRequestedUSD: 0,
        totalPaidUSD: 0,
      };
      entry.totalRequestedUSD += requestedAmountUSD;
      inviterStats.set(inviterWallet, entry);
    }

    let totalPaidUSD = 0;
    for (const doc of payoutsSnap.docs) {
      const data = doc.data();
      const inviterWallet = String(data.inviterWallet || "").toLowerCase();
      const amountUSD = Number(data.amountUSD || 0);
      totalPaidUSD += amountUSD;

      const entry = inviterStats.get(inviterWallet) ?? {
        inviterWallet,
        referralCode: codeByInviter.get(inviterWallet) ?? null,
        inviteeCount: 0,
        totalRequestedUSD: 0,
        totalPaidUSD: 0,
      };
      entry.totalPaidUSD += amountUSD;
      inviterStats.set(inviterWallet, entry);
    }

    const topInviters = Array.from(inviterStats.values())
      .sort((a, b) => {
        if (b.inviteeCount !== a.inviteeCount) return b.inviteeCount - a.inviteeCount;
        if (b.totalPaidUSD !== a.totalPaidUSD) return b.totalPaidUSD - a.totalPaidUSD;
        return b.totalRequestedUSD - a.totalRequestedUSD;
      })
      .slice(0, 8);

    const response: ReferralAdminSummaryResponse = {
      ok: true,
      summary: {
        totalCodes: codesSnap.size,
        activeCodes,
        totalBindings: bindingsSnap.size,
        uniqueInviters: inviterStats.size,
        pendingClaims,
        approvedClaims,
        sentClaims,
        totalRequestedUSD,
        totalPaidUSD,
        topInviters,
        recentBindings,
        codes: codeDirectory.sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return b.createdAt - a.createdAt;
        }),
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    logReferralError("admin-summary", error, { adminWallet });
    return res.status(500).json({ ok: false, error: "Unable to load referral summary right now." });
  }
}
