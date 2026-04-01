import type {
  ReferralAdminActivityItem,
  ReferralAdminActivityResponse,
} from "@shared/referral";
import {
  enforceRateLimit,
  getDb,
  logReferralError,
  setPrivateApiHeaders,
  verifyAdminSession,
} from "./_lib";

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function normalizeSearch(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function includesSearch(haystack: Array<string | number | null | undefined>, needle: string): boolean {
  if (!needle) return true;
  return haystack.some((value) => String(value || "").toLowerCase().includes(needle));
}

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "admin-activity", 60, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const adminWallet = verifyAdminSession(req);
  if (!adminWallet) {
    return res.status(401).json({ ok: false, error: "Unauthorised. Admin session required." });
  }

  const typeFilter = String(req.query?.type || "all").toLowerCase();
  const search = normalizeSearch(req.query?.search);
  const page = parsePositiveInt(req.query?.page, 1, 10_000);
  const pageSize = parsePositiveInt(req.query?.pageSize, 20, 100);

  try {
    const db = await getDb();
    const reads: Promise<any>[] = [];
    const needBindings = typeFilter === "all" || typeFilter === "binding";
    const needClaims = typeFilter === "all" || typeFilter === "claim";
    const needPayouts = typeFilter === "all" || typeFilter === "payout";

    if (needBindings) reads.push(db.collection("referrals").get());
    if (needClaims) reads.push(db.collection("referralClaimRequests").get());
    if (needPayouts) reads.push(db.collection("referralPayoutHistory").get());

    const results = await Promise.all(reads);
    let cursor = 0;
    const items: ReferralAdminActivityItem[] = [];

    if (needBindings) {
      const bindingsSnap = results[cursor++];
      for (const doc of bindingsSnap.docs) {
        const data = doc.data();
        const item: ReferralAdminActivityItem = {
          id: `binding:${doc.id}`,
          type: "binding",
          timestamp: Number(data.boundAt || 0),
          inviterWallet: String(data.inviterWallet || "").toLowerCase(),
          inviteeWallet: String(data.inviteeWallet || doc.id || "").toLowerCase(),
          referralCode: String(data.referralCode || ""),
          network: String(data.network || ""),
        };
        if (
          includesSearch(
            [item.inviterWallet, item.inviteeWallet, item.referralCode, item.network],
            search,
          )
        ) {
          items.push(item);
        }
      }
    }

    if (needClaims) {
      const claimsSnap = results[cursor++];
      for (const doc of claimsSnap.docs) {
        const data = doc.data();
        const item: ReferralAdminActivityItem = {
          id: `claim:${doc.id}`,
          type: "claim",
          timestamp: Number(data.requestedAt || data.createdAt || 0),
          inviterWallet: String(data.inviterWallet || "").toLowerCase(),
          network: String(data.network || data.receivingNetwork || ""),
          receivingWallet: String(data.receivingWallet || "").toLowerCase(),
          tokenSymbol: String(data.tokenSymbol || data.currency || ""),
          amountUSD: Number(data.requestedAmountUSD || 0),
          status: String(data.status || ""),
          txnHash: data.txnHash ? String(data.txnHash) : null,
        };
        if (
          includesSearch(
            [
              item.inviterWallet,
              item.network,
              item.receivingWallet,
              item.tokenSymbol,
              item.status,
              item.txnHash,
              item.amountUSD,
            ],
            search,
          )
        ) {
          items.push(item);
        }
      }
    }

    if (needPayouts) {
      const payoutsSnap = results[cursor++];
      for (const doc of payoutsSnap.docs) {
        const data = doc.data();
        const item: ReferralAdminActivityItem = {
          id: `payout:${doc.id}`,
          type: "payout",
          timestamp: Number(data.sentAt || data.processedAt || 0),
          inviterWallet: String(data.inviterWallet || "").toLowerCase(),
          network: String(data.network || data.receivingNetwork || ""),
          receivingWallet: String(data.receivingWallet || "").toLowerCase(),
          tokenSymbol: String(data.tokenSymbol || data.currency || ""),
          amountUSD: Number(data.amountUSD || 0),
          status: "sent",
          txnHash: data.txnHash ? String(data.txnHash) : null,
        };
        if (
          includesSearch(
            [
              item.inviterWallet,
              item.network,
              item.receivingWallet,
              item.tokenSymbol,
              item.txnHash,
              item.amountUSD,
            ],
            search,
          )
        ) {
          items.push(item);
        }
      }
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    const response: ReferralAdminActivityResponse = {
      ok: true,
      items: paged,
      total,
      page,
      pageSize,
    };
    return res.status(200).json(response);
  } catch (error) {
    logReferralError("admin-activity", error, { adminWallet, typeFilter, search });
    return res.status(500).json({ ok: false, error: "Unable to load referral activity right now." });
  }
}
