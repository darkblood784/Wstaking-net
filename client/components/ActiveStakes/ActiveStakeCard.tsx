import { useState } from "react";
import { useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import AddFundsDialog from "@/components/ActiveStakes/AddFundsDialog";
import UnstakeDialog from "@/components/ActiveStakes/UnstakeDialog";
import { getNetworkConfig } from "@/utils/networkUtils";
import { limitDecimalPoint } from "@/utils/limitDecimalPoint";
import { FormattedStakeInfo } from "@/utils/userStakesUtils";
import { useNotification } from "@/components/NotificationProvider";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useUserDetails } from "@/contexts/UserDetailsContext";

interface ActiveStakeCardProps {
  stake: FormattedStakeInfo;
  isLoading: boolean;
  onUnstake: (txnHash: string, unstakeAmount: string) => void;
  onClaimReward: (txnHash: string) => void;
  onAddFunds: (txnHash: string, additionalAmount: string) => Promise<boolean | void>;
}

const ActiveStakeCard: React.FC<ActiveStakeCardProps> = ({
  stake,
  isLoading,
  onUnstake,
  onClaimReward,
  onAddFunds,
}) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { selectedToken } = useSelectedToken();
  const { walletBalance } = useUserDetails();

  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [addFundAmount, setAddFundAmount] = useState("");
  const [showUnstakeDialog, setShowUnstakeDialog] = useState(false);
  const [unstakeAmount, setUnstakeAmount] = useState("");

  const canClaimRewards = new BigNumber(stake.currentRewards || "0").isGreaterThan(0);
  const isRenewedStake = stake.stakingType > 1;
  const canAddFunds = !isRenewedStake && stake.addFundAllowed;

  const validateUnstakeAmount = (amount: string): boolean => {
    if (
      !amount ||
      amount === "0" ||
      amount === "." ||
      amount === "0." ||
      amount === "" ||
      amount.endsWith(".")
    ) {
      return true;
    }

    const isNumeric = /[^0-9.]/;
    if (isNumeric.test(amount)) {
      return false;
    }

    try {
      const networkConfig = getNetworkConfig();
      const inputAmount = new BigNumber(amount);

      const decimalParts = amount.split(".");
      if (decimalParts.length > 1 && decimalParts[1].length > networkConfig.precision) {
        showNotification?.(
          t("decimalLimitError", { digits: networkConfig.precision }),
          "error"
        );
        return false;
      }

      if (!amount.endsWith(".") && inputAmount.isGreaterThan(stake.totalStaked)) {
        showNotification?.(t("stakeAmountExceededError"), "error");
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const validateAmount = (amount: string): boolean => {
    if (!walletBalance || walletBalance === "Error" || walletBalance === "Connect Wallet") {
      return true;
    }

    if (
      !amount ||
      amount === "0" ||
      amount === "." ||
      amount === "0." ||
      amount === "" ||
      amount.endsWith(".")
    ) {
      return true;
    }

    const isNumeric = /[^0-9.]/;
    if (isNumeric.test(amount)) {
      return false;
    }

    try {
      const networkConfig = getNetworkConfig();
      const inputAmount = new BigNumber(amount);
      const balance = new BigNumber(walletBalance);

      const decimalParts = amount.split(".");
      if (decimalParts.length > 1 && decimalParts[1].length > networkConfig.precision) {
        showNotification?.(
          t("decimalLimitError", { digits: networkConfig.precision }),
          "error"
        );
        return false;
      }

      if (!amount.endsWith(".") && inputAmount.isGreaterThan(balance)) {
        showNotification?.(t("balanceExceededError"), "error");
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const validateAddFunds = (amount: string): boolean => {
    if (amount === "") {
      return false;
    }

    const amountValue = parseFloat(amount);

    if (amountValue <= 0) {
      showNotification(t("enterValidAmount"), "error");
      return false;
    }

    return true;
  };

  const validateUnstake = (amount: string): boolean => {
    if (!validateUnstakeAmount(amount)) {
      return false;
    }

    if (amount === "") {
      return false;
    }

    const amountValue = parseFloat(amount);
    const totalStakedValue = parseFloat(stake.totalStaked);

    if (amountValue === totalStakedValue) {
      return true;
    }

    if (parseFloat(stake.version) < 1.3) {
      showNotification(t("unstakeVersion13"), "error");
    }

    if (amountValue > totalStakedValue) {
      showNotification(t("unstakeAmountExceeded"), "error");
      return false;
    }

    if (amountValue <= 0) {
      showNotification(t("enterValidAmount"), "error");
      return false;
    }

    const remainingAmount = parseFloat(stake.totalStaked) - parseFloat(amount);
    if (remainingAmount < 10) {
      showNotification(t("unstake10tokens", { tokenSymbol: selectedToken.symbol }), "error");
      return false;
    }

    return true;
  };

  const handleAddFundAmountChange = (event: React.ChangeEvent<any>) => {
    let newValue = event.target.value as string;
    newValue = newValue.replace(/[^0-9.]/g, "");

    const parts = newValue.split(".");
    if (parts.length > 2) {
      newValue = parts.slice(0, -1).join(".");
    }

    if (newValue.length > 0 && newValue.startsWith(".")) {
      newValue = `0${newValue}`;
    }

    if (validateAmount(newValue)) {
      setAddFundAmount(newValue);
    }
  };

  const handleUnstakeAmountChange = (event: React.ChangeEvent<any>) => {
    let newValue = event.target.value as string;
    newValue = newValue.replace(/[^0-9.]/g, "");

    const parts = newValue.split(".");
    if (parts.length > 2) {
      newValue = parts.slice(0, -1).join(".");
    }

    if (newValue.length > 0 && newValue.startsWith(".")) {
      newValue = `0${newValue}`;
    }

    if (validateUnstakeAmount(newValue)) {
      setUnstakeAmount(newValue);
    }
  };

  const handleAddFunds = async () => {
    if (validateAddFunds(addFundAmount)) {
      const success = await onAddFunds(stake.txnHash, addFundAmount);
      if (success !== false) {
        setAddFundAmount("");
        setShowAddFundsDialog(false);
      }
    }
  };

  const handleUnstake = () => {
    if (validateUnstake(unstakeAmount)) {
      onUnstake(stake.txnHash, unstakeAmount);
      setShowUnstakeDialog(false);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    setUnstakeAmount(((percentage / 100) * parseFloat(stake.totalStaked)).toString());
  };

  // Helper: format date as "5th May 2022"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const daySuffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day}${daySuffix} ${month} ${year}`;
  };

  // Helper: pool ends countdown (e.g., 23D 5H 12M)
  const getEndsCountdown = () => {
    const rawEnd = stake.endDate;
    const parsedEnd =
      typeof rawEnd === "number" || /^[0-9]+$/.test(String(rawEnd))
        ? Number(rawEnd)
        : Date.parse(
            String(rawEnd)
              .replace(/\//g, "-")
              .replace(" ", "T")
          );
    const end = isNaN(parsedEnd) ? new Date(rawEnd).getTime() : parsedEnd;
    const now = Date.now();
    if (isNaN(end) || end < now) return t("activeStake.ended");
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}D ${hours}H ${mins}M`;
  };
  const endsCountdown = getEndsCountdown();
  const isEnded = endsCountdown === t("activeStake.ended");
  const canClaimNow = isEnded ? true : canClaimRewards;

  const trimTrailingZeros = (value: string) =>
    value.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");

  const formatCompactNumber = (value: string | number | null | undefined, decimals: number) =>
    trimTrailingZeros(limitDecimalPoint(value ?? "0", decimals));

  const formatPercent = (value: string) => {
    const hasPercent = value.includes("%");
    const raw = hasPercent ? value.replace("%", "") : value;
    const trimmed = trimTrailingZeros(limitDecimalPoint(raw || "0", 6));
    return `${trimmed}%`;
  };

  const aprDisplay = formatPercent(stake.adjustedAPR || stake.apr || "0");

  return (
    <div className="rounded-2xl bg-transparent border border-[#1e2a24] w-full max-w-xl mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">

      {/* Header */}
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
            className="text-white/60 text-xs sm:text-sm font-semibold hover:text-white transition-colors"
            title={`${t("version")} ${stake.version}`}
          >
            V{stake.version}
          </a>
        </div>

        <div className="mt-4 h-px w-[calc(100%+2rem)] -mx-4 sm:w-[calc(100%+3rem)] sm:-mx-6 md:w-[calc(100%+4rem)] md:-mx-8 bg-[#2f3f36]" />

        <div className="mt-4 flex items-center justify-between gap-3">
          <span
            className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm ${
              stake.isPromo ? "bg-[#8b5cf6] text-white" : "bg-[#12B980] text-black"
            }`}
          >
            {stake.isPromo ? t("promotion") : t("originalapr")}
          </span>
          {isRenewedStake ? (
            <span className="rounded-full px-4 py-2 text-sm font-semibold border-2 border-[#0e2f20] text-[#6ee7b7] bg-transparent">
              {t("renewedstake")}
            </span>
          ) : (
            <button
              type="button"
              className="rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-2 border-[#12B980] text-[#12B980] bg-transparent hover:bg-[#0f2f23]/40 transition disabled:opacity-50 inline-flex items-center gap-1 whitespace-nowrap leading-none"
              onClick={() => setShowUnstakeDialog(true)}
              disabled={isLoading}
            >
              {!isEnded ? t("unlockearly") : t("unstake")}
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-white px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
        <div>
          <div className="text-xs text-ws-gray mb-1">{t("activeStake.stakingAmount")}</div>
          <div className="text-base sm:text-lg font-bold">
            {formatCompactNumber(stake.totalStaked, 4)} {selectedToken.symbol}
          </div>
        </div>
        <div>
          <div className="text-xs text-ws-gray mb-1">{t("apr")}</div>
          <div className="text-base sm:text-lg font-bold">{aprDisplay}</div>
        </div>
        <div>
          <div className="text-xs text-ws-gray mb-1">{t("totalrewards")}</div>
          <div className="text-base sm:text-lg font-bold">
            {formatCompactNumber(stake.totalRewards || "0", 6)} {selectedToken.symbol}
          </div>
        </div>
        <div>
          <div className="text-xs text-ws-gray mb-1">{t("plan")}</div>
          <div className="text-base sm:text-lg font-bold">{stake.duration}</div>
        </div>
        <div>
          <div className="text-xs text-ws-gray mb-1">{t("activeStake.poolEnds")}</div>
          <div className="text-base sm:text-lg font-bold">{endsCountdown}</div>
        </div>
        <div>
          <div className="text-xs text-ws-gray mb-1">{t("activeStake.stakedOn")}</div>
          <div className="text-base sm:text-lg font-bold">{formatDate(stake.startDate)}</div>
        </div>
        <div className="col-span-2 md:col-span-3">
          <div className="text-xs text-ws-gray mb-1">{t("currentrewards")}</div>
          <div className="text-base sm:text-lg font-bold text-[#12B980]">
            {formatCompactNumber(stake.currentRewards || "0", 6)} {selectedToken.symbol}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 px-4 sm:px-6 md:px-8 pb-5 sm:pb-6">
        <button
          type="button"
          className="flex-1 rounded-xl border-2 border-[#0e2f20] text-white bg-transparent py-3 text-sm sm:text-base font-semibold hover:bg-[#0b2b1f]/40 transition shadow-inner disabled:opacity-60"
          onClick={() => onClaimReward(stake.txnHash)}
          disabled={!canClaimNow || isLoading}
        >
          {t("claimrewards")}
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black py-3 text-sm sm:text-base font-semibold hover:opacity-95 transition shadow-[0_8px_24px_rgba(34,197,94,0.12)] disabled:opacity-60"
          onClick={() => {
            if (isRenewedStake) {
              setShowUnstakeDialog(true);
              return;
            }
            if (canAddFunds) {
              setShowAddFundsDialog(true);
              return;
            }
            showNotification(t("stakeNotFound"), "error");
          }}
          disabled={isLoading || (!isRenewedStake && !canAddFunds)}
        >
          {isRenewedStake ? t("unstake") : `${t("increaseamount")} +`}
        </button>
      </div>
      
      {/* Dialogs */}
      <AddFundsDialog
        open={showAddFundsDialog}
        onClose={() => {
          setShowAddFundsDialog(false);
          setAddFundAmount("");
        }}
        onAddFunds={handleAddFunds}
        addFundAmount={addFundAmount}
        onAddFundAmountChange={handleAddFundAmountChange}
        duration={stake.duration}
      />
      <UnstakeDialog
        open={showUnstakeDialog}
        onClose={() => setShowUnstakeDialog(false)}
        onUnstake={handleUnstake}
        unstakeAmount={unstakeAmount}
        onUnstakeAmountChange={handleUnstakeAmountChange}
        handlePercentageClick={handlePercentageClick}
        redeemableAmount={stake.totalStaked}
      />
    </div>
  );
};

export default ActiveStakeCard;
