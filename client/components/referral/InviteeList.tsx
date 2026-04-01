/**
 * InviteeList
 * Displays each referred user with their staking activity and per-invitee reward.
 */

import { Users, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReferralInviteeSummary } from "@shared/referral";
import { formatNumber } from "@/utils/formatNumber";

interface InviteeListProps {
  invitees: ReferralInviteeSummary[];
  isLoading?: boolean;
}

function shortenWallet(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InviteeList({ invitees, isLoading = false }: InviteeListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6 space-y-3 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-full bg-white/10 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-ws-green" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {t("referral.invitees.title")}
        </p>
        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-ws-green/10 border border-ws-green/30 text-ws-green text-xs font-semibold">
          {invitees.length}
        </span>
      </div>

      {invitees.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/40">
            {t("referral.invitees.empty")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left pb-2 pl-1">{t("referral.invitees.wallet")}</th>
                <th className="text-left pb-2">{t("referral.invitees.joined")}</th>
                <th className="text-right pb-2">{t("referral.invitees.activeStake")}</th>
                <th className="text-right pb-2">{t("referral.invitees.months")}</th>
                <th className="text-right pb-2 pr-1">{t("referral.invitees.earned")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invitees.map((inv) => (
                <tr key={inv.inviteeWallet} className="hover:bg-white/[0.02]">
                  <td className="py-3 pl-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-white/75">
                        {shortenWallet(inv.inviteeWallet)}
                      </span>
                      <a
                        href={`https://bscscan.com/address/${inv.inviteeWallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/30 hover:text-ws-green transition-colors"
                        title={t("referral.invitees.viewOnExplorer")}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="text-[10px] text-white/30 capitalize">
                      {inv.network}
                    </span>
                  </td>
                  <td className="py-3 text-white/55">{formatDate(inv.boundAt)}</td>
                  <td className="py-3 text-right">
                    {inv.activeStakedUSD > 0 ? (
                      <span className="text-white/80">
                        ${formatNumber(inv.activeStakedUSD)}
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs italic">{t("referral.invitees.noActiveStake")}</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={
                        inv.monthsElapsed >= 1
                          ? "text-ws-green font-semibold"
                          : "text-white/40"
                      }
                    >
                      {inv.monthsElapsed}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-1">
                    {inv.earnedUSD > 0 ? (
                      <span className="text-ws-green font-semibold">
                        +${formatNumber(inv.earnedUSD, 2)}
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invitees.length > 0 && (
        <p className="mt-3 text-[10px] text-white/30 leading-relaxed">
          {t("referral.invitees.note")}
        </p>
      )}
    </div>
  );
}
