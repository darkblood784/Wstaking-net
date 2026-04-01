import { useAccount, useChainId } from "wagmi";
import { useTranslation } from "react-i18next";
import { useUserStakes } from "@/contexts/UserStakesContext";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { getNetworkConfig, getNetworkName } from "@/utils/networkUtils";

export function StakingPlans() {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { userLockedStakes, userUnlockedStakes, fetchUserStakeData, loading } =
    useUserStakes();
  const { selectedToken, changeSelectedToken } = useSelectedToken();
  const activeStakes = userLockedStakes.slice(0, 3);
  const unlockedStakes = userUnlockedStakes.slice(0, 3);

  const hasStakes =
    (activeStakes && activeStakes.length > 0) ||
    (unlockedStakes && unlockedStakes.length > 0);

  const networkName = getNetworkName(chainId);
  const networkConfig = getNetworkConfig(chainId);

  const handleRefresh = async () => {
    if (!address) return;
    await fetchUserStakeData(address, selectedToken.address, chainId);
  };

  return (
    <section className="relative py-12 md:py-24 px-4">
      {/* Background gradient orb */}
      <div className="absolute left-[10%] top-[10%] w-[300px] h-[300px] md:w-[625px] md:h-[625px] opacity-15 pointer-events-none">
        <svg
          viewBox="0 0 1913 1677"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_plans)">
            <ellipse
              cx="1074.19"
              cy="838.089"
              rx="594.577"
              ry="591.984"
              transform="rotate(-47.8358 1074.19 838.089)"
              fill="#48DC84"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_plans"
              x="118.068"
              y="-118.295"
              width="1912.25"
              height="1912.77"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur stdDeviation="181.484" />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-inter font-bold mb-4 sm:mb-6">
            {t("stakingPlans.title")}
          </h2>
          <p className="text-ws-gray text-sm sm:text-base md:text-2xl lg:text-3xl font-inter">
            {t("stakingPlans.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
          <span className="text-ws-gray font-inter text-xs sm:text-sm md:text-base">
            {t("stakingPlans.tokenLabel")}
          </span>
          {["USDT", "USDC"].map((token) => (
            <button
              key={token}
              onClick={() => changeSelectedToken(token as "USDT" | "USDC")}
              className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full font-inter text-xs sm:text-sm md:text-base font-medium transition-colors ${
                selectedToken.symbol.includes(token)
                  ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                  : "border-2 border-ws-card-border text-white hover:border-ws-green"
              }`}
            >
              {token}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 md:mb-10 text-[10px] sm:text-xs md:text-sm text-ws-gray">
          <span>
            {t("stakingPlans.networkLabel")} {networkName}
          </span>
          <span>
            {t("stakingPlans.contractLabel")} {networkConfig.contractAddress || t("common.placeholder")}
          </span>
          <span>
            {t("stakingPlans.tokenAddressLabel")} {selectedToken.symbol} ({selectedToken.address || t("common.placeholder")})
          </span>
          <button
            onClick={handleRefresh}
            className="px-2.5 sm:px-3 py-1 rounded-full border border-ws-card-border text-white hover:border-ws-green transition-colors"
          >
            {loading ? t("stakingPlans.refreshing") : t("stakingPlans.refresh")}
          </button>
        </div>

        {!isConnected || !hasStakes ? (
          <div className="max-w-2xl mx-auto backdrop-blur-xl rounded-[32px] md:rounded-[43px] border border-ws-card-border md:border-2 bg-transparent p-6 sm:p-10 md:p-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-36 md:h-36 rounded-[22px] md:rounded-[28px] border-2 border-[#282D29] flex items-center justify-center mb-6 sm:mb-8">
                <svg
                  viewBox="0 0 54 54"
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5634 5.57946C13.1117 3.62408 15.9863 2.14074 19.051 1.19665C19.4932 1.06041 19.7143 0.992287 19.9004 1.09514C20.0864 1.19799 20.1478 1.4273 20.2707 1.88593L26.7412 26.0341C26.8632 26.4894 26.9242 26.7171 26.8206 26.8964C26.7171 27.0758 26.4894 27.1368 26.0341 27.2588L1.88593 33.7293C1.4273 33.8522 1.19799 33.9136 1.01591 33.804C0.833835 33.6943 0.782265 33.4687 0.679126 33.0176C-0.0355783 29.8915 -0.18827 26.6604 0.230989 23.4758C0.693794 19.9604 1.84447 16.5707 3.61731 13.5C5.39016 10.4293 7.75046 7.73794 10.5634 5.57946Z"
                    stroke="#6B7280"
                    strokeWidth="6"
                  />
                  <path
                    d="M35.1857 9.85352C38.4995 11.4355 41.284 13.944 43.2021 17.0754C45.1202 20.2067 46.0898 23.8268 45.9935 27.4977C45.8973 31.1686 44.7394 34.7329 42.6599 37.7595C40.5804 40.7861 37.6683 43.1452 34.2761 44.5514C30.8839 45.9577 27.1569 46.3508 23.546 45.6832C19.935 45.0156 16.5949 43.316 13.9297 40.7899"
                    stroke="#6B7280"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-white text-lg sm:text-xl md:text-[33px] font-inter font-bold mb-3 sm:mb-4">
                {t("stakingPlans.emptyTitle")}
              </h3>
              <p className="text-ws-gray text-sm sm:text-base md:text-[27px] font-inter">
                {t("stakingPlans.emptySubtitle")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeStakes.map((stake) => (
              <div
                key={stake.txnHash}
                className="rounded-[28px] border-2 border-ws-card-border bg-[#0F1110] p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-inter font-semibold">
                    {t("stakingPlans.activeStake")}
                  </span>
                  <span className="text-ws-green font-inter">{stake.apr}</span>
                </div>
                <p className="text-ws-gray text-sm mb-1">
                  {t("stakingPlans.amountLabel")} {stake.totalStaked}
                </p>
                <p className="text-ws-gray text-sm mb-1">
                  {t("stakingPlans.endLabel")} {stake.endDate}
                </p>
                <p className="text-ws-gray text-sm">
                  {t("stakingPlans.rewardsLabel")} {stake.rewards}
                </p>
              </div>
            ))}
            {unlockedStakes.map((stake) => (
              <div
                key={`${stake.txnHash}-unlocked`}
                className="rounded-[28px] border-2 border-[#1E2A24] bg-[#0B1210] p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-inter font-semibold">
                    {t("stakingPlans.unlockedStake")}
                  </span>
                  <span className="text-ws-gray font-inter">{stake.apr}</span>
                </div>
                <p className="text-ws-gray text-sm mb-1">
                  {t("stakingPlans.amountLabel")} {stake.totalStaked}
                </p>
                <p className="text-ws-gray text-sm mb-1">
                  {t("stakingPlans.unlockedLabel")} {stake.unlockedAt}
                </p>
                <p className="text-ws-gray text-sm">
                  {t("stakingPlans.claimedLabel")} {stake.claimedRewards}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
