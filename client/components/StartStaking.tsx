import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAccount, useChainId } from "wagmi";
import { format } from "date-fns";
import { useNotification } from "@/components/NotificationProvider";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useUserDetails } from "@/contexts/UserDetailsContext";
import { useRefreshStakes } from "@/contexts/RefreshStakesContext";
import { useSystemDetails } from "@/contexts/SystemDetailsContext";
import usePromotion from "@/hooks/usePromotion";
import useStake from "@/hooks/useStake";
import {
  ADMIN_NORMAL_DURATION_CONFIGS,
  ADMIN_PROMOTION_DURATION_CONFIGS,
  USER_NORMAL_DURATION_CONFIGS,
  USER_PROMOTION_DURATION_CONFIGS,
  DurationName,
} from "@/configs/durationConfigs";
import { getTokenConfigs, SupportedToken } from "@/configs/tokenConfigs";
import { getAdjustedAPR } from "@/utils/userStakesUtils";
import { customReadContract } from "@/utils/customReadContract";
import { convertToBlockchainNumber, limitDecimalPoint } from "@/utils/limitDecimalPoint";
import StakingModal from "@/components/StakingModal";
import BigNumber from "bignumber.js";
import { getNetworkName } from "@/utils/networkUtils";

const DEV_MIN_STAKE = new BigNumber(10);
const DEV_MAX_THRESHOLD = new BigNumber(10000);
const MINUTES_IN_YEAR = new BigNumber(525600);

const getLocalPreviewApr = (amount: string, durationInMinutes: number): BigNumber | null => {
  if (durationInMinutes === 6) {
    return new BigNumber(10000);
  }

  if (durationInMinutes !== 5) {
    return null;
  }

  const stakeAmount = new BigNumber(amount || "0");
  if (stakeAmount.isNaN()) {
    return new BigNumber(5000);
  }

  if (stakeAmount.isLessThanOrEqualTo(DEV_MIN_STAKE)) {
    return new BigNumber(5000);
  }

  if (stakeAmount.isGreaterThanOrEqualTo(DEV_MAX_THRESHOLD)) {
    return new BigNumber(10000);
  }

  return new BigNumber(5000).plus(
    stakeAmount
      .minus(DEV_MIN_STAKE)
      .multipliedBy(5000)
      .dividedBy(DEV_MAX_THRESHOLD.minus(DEV_MIN_STAKE))
  );
};

