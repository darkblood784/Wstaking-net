import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useTranslation } from "react-i18next";
import { FormattedStakeInfo } from "@/utils/userStakesUtils";
import { limitDecimalPoint } from "@/utils/limitDecimalPoint";

interface PastStakeCardProps {
  stake: FormattedStakeInfo;
  onRestake: (stake: FormattedStakeInfo) => void;
}

const PastStakeCard: React.FC<PastStakeCardProps> = ({ stake, onRestake }) => {
  const { selectedToken } = useSelectedToken();
  const { t } = useTranslation();

  const trimTrailingZeros = (value: string) =>
    value.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");

  const formatCompactNumber = (value: string | number | null | undefined, decimals: number) =>
    trimTrailingZeros(limitDecimalPoint(value ?? "0", decimals));

  return (
    <div className="rounded-2xl bg-[#050606] border border-[#1f2a25] w-full max-w-xl mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden h-full flex flex-col">
      <div className="px-4 sm:px-6 md:px-8 pt-5 sm:pt-6 md:pt-7 pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedToken.icon}
              alt={selectedToken.symbol}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-[#12251d] bg-black p-1"
            />
            <span className="text-white text-base sm:text-lg font-semibold tracking-wide">
              {selectedToken.symbol}
            </span>
          </div>
          <a
            href={`/version?selected=${stake.version}`}
            className="text-white/70 text-xs sm:text-sm font-semibold hover:text-white transition-colors"
            title={`${t("version")} ${stake.version}`}
          >
            V {stake.version}
          </a>
        </div>

        <div className="mt-4 h-px w-[calc(100%+2rem)] -mx-4 sm:w-[calc(100%+3rem)] sm:-mx-6 md:w-[calc(100%+4rem)] md:-mx-8 bg-[#2f3f36]" />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-4 py-1 rounded-full text-xs font-semibold shadow-sm bg-[#12B980] text-black">
              {t("originalapr")}
            </span>
            {stake.unstakeKind && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  stake.unstakeKind === "partial"
                    ? "text-[#FBBF24] border-[#FBBF24]/40 bg-[#FBBF24]/10"
                    : "text-white/80 border-white/20 bg-white/5"
                }`}
              >
                {stake.unstakeKind === "partial"
                  ? t("pastStakes.partialUnstakeTag", "Partial Unstake")
                  : t("pastStakes.fullUnstakeTag", "Full Unstake")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-white px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-2">
        <div className="min-h-[72px] sm:min-h-[80px] flex flex-col">
          <div className="text-xs text-ws-gray mb-1">{t("activeStake.stakingAmount")}</div>
          <div className="relative group">
            <div className="text-base sm:text-lg font-bold leading-tight tabular-nums truncate">
              {formatCompactNumber(stake.totalStaked, 4)} {selectedToken.symbol}
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-max max-w-[220px] rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {formatCompactNumber(stake.totalStaked, 4)} {selectedToken.symbol}
            </div>
          </div>
        </div>
        <div className="min-h-[72px] sm:min-h-[80px] flex flex-col">
          <div className="text-xs text-ws-gray mb-1">{t("apr")}</div>
          <div className="relative group">
            <div className="text-base sm:text-lg font-bold leading-tight tabular-nums truncate">
              {stake.adjustedAPR || stake.apr}
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-max max-w-[220px] rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {stake.adjustedAPR || stake.apr}
            </div>
          </div>
        </div>
        <div className="min-h-[72px] sm:min-h-[80px] flex flex-col">
          <div className="text-xs text-ws-gray mb-1">{t("totalrewards")}</div>
          <div className="relative group">
            <div className="text-base sm:text-lg font-bold leading-tight tabular-nums truncate">
              {formatCompactNumber(stake.claimedRewards || "0", 10)} {selectedToken.symbol}
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-max max-w-[240px] rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {formatCompactNumber(stake.claimedRewards || "0", 10)} {selectedToken.symbol}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-white px-4 sm:px-6 md:px-8 pb-5 sm:pb-6">
        <div className="min-h-[68px] sm:min-h-[76px] flex flex-col">
          <div className="text-xs text-ws-gray mb-1">{t("plan")}</div>
          <div className="relative group">
            <div className="text-base sm:text-lg font-bold leading-tight truncate">
              {stake.duration}
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-max max-w-[220px] rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {stake.duration}
            </div>
          </div>
        </div>
        <div className="min-h-[68px] sm:min-h-[76px] flex flex-col">
          <div className="text-xs text-ws-gray mb-1">{t("activeStake.stakedOn")}</div>
          <div className="relative group">
            <div className="text-base sm:text-lg font-bold leading-tight truncate">
              {stake.startDate}
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-max max-w-[240px] rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {stake.startDate}
            </div>
          </div>
        </div>
        <div className="min-h-[68px] sm:min-h-[76px] flex flex-col">
          <div className="text-xs text-ws-gray mb-1">{t("expecteddate")}</div>
          <div className="relative group">
            <div className="text-base sm:text-lg font-bold leading-tight truncate">
              {stake.endDate}
            </div>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-max max-w-[240px] rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {stake.endDate}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 pb-5 sm:pb-6 mt-auto">
        <button
          type="button"
          onClick={() => onRestake(stake)}
          className="w-full rounded-xl bg-[#12B980] text-black py-3 text-sm sm:text-base font-semibold hover:opacity-95 transition shadow-[0_8px_24px_rgba(18,185,128,0.2)]"
        >
          {t("stakeAgain")}
        </button>
      </div>
    </div>
  );
};

export default PastStakeCard;
