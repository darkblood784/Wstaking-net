/**
 * ClaimHistory
 * Displays the inviter's submitted claim requests and confirmed payouts.
 */

import { History, CheckCircle2, Clock, XCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReferralClaimRequest, ReferralPayoutHistory } from "@shared/referral";
import { formatNumber } from "@/utils/formatNumber";

interface ClaimHistoryProps {
  claimRequests: ReferralClaimRequest[];
  payoutHistory: ReferralPayoutHistory[];
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    label: "referral.history.status.pending",
    icon: Clock,
    className: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  approved: {
    label: "referral.history.status.approved",
    icon: CheckCircle2,
    className: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  rejected: {
    label: "referral.history.status.rejected",
    icon: XCircle,
    className: "text-red-400 bg-red-400/10 border-red-400/20",
  },
  sent: {
    label: "referral.history.status.sent",
    icon: Send,
    className: "text-ws-green bg-ws-green/10 border-ws-green/20",
  },
} as const;

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClaimHistory({
  claimRequests,
  payoutHistory,
  isLoading = false,
}: ClaimHistoryProps) {
  const { t } = useTranslation();
  const hasAny = claimRequests.length > 0 || payoutHistory.length > 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6 animate-pulse space-y-3">
        <div className="h-4 w-24 bg-white/10 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="h-16 w-full bg-white/10 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-ws-green" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {t("referral.history.title")}
        </p>
      </div>

      {!hasAny ? (
        <div className="text-center py-6">
          <History className="w-7 h-7 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/35">{t("referral.history.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claimRequests.map((req) => {
            const cfg =
              STATUS_CONFIG[req.status] ?? STATUS_CONFIG["pending"];
            const Icon = cfg.icon;
            return (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg.className}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {t(cfg.label)}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatDate(req.requestedAt)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    ${formatNumber(req.requestedAmountUSD, 2)} {req.tokenSymbol || req.currency || "USD"}
                  </p>
                  <p className="text-xs text-white/35">
                    {t("referral.history.to")}: {(req.network || req.receivingNetwork)} ·{" "}
                    {req.receivingWallet
                      ? `${req.receivingWallet.slice(0, 6)}…${req.receivingWallet.slice(-4)}`
                      : "—"}
                  </p>
                  {req.adminNote && (
                    <p className="text-xs text-white/40 mt-1 italic">
                      {t("referral.history.note")}: {req.adminNote}
                    </p>
                  )}
                  {req.txnHash && (
                    <p className="text-xs text-ws-green/70 mt-1 font-mono truncate">
                      {t("referral.history.txn")}: {req.txnHash}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {payoutHistory.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 pt-2">
                {t("referral.history.confirmedPayouts")}
              </p>
              {payoutHistory.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between rounded-xl border border-ws-green/15 bg-ws-green/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ws-green">
                      +${formatNumber(payout.amountUSD, 2)} {payout.tokenSymbol || payout.currency || "USD"}
                    </p>
                    <p className="text-xs text-white/35">
                      {(payout.network || payout.receivingNetwork)} · {formatDate(payout.sentAt)}
                    </p>
                    {payout.txnHash && (
                      <p className="text-xs text-ws-green/60 font-mono truncate mt-0.5">
                        {payout.txnHash}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-ws-green/50 shrink-0" />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