export function StartStaking() {
  const { t } = useTranslation();
  const tutorialUrl =
    import.meta.env.VITE_TUTORIAL_URL ||
    "https://www.instagram.com/reel/DUp-UkMiDft/";
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { showNotification } = useNotification();
  const { selectedToken, changeSelectedToken } = useSelectedToken();
  const { isAdmin, walletBalance } = useUserDetails();
  const { refreshAllStakes } = useRefreshStakes();
  const { fetchTotalStaked } = useSystemDetails();
  const { promotionActive } = usePromotion();

  const [selectedPeriod, setSelectedPeriod] =
    useState<DurationName>("1 Month");
  const [rawApr, setRawApr] = useState<string>("—");
  const [apr, setApr] = useState<string>("—");
  const [unlockDate, setUnlockDate] = useState<string>("—");
  const [youWillGet, setYouWillGet] = useState<string>("—");
  const [percentage, setPercentage] = useState<number | null>(null);
  const [percentInput, setPercentInput] = useState<string>("");
  const [isPercentFocused, setIsPercentFocused] = useState(false);
  const [amount, setAmount] = useState("");
  const [systemStatus, setSystemStatus] = useState<boolean>(true);
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(false);
  const [hasReachedStakeRulesEnd, setHasReachedStakeRulesEnd] = useState<boolean>(false);
  const [hasReachedDisclaimerEnd, setHasReachedDisclaimerEnd] = useState<boolean>(false);
  const [isStakeRulesOpen, setIsStakeRulesOpen] = useState<boolean>(true);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const postStakeRefreshTriggeredRef = useRef(false);

  const openDisclaimer = () => {
    setIsDisclaimerOpen(true);
    setHasReachedDisclaimerEnd(false);
  };

  const durationConfigs = useMemo(() => {
    if (isAdmin) {
      return promotionActive
        ? ADMIN_PROMOTION_DURATION_CONFIGS
        : ADMIN_NORMAL_DURATION_CONFIGS;
    }
    return promotionActive
      ? USER_PROMOTION_DURATION_CONFIGS
      : USER_NORMAL_DURATION_CONFIGS;
  }, [isAdmin, promotionActive]);

  const durationOptions = useMemo(() => {
    const supported = selectedToken?.supportedDurations || [];
    const allOptions = Object.keys(durationConfigs) as DurationName[];
    const supportedOptions = allOptions.filter((duration) =>
      supported.includes(duration as DurationName)
    );

    const promoOptions = supportedOptions.filter(
      (duration) => durationConfigs[duration]?.isPromotion
    );
    const normalOptions = supportedOptions.filter(
      (duration) => !durationConfigs[duration]?.isPromotion
    );

    const adminNormalMinute = allOptions.find((duration) => duration === "5 Minutes");
    const adminPromoMinute = allOptions.find((duration) => duration === "6 Minutes");

    const unique = (items: DurationName[]) => {
      const seen = new Set<DurationName>();
      return items.filter((item) => {
        if (seen.has(item)) return false;
        seen.add(item);
        return true;
      });
    };

    if (isAdmin) {
      if (promotionActive) {
        return unique([
          ...(adminPromoMinute ? [adminPromoMinute] : []),
          ...promoOptions,
        ]);
      }
      return unique([
        ...(adminNormalMinute ? [adminNormalMinute] : []),
        ...normalOptions,
      ]);
    }

    if (!promotionActive) {
      return normalOptions;
    }
    return promoOptions.length > 0 ? promoOptions : supportedOptions;
  }, [durationConfigs, selectedToken, promotionActive, isAdmin]);

  const {
    validateAndStake,
    isModalOpen,
    modalState,
    modalMessage,
    modalDetails,
    closeModal,
    handleConfirmStake,
  } = useStake({
    address,
    isAdmin,
    promotionActive,
    walletBalance,
    systemStatus,
    showNotification,
    fetchTotalStaked,
    refreshAllStakes,
  });

  const tokenDisplay = selectedToken.symbol;
  const overlayRoot = typeof document !== "undefined" ? document.body : null;

  const balanceNumber = useMemo(() => {
    const parsed = new BigNumber(walletBalance || "0");
    return parsed.isNaN() ? new BigNumber(0) : parsed;
  }, [walletBalance]);

  const walletBalanceDisplay = useMemo(() => {
    return limitDecimalPoint(walletBalance || "0", 4);
  }, [walletBalance]);

  const getDurationLabel = (period: DurationName) => {
    const raw = t(period);
    return raw.split("/")[0].trim();
  };

  const tokenOptions = useMemo(() => {
    const all = getTokenConfigs();
    const networkName = getNetworkName(chainId);
    return Object.values(all[networkName] || {});
  }, [chainId]);

  const handlePercentage = (pct: number) => {
    setPercentage(pct);
    setPercentInput(pct.toFixed(2));
    if (balanceNumber.isZero()) {
      setAmount("0");
      return;
    }
    const nextAmount = balanceNumber.multipliedBy(pct).dividedBy(100);
    setAmount(nextAmount.toFixed());
  };

  const inputPercent = useMemo(() => {
    if (balanceNumber.isZero()) {
      return null;
    }
    const numericAmount = new BigNumber(amount || "0");
    if (numericAmount.isNaN() || numericAmount.isNegative()) {
      return null;
    }
    const pct = numericAmount.multipliedBy(100).dividedBy(balanceNumber);
    const clamped = pct.isGreaterThan(100)
      ? new BigNumber(100)
      : pct.isLessThan(0)
        ? new BigNumber(0)
        : pct;
    return clamped.decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed(2);
  }, [amount, balanceNumber]);

  const handlePercentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPercentInput(nextValue);
    setPercentage(null);
    if (balanceNumber.isZero()) {
      setAmount("0");
      return;
    }
    const numericPercent = new BigNumber(nextValue || "0");
    if (numericPercent.isNaN() || numericPercent.isNegative()) {
      setAmount("");
      return;
    }
    const clampedPercent = numericPercent.isGreaterThan(100)
      ? new BigNumber(100)
      : numericPercent;
    const nextAmount = balanceNumber.multipliedBy(clampedPercent).dividedBy(100);
    setAmount(nextAmount.toFixed());
  };

  useEffect(() => {
    if (isPercentFocused) {
      return;
    }
    if (!amount || balanceNumber.isZero() || inputPercent === null) {
      setPercentInput("");
      return;
    }
    setPercentInput(inputPercent);
  }, [amount, balanceNumber, inputPercent, isPercentFocused]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setAmount(nextValue);
    if (balanceNumber.isZero()) {
      setPercentage(null);
      return;
    }
    const numericAmount = new BigNumber(nextValue || "0");
    if (numericAmount.isNaN() || numericAmount.isNegative()) {
      setPercentage(null);
      return;
    }
    const pct = numericAmount.multipliedBy(100).dividedBy(balanceNumber);
    const pctRounded = Math.min(100, Math.max(0, pct.decimalPlaces(1, BigNumber.ROUND_DOWN).toNumber()));
    const matched = [25, 50, 75, 100].find((value) => Math.abs(value - pctRounded) < 0.1);
    setPercentage(matched ?? null);
  };

  const handleStake = async () => {
    if (!isConnected || !address) {
      showNotification(t("connectWallet"), "info");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showNotification(t("enterValidAmount"), "error");
      return;
    }
    await validateAndStake(amount, selectedPeriod);
  };

  useEffect(() => {
    if (durationOptions.length > 0 && !durationOptions.includes(selectedPeriod)) {
      setSelectedPeriod(durationOptions[0]);
    }
  }, [durationOptions, selectedPeriod]);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const enabled = await customReadContract("systemEnabled", []);
        setSystemStatus(Boolean(enabled));
      } catch (error) {
        console.error("Failed to fetch system status:", error);
        setSystemStatus(true);
      }
    };

    fetchSystemStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => openDisclaimer();
    window.addEventListener("open-disclaimer", handler as EventListener);
    return () => window.removeEventListener("open-disclaimer", handler as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldOpen = window.localStorage.getItem("open-disclaimer") === "1";
    if (shouldOpen) {
      window.localStorage.removeItem("open-disclaimer");
      openDisclaimer();
    }
  }, []);

  useEffect(() => {
    if (!isModalOpen || modalState !== "newstake") {
      if (!isModalOpen) {
        postStakeRefreshTriggeredRef.current = false;
      }
      return;
    }

    if (postStakeRefreshTriggeredRef.current) {
      return;
    }
    postStakeRefreshTriggeredRef.current = true;

    const delayedRefresh = window.setTimeout(() => {
      refreshAllStakes?.();
      fetchTotalStaked?.();
    }, 1800);

    return () => window.clearTimeout(delayedRefresh);
  }, [isModalOpen, modalState, refreshAllStakes, fetchTotalStaked]);

  useEffect(() => {
    if (modalState !== "newstake") {
      return;
    }

    // Reset form to initial state after a successful stake.
    setAmount("");
    setPercentage(null);
    setPercentInput("");
    setIsPercentFocused(false);
  }, [modalState]);

  useEffect(() => {
    const updateDurationInfo = async () => {
      const config = durationConfigs[selectedPeriod];
      if (!config) {
        setRawApr("—");
        setApr("—");
        setUnlockDate("—");
        setYouWillGet("—");
        return;
      }

      // Convert amount to blockchain format for APR calculation
      const blockchainAmount = convertToBlockchainNumber(amount || "0").toNumber();

      // For dev-only durations, use the configured APR locally for preview.
      // The actual stake() transaction still enforces admin/dev access on-chain.
      const localDevApr = getLocalPreviewApr(amount, config.durationInMinutes);
      const adjustedAprValue = localDevApr
        ? localDevApr.toFixed(18)
        : await getAdjustedAPR(blockchainAmount, config.durationInMinutes);

      const adjustedAprBigNumber = new BigNumber(adjustedAprValue);
      const aprDisplayValue = adjustedAprBigNumber
        .decimalPlaces(2, BigNumber.ROUND_DOWN)
        .toFixed(2);
      setRawApr(`${adjustedAprBigNumber.decimalPlaces(6, BigNumber.ROUND_DOWN).toFixed(6)}%`);
      setApr(`${aprDisplayValue}%`);
      setUnlockDate(format(config.getEndDate(new Date()), "MMM d yyyy HH:mm"));

      // Calculate rewards using durationFraction (old integration behavior)
      const stakeAmount = new BigNumber(amount || 0);
      if (stakeAmount.isGreaterThan(0)) {
        const aprValue = adjustedAprBigNumber.dividedBy(100);
        const durationFraction = localDevApr
          ? new BigNumber(config.durationInMinutes).dividedBy(MINUTES_IN_YEAR)
          : new BigNumber(config.durationFraction ?? 0);
        const reward = stakeAmount
          .multipliedBy(aprValue)
          .multipliedBy(durationFraction);

        const rewardDisplay = reward.decimalPlaces(3, BigNumber.ROUND_DOWN).toFixed(3);
        setYouWillGet(rewardDisplay);
      } else {
        setYouWillGet("0");
      }
    };

    updateDurationInfo();
  }, [amount, selectedPeriod, durationConfigs]);

  return (
    <section id="start-staking" className="relative pt-5 sm:pt-6 md:pt-8 pb-8 sm:pb-10 md:pb-16 px-4">
      {/* Background gradient orb */}
      <div className="absolute right-[15%] top-[5%] w-[300px] h-[300px] md:w-[625px] md:h-[625px] opacity-15 pointer-events-none">
        <svg
          viewBox="0 0 1913 1677"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_staking)">
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
              id="filter0_f_staking"
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

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-12">
          <div>
            <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-inter font-bold mb-4 sm:mb-6">
              {t("startStaking.title")}{" "}
              <span className="text-ws-green">{t("startStaking.titleAccent")}</span>
            </h2>
            <p className="text-ws-gray text-base sm:text-lg md:text-2xl lg:text-3xl font-inter max-w-3xl mx-auto">
              {t("startStaking.subtitle")}{" "}
              <button
                type="button"
                onClick={() => openDisclaimer()}
                className="text-ws-green hover:underline"
              >
                {t("startStaking.subtitleAccent")}
              </button>
            </p>
          </div>
        </div>

        <div className={isStakeRulesOpen || isDisclaimerOpen ? "relative" : ""}>
          <div
            className={
              isStakeRulesOpen || isDisclaimerOpen
                ? "blur-[1px] brightness-75 pointer-events-none select-none"
                : ""
            }
          >
            <div className="rounded-[19px] border-2 border-ws-card-border bg-transparent backdrop-blur-sm p-4 sm:p-6 md:p-8">
              {/* Token Selection */}
              <div className="mb-6">
                <div className="w-full rounded-full border border-ws-card-border bg-transparent p-1.5 flex gap-2 flex-wrap">
                  {tokenOptions.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => changeSelectedToken(token.symbol as SupportedToken)}
                      className={`flex-1 py-1.5 sm:py-2 rounded-full font-inter text-xs sm:text-sm md:text-base font-semibold transition-colors ${
                        selectedToken.symbol === token.symbol
                          ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {token.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <div className="rounded-[19px] border-2 border-ws-card-border p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={handleAmountChange}
                      className="bg-transparent text-white text-xl sm:text-2xl md:text-3xl font-inter font-bold outline-none w-full"
                    />
                    <span className="text-white text-xs sm:text-sm md:text-base font-inter">
                      {t("balance")}: {walletBalanceDisplay} {tokenDisplay}
                    </span>
                  </div>
                </div>
              </div>

              {/* Percentage Buttons */}
              <div className="mb-6">
                  <div className="rounded-full border border-ws-card-border bg-transparent p-1.5 flex gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handlePercentage(pct)}
                      className={`flex-1 py-1.5 sm:py-2 rounded-full font-inter text-xs sm:text-sm md:text-base font-semibold transition-colors ${
                        percentage === pct
                          ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {pct === 100 ? t("allin") : `${pct}%`}
                    </button>
                  ))}
                  <div
                    className={`flex-1 rounded-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-semibold flex items-center justify-center gap-1 ${
                      isPercentFocused || percentInput
                        ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                        : "border border-ws-card-border text-white/80"
                    }`}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      value={percentInput}
                      onChange={handlePercentInputChange}
                      placeholder="0.00"
                      onFocus={() => setIsPercentFocused(true)}
                      onBlur={() => setIsPercentFocused(false)}
                      className={`w-16 sm:w-20 bg-transparent text-center outline-none ${
                        isPercentFocused || percentInput ? "text-black" : "text-white"
                      }`}
                    />
                    <span className={isPercentFocused || percentInput ? "text-black/70" : "text-white/70"}>%</span>
                  </div>
                  </div>
              </div>

              {/* Period Selection */}
              <div className="mb-8">
                  {promotionActive && (
                    <div className="mb-2 flex items-center justify-center gap-2 text-[11px] sm:text-sm font-inter text-white/85">
                      <span className="inline-flex h-2.5 w-2.5 sm:h-2 sm:w-2 rounded-full bg-[#22C55F] animate-pulse shadow-[0_0_6px_rgba(34,197,95,0.8)]" />
                      <span>Promotion Active</span>
                    </div>
                  )}
                  <div className="rounded-full border border-ws-card-border bg-transparent p-1.5 flex gap-2 flex-wrap">
                  {durationOptions.map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`flex-1 py-1.5 sm:py-2 rounded-full font-inter text-xs sm:text-sm md:text-base font-semibold transition-colors ${
                        selectedPeriod === period
                          ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {getDurationLabel(period)}
                    </button>
                  ))}
                  </div>
              </div>

              {/* Stake Button */}
              <button
                onClick={handleStake}
                className="w-full py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black text-lg sm:text-xl md:text-2xl font-bold hover:opacity-90 transition-opacity"
              >
                {t("stake")}
              </button>

                <div className="mt-3 flex items-center justify-start text-left">
                  <div className="inline-flex items-center justify-center gap-2 text-sm sm:text-base text-white/75">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0C6E58] text-black font-bold text-xl leading-none">
                      ?
                    </span>
                    <span className="text-white/70">{t("startStaking.tutorialPrompt")}</span>
                    <a
                      href={tutorialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ws-green font-semibold hover:underline"
                    >
                      {t("startStaking.tutorialLink")}
                    </a>
                  </div>
                </div>

              {/* Statistics */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-[19px] border-2 border-ws-card-border">
                  <p className="text-ws-gray text-base sm:text-lg md:text-xl font-inter mb-4">
                    {t("startStaking.statsTitle")}{" "}
                    <span className="text-white">W</span>
                    <span className="text-ws-green">Staking</span>{" "}
                    {t("startStaking.statsTitleSuffix")}
                  </p>
                <div className="space-y-3 text-xs sm:text-sm md:text-base text-ws-gray-dark">
                  <div className="flex justify-between items-center">
                    <span>{t("estimatedApr")} :</span>
                    <div className="flex items-center gap-2">
                      <span className="text-ws-green">{apr}</span>
                      {selectedPeriod && durationConfigs[selectedPeriod] && (
                        <span className="text-ws-gray-dark text-xs md:text-sm">
                          ({durationConfigs[selectedPeriod].baseAPR}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("unlockon")} :</span>
                    <span className="text-ws-green">{unlockDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("willget")} :</span>
                    <span className="text-ws-green">
                      {youWillGet} {tokenDisplay}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isStakeRulesOpen && (
            <div className="absolute inset-0 z-20 rounded-[19px] border-2 border-ws-card-border bg-black/90 backdrop-blur-[2px] p-4 sm:p-6 md:p-8 flex flex-col">
                <div
                  className="max-h-[630px] overflow-y-auto pr-2 pb-12 ws-scrollbar text-center"
                  onScroll={(event) => {
                    const el = event.currentTarget;
                    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
                    if (atBottom) {
                      setHasReachedStakeRulesEnd(true);
                    }
                  }}
                >
                  <div className="text-white text-xl sm:text-2xl font-inter font-semibold mb-2">
                    {t("stakingduration")}
                  </div>
                  <div className="text-white text-sm sm:text-base space-y-1">
                    <div className="font-semibold">
                      <span className="text-ws-green">{t("overlay_1month")}:</span> {t("overlay_1monthrate")}
                    </div>
                    <div className="font-semibold">
                      <span className="text-ws-green">{t("overlay_3months")}:</span> {t("overlay_3monthsrate")}
                    </div>
                    <div className="font-semibold">
                      <span className="text-ws-green">{t("overlay_6months")}:</span> {t("overlay_6monthsrate")}
                    </div>
                    <div className="font-semibold">
                      <span className="text-ws-green">{t("overlay_12months")}:</span> {t("overlay_12monthsrate")}
                    </div>
                    <div className="mt-3">{t("stakingduration1", { tokenSymbol: tokenDisplay })}</div>
                  </div>

                  <div className="mt-6 text-white text-lg sm:text-xl font-inter font-semibold">
                    {t("additionalstaking")}
                  </div>
                  <ul className="mt-2 text-white text-sm sm:text-base space-y-1">
                    <li>• {t("additionalstaking1")}</li>
                    <li>• {t("additionalstaking2")}</li>
                    <li>• {t("additionalstaking3")}</li>
                  </ul>

                  <div className="mt-6 text-white text-lg sm:text-xl font-inter font-semibold">
                    {t("earlyunstaking")}
                  </div>
                  <div className="mt-2 text-white text-sm sm:text-base space-y-1">
                    <div>• {t("overlay_1month")}: {t("earlyunstaking_1monthrate")}</div>
                    <div>• {t("overlay_3months")}: {t("earlyunstaking_3monthsrate")}</div>
                    <div>• {t("overlay_6months")}: {t("earlyunstaking_6monthsrate")}</div>
                    <div>• {t("overlay_12months")}: {t("earlyunstaking_12monthsrate")}</div>
                    <div>{t("earlyunstaking1")}</div>
                  </div>

                  <div className="mt-4 text-white text-base sm:text-lg font-inter font-semibold">
                    {t("v13.partialUnstakeTitle")}
                  </div>
                  <ul className="mt-2 text-white text-sm sm:text-base space-y-1">
                    <li>• {t("v13.partialUnstakeDesc")}</li>
                    <li>• {t("v13.penaltyApplies")}</li>
                    <li>• {t("v13.rewardsStop")}</li>
                    <li>• {t("v13.remainingAmount")}</li>
                    <li>• {t("v13.minimumStake", { tokenSymbol: tokenDisplay })}</li>
                  </ul>

                  <div className="mt-4 text-white text-base sm:text-lg font-inter font-semibold">
                    {t("v13.afterDurationTitle")}
                  </div>
                  <p className="mt-2 text-white text-sm sm:text-base">
                    {t("v13.afterDurationDesc")}
                  </p>

                  <div className="mt-6 text-white text-lg sm:text-xl font-inter font-semibold">
                    {t("automatic")}
                  </div>
                  <ul className="mt-2 text-white text-sm sm:text-base space-y-1">
                    <li>• {t("automatic1")}</li>
                    <li>• {t("automatic2")}</li>
                    <li>• {t("automatic3")}</li>
                    <li>• {t("automatic4")}</li>
                  </ul>

                  <div className="mt-6 text-white text-lg sm:text-xl font-inter font-semibold">
                    {t("unstake")}
                  </div>
                  <p className="mt-2 text-white text-sm sm:text-base">
                    {t("unstake1")}
                  </p>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setHasAcknowledged(true);
                      setIsStakeRulesOpen(false);
                    }}
                    disabled={!hasReachedStakeRulesEnd}
                    className={`px-8 py-3 rounded-full text-base sm:text-lg font-bold transition-opacity ${
                      hasReachedStakeRulesEnd
                        ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black hover:opacity-90"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    {t("stake")}
                  </button>
                </div>
              </div>
          )}

          {isDisclaimerOpen && overlayRoot ? createPortal(
            <div
              id="risk"
              className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            >
              <div className="relative w-full max-w-2xl rounded-[24px] border-2 border-ws-card-border bg-black/90 backdrop-blur-[2px] p-4 sm:p-6 md:p-8 max-h-[90vh] flex flex-col">
                <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-[2px] py-2">
                  <div className="text-white text-xl sm:text-2xl font-inter font-semibold">
                    Legal Disclaimer for Staking Services on WStaking
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto pr-2 pb-6 ws-scrollbar text-center"
                  onScroll={(event) => {
                    const el = event.currentTarget;
                    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
                    if (atBottom) {
                      setHasReachedDisclaimerEnd(true);
                    }
                  }}
                >
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                By accessing or using the staking services on WStaking, you acknowledge and agree to the terms outlined in this legal disclaimer. Staking in cryptocurrency or tokenized assets involves inherent risk, and you are advised to carefully read and understand these terms before proceeding.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                General Information
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                WStaking offers staking services for various tokenized assets. While we provide information on staking opportunities, all financial decisions, including which assets to stake, are solely your responsibility. WStaking does not guarantee financial gains, and any outcomes, positive or negative, from staking are the result of your individual choices and market conditions.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                No Investment Advice
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                WStaking does not provide any form of financial or investment advice. All content provided on our platform is intended for informational purposes only. The decision to stake or invest in any tokenized asset is entirely your own, and we recommend consulting with qualified financial, legal, and tax professionals before making any decisions.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                Risk Disclosure
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                Staking in digital assets carries significant risks, including the potential for complete loss of staked assets. Factors such as market volatility, technological issues, or changes in network protocols can negatively impact staking outcomes. You accept these risks and agree that WStaking will not be held liable for any financial losses or reduced rewards resulting from staking activities.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                Rewards and Yields
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                Staking rewards, including any potential yields, are determined by the underlying blockchain protocols and are not guaranteed by WStaking. Any illustrative figures displayed on our platform are for informational purposes only and do not guarantee future returns.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                User Responsibility
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                You are solely responsible for securing your assets, managing your staking activities, and maintaining the safety of your accounts and wallets. This includes safeguarding your private keys and regularly monitoring your staking positions. WStaking assumes no responsibility for unauthorized access to or loss of your digital assets due to your failure to properly secure your accounts.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                Regulatory Compliance
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                Your use of WStaking’s staking services must comply with the laws and regulations applicable in your jurisdiction. Cryptocurrencies and tokenized assets may not be considered legal tender but may be classified as virtual commodities or assets. You are responsible for understanding the legal and tax obligations associated with staking in your location. WStaking may restrict access to its services in regions where such activities are regulated or prohibited.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                Changes to Terms
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                WStaking reserves the right to modify these terms at any time without prior notice. Changes will be effective upon posting on our platform, and your continued use of the staking services will constitute your acceptance of the updated terms.
              </p>

              <div className="text-white text-lg sm:text-xl font-inter font-semibold mb-2">
                Limitation of Liability
              </div>
              <p className="text-white text-sm sm:text-base leading-relaxed mb-6">
                WStaking will not be held liable for any direct, indirect, incidental, or consequential damages, including loss of staked assets, profits, or data, resulting from your use of the staking services. Your participation in staking is at your own risk, and you assume full responsibility for any potential losses.
              </p>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setHasAcknowledged(true);
                      setIsDisclaimerOpen(false);
                    }}
                    disabled={!hasReachedDisclaimerEnd}
                    className={`px-8 py-3 rounded-full text-base sm:text-lg font-bold transition-opacity ${
                      hasReachedDisclaimerEnd
                        ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black hover:opacity-90"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                    }`}
                  >
                  {t("understand")}
                  </button>
                </div>
              </div>
            </div>,
            overlayRoot,
          ) : null}
        </div>

      </div>
      <StakingModal
        open={isModalOpen}
        state={modalState}
        message={modalMessage}
        details={modalDetails}
        onClose={closeModal}
        onConfirm={modalState === "confirm" ? handleConfirmStake : null}
      />
    </section>
  );
}
