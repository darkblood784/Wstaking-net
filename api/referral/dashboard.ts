import {
  calcInviterClaimableByBucket,
  calcInviteeRewardFromSnapshots,
  fetchInviteeActiveStakedUSD,
  enforceRateLimit,
  getDb,
  isValidWallet,
  setPrivateApiHeaders,
} from "./_lib";
import type {
  ReferralClaimRequest,
  ReferralDashboardData,
  ReferralDashboardResponse,
  ReferralInviteeSummary,
  ReferralPayoutHistory,
} from "@shared/referral";

function normalizeWallet(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "referral-dashboard", 20, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const inviterWallet = normalizeWallet(req.query.wallet);
  if (!isValidWallet(inviterWallet)) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }

  let db: any;
  try {
    db = await getDb();
  } catch {
    return res.status(503).json({ ok: false, error: "Firebase unavailable." });
  }

  try {
    const [codeSnap, bindingsSnap, claimRequestsSnap, payoutHistorySnap, claimCalc] =
      await Promise.all([
        db.collection("referralCodes").where("inviterWallet", "==", inviterWallet).limit(1).get(),
        db.collection("referrals").where("inviterWallet", "==", inviterWallet).get(),
        db.collection("referralClaimRequests").where("inviterWallet", "==", inviterWallet).get(),
        db.collection("referralPayoutHistory").where("inviterWallet", "==", inviterWallet).get(),
        calcInviterClaimableByBucket(db, inviterWallet, "claim-trigger"),
      ]);

    const referralCode = codeSnap.empty ? null : String(codeSnap.docs[0].data().code || "");
    const shareUrl = referralCode ? `${req.protocol}://${req.get("host")}/?r=${encodeURIComponent(referralCode)}` : "";

    const invitees: ReferralInviteeSummary[] = await Promise.all(
      bindingsSnap.docs.map(async (doc: any) => {
        const binding = doc.data();
        const inviteeWallet = normalizeWallet(binding.inviteeWallet);
        const network = String(binding.network || "unknown");
        const [liveStake, rewardSnapshot] = await Promise.all([
          fetchInviteeActiveStakedUSD(inviteeWallet, network).catch(() => ({
            activeStakedUSD: 0,
            firstStakeMs: null,
          })),
          calcInviteeRewardFromSnapshots(db, inviteeWallet).catch(() => ({
            inviteeWallet,
            snapshots: [],
            totalEarnedUSD: 0,
          })),
        ]);

        const anchorMs = Math.max(
          toNumber(binding.boundAt),
          toNumber(liveStake.firstStakeMs),
        );
        const monthsElapsed =
          anchorMs > 0 ? Math.max(0, Math.floor((Date.now() - anchorMs) / (30 * 24 * 60 * 60 * 1000))) : 0;

        return {
          inviteeWallet,
          boundAt: toNumber(binding.boundAt),
          network,
          activeStakedUSD: liveStake.activeStakedUSD,
          monthsElapsed,
          earnedUSD: rewardSnapshot.totalEarnedUSD,
        };
      }),
    );

    invitees.sort((a, b) => b.boundAt - a.boundAt);

    const pendingClaimRequests: ReferralClaimRequest[] = claimRequestsSnap.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          requestedAt: toNumber(data.requestedAt || data.createdAt),
          createdAt: toNumber(data.createdAt),
          updatedAt: toNumber(data.updatedAt),
          requestedAmountUSD: toNumber(data.requestedAmountUSD),
          snapshotClaimableUSD: toNumber(data.snapshotClaimableUSD),
          serverCalculatedClaimableUSD: toNumber(data.serverCalculatedClaimableUSD),
          totalEarnedUSD: toNumber(data.totalEarnedUSD),
          currency: data.currency,
          network: data.network || data.receivingNetwork,
          tokenAddress: data.tokenAddress || null,
          tokenSymbol: data.tokenSymbol || data.currency || null,
          receivingNetwork: String(data.receivingNetwork || ""),
          receivingWallet: String(data.receivingWallet || ""),
          rewardBreakdown: Array.isArray(data.rewardBreakdown)
            ? data.rewardBreakdown.map((item: any) => ({
                inviteeWallet: String(item.inviteeWallet || ""),
                earnedUSD: toNumber(item.earnedUSD),
              }))
            : [],
          status: data.status,
          adminNote: data.adminNote || null,
          processedAt: toNumber(data.processedAt),
          txnHash: data.txnHash || null,
        } as ReferralClaimRequest;
      })
      .sort((a, b) => toNumber(b.requestedAt || b.createdAt) - toNumber(a.requestedAt || a.createdAt));

    const payoutHistory: ReferralPayoutHistory[] = payoutHistorySnap.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          claimRequestId: data.claimRequestId || data.claimId || null,
          amountUSD: toNumber(data.amountUSD),
          currency: data.currency,
          network: data.network || data.receivingNetwork,
          tokenAddress: data.tokenAddress || null,
          tokenSymbol: data.tokenSymbol || data.currency || null,
          receivingNetwork: String(data.receivingNetwork || ""),
          receivingWallet: String(data.receivingWallet || ""),
          txnHash: data.txnHash || null,
          sentAt: toNumber(data.sentAt || data.processedAt),
          processedAt: toNumber(data.processedAt),
        } as ReferralPayoutHistory;
      })
      .sort((a, b) => toNumber(b.sentAt || b.processedAt) - toNumber(a.sentAt || a.processedAt));

    const dashboard: ReferralDashboardData = {
      inviterWallet,
      referralCode,
      shareUrl,
      invitees,
      totalEarnedUSD: claimCalc.totalEarnedUSD,
      totalPaidUSD: claimCalc.totalPaidUSD,
      claimableAmountUSD: claimCalc.claimableAmountUSD,
      claimBuckets: claimCalc.buckets.map((bucket) => ({
        key: bucket.key,
        network: bucket.network,
        tokenAddress: bucket.tokenAddress,
        tokenSymbol: bucket.tokenSymbol,
        currency: bucket.currency,
        totalEarnedUSD: bucket.totalEarnedUSD,
        totalRequestedUSD: bucket.totalRequestedUSD,
        pendingRequestedUSD: bucket.pendingRequestedUSD,
        approvedRequestedUSD: bucket.approvedRequestedUSD,
        totalPaidUSD: bucket.totalPaidUSD,
        claimableAmountUSD: bucket.claimableAmountUSD,
      })),
      pendingClaimRequests,
      payoutHistory,
    };

    const response: ReferralDashboardResponse = { ok: true, dashboard };
    return res.status(200).json(response);
  } catch {
    return res.status(500).json({
      ok: false,
      error: "Failed to load referral dashboard.",
    } satisfies ReferralDashboardResponse);
  }
}
