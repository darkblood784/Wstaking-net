import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useTranslation } from "react-i18next";
import { readContract, writeContract } from "wagmi/actions";
import { waitForTransactionReceipt } from "@wagmi/core";
import BigNumber from "bignumber.js";
import { useNotification } from "@/components/NotificationProvider";
import { useSystemDetails } from "@/contexts/SystemDetailsContext";
import { useRefreshStakes } from "@/contexts/RefreshStakesContext";
import { useUserStakes } from "@/contexts/UserStakesContext";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useUserDetails } from "@/contexts/UserDetailsContext";
import { fetchLockedStakesSummary, fetchUnlockedStakesSummary } from "@/utils/stakeSummaryUtils";
import { formatNumber } from "@/utils/formatNumber";
import { convertToHumanReadNumber, limitDecimalPoint } from "@/utils/limitDecimalPoint";
import { getNetworkConfig, getNetworkName } from "@/utils/networkUtils";
import { loadABI } from "@/utils/abiLoader";
import { calculatePenalty } from "@/utils/calculatePenalty";
import {
  extractContractErrorMessage,
  isInsufficientHotWalletLiquidityError,
} from "@/utils/extractContractError";
import { convertToBlockchainNumber } from "@/utils/limitDecimalPoint";
import { parseReceipt } from "@/utils/parseReceipt";
import {
  classifyUnstakeReceipt,
  rememberUnstakeKind,
} from "@/utils/unstakeKindStore";
import useAddFunds from "@/hooks/useAddFunds";
import usePromotion from "@/hooks/usePromotion";
import useStake from "@/hooks/useStake";
import { isWithinLockPeriod, PaginatedStakeData } from "@/utils/userStakesUtils";
import { wagmiConfig } from "@/wagmi";
import StakingModal from "@/components/StakingModal";
import ActiveStakeCard from "@/components/ActiveStakes/ActiveStakeCard";
import {
  ADMIN_NORMAL_DURATION_CONFIGS,
  ADMIN_PROMOTION_DURATION_CONFIGS,
  DurationName,
  USER_NORMAL_DURATION_CONFIGS,
  USER_PROMOTION_DURATION_CONFIGS,
} from "@/configs/durationConfigs";
import { getTokenConfigs, SupportedToken, TokenConfig } from "@/configs/tokenConfigs";
import PastStakeCard from "@/components/ActiveStakes/PastStakeCard";
import type {
  StakingLiquidityShortfallAlertRequest,
  StakingShortfallAction,
} from "@shared/api";

const ActiveStakes: React.FC = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { showNotification } = useNotification();
  const { fetchTotalStaked, hasAbiError, clearAbiError } = useSystemDetails();
  const { refreshAllStakes, setRefreshLockedStakes } = useRefreshStakes();
  const { getPaginatedLockedStakes, userLockedStakes, userUnlockedStakes, fetchUserStakeData, markStakeAsUnstaked } =
    useUserStakes();
  const { selectedToken, changeSelectedToken } = useSelectedToken();
  const { isAdmin, refreshWalletBalance, walletBalance } = useUserDetails();
  const { promotionActive } = usePromotion();

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [walletBalanceSummary, setWalletBalanceSummary] = useState<string>("0");
  const [totalStakedSummary, setTotalStakedSummary] = useState<string>("0");
  const [totalClaimedSummary, setTotalClaimedSummary] = useState<string>("0");
  const [unlockedTotalStaked, setUnlockedTotalStaked] = useState<string>("0");
  const [unlockedTotalRewards, setUnlockedTotalRewards] = useState<string>("0");

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [systemStatus, setSystemStatus] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState<
    "confirm" | "loading" | "success" | "error" | "newstake" | "newAddFunds"
  >("confirm");
  const [modalMessage, setModalMessage] = useState("");
  const [modalDetails, setModalDetails] = useState<string[]>([]);
  const [onConfirmHandler, setOnConfirmHandler] = useState<(() => void) | null>(
    null
  );
  const activeListRef = useRef<HTMLDivElement | null>(null);
  const pastListRef = useRef<HTMLDivElement | null>(null);
  const partialListRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pastIndex, setPastIndex] = useState(0);
  const [partialIndex, setPartialIndex] = useState(0);
  const latestPartialFetchIdRef = useRef(0);
  const lastSelfHealKeyRef = useRef<string | null>(null);
  const shortfallAlertCooldownRef = useRef(new Map<string, number>());
  const [partialRecords, setPartialRecords] = useState<
    {
      txHash: string;
      unstakeTxnHash: string;
      tokenAddress: string;
      amountUnstaked: string;
      penalty: string;
      remainingStake: string;
      timestamp: number;
    }[]
  >([]);

  const paginatedLockedStakes = useMemo<PaginatedStakeData>(() => {
    return getPaginatedLockedStakes(currentPage);
  }, [getPaginatedLockedStakes, currentPage, userLockedStakes]);

  const getCenteredIndex = useCallback((container: HTMLDivElement | null, selector: string) => {
    if (!container) return 0;
    const cards = Array.from(container.querySelectorAll<HTMLDivElement>(selector));
    if (!cards.length) return 0;
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - centerX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  }, []);

  const scrollToIndex = useCallback(
    (container: HTMLDivElement | null, selector: string, index: number) => {
      if (!container) return;
      const cards = Array.from(container.querySelectorAll<HTMLDivElement>(selector));
      if (!cards.length) return;
      const target = cards[Math.max(0, Math.min(cards.length - 1, index))];
      target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    },
    []
  );

  const formatTotalStaked = useCallback((value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "0";
    return formatNumber(Math.round(num), 0);
  }, []);

  const trimTrailingZeros = useCallback((value: string) => {
    return value
      .replace(/(\.\d*?[1-9])0+$/g, "$1")
      .replace(/\.0+$/g, "");
  }, []);

  const toNumberSafe = useCallback((value: string) => {
    const normalized = String(value || "")
      .replace(/,/g, "")
      .trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const fetchPartialRecordsFromApi = useCallback(
    async (userAddress: string, tokenAddress: string, currentChainId?: number) => {
      const effectiveChainId = currentChainId ?? getNetworkConfig().chainId;
      const params = new URLSearchParams({
        walletAddress: userAddress,
        tokenAddress,
        chainId: String(effectiveChainId),
        contractAddress: getNetworkConfig(effectiveChainId).contractAddress,
        limit: "20",
      });

      try {
        const response = await fetch(`/api/partial-unstake-history?${params.toString()}`);
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok || !Array.isArray(data?.records)) {
          throw new Error(data?.message || "History temporarily unavailable");
        }
        return data.records.map((item: any) => ({
          txHash: String(item?.txHash || ""),
          unstakeTxnHash: String(item?.unstakeTxnHash || ""),
          tokenAddress: String(item?.tokenAddress || tokenAddress),
          amountUnstaked: convertToHumanReadNumber(
            String(item?.amountUnstaked || "0"),
            effectiveChainId
          ).toString(),
          penalty: convertToHumanReadNumber(
            String(item?.penalty || "0"),
            effectiveChainId
          ).toString(),
          remainingStake: convertToHumanReadNumber(
            String(item?.remainingStake || "0"),
            effectiveChainId
          ).toString(),
          timestamp: Number(item?.timestamp || 0),
        }));
      } catch (error) {
        console.warn("Partial unstake history unavailable:", error);
        return [];
      }
    },
    []
  );

  const getExplorerTxUrl = useCallback(
    (txHash: string) => {
      const normalizedChainId = Number(chainId || getNetworkConfig().chainId);
      const baseUrlByChainId: Record<number, string> = {
        56: "https://bscscan.com/tx/",
        97: "https://testnet.bscscan.com/tx/",
        196: "https://www.oklink.com/xlayer/tx/",
        8453: "https://basescan.org/tx/",
        84532: "https://sepolia.basescan.org/tx/",
      };
      const baseUrl = baseUrlByChainId[normalizedChainId];
      return baseUrl ? `${baseUrl}${txHash}` : "";
    },
    [chainId]
  );

  const tokenAddressToSymbol = useMemo(() => {
    const map = new Map<string, string>();
    const all = getTokenConfigs();
    const networkName = getNetworkName(chainId);
    const currentNetworkTokens = Object.values((all[networkName] || {}) as Record<string, TokenConfig>);
    for (const tokenConfig of currentNetworkTokens) {
      map.set(tokenConfig.address.toLowerCase(), tokenConfig.symbol);
    }
    return map;
  }, [chainId]);

  const openModal = (
    state: "confirm" | "loading" | "success" | "error" | "newstake" | "newAddFunds",
    config: { message: string; details?: string[] }
  ) => {
    setIsModalOpen(true);
    setModalState(state);
    setModalMessage(config.message);
    setModalDetails(config.details || []);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalState("confirm");
    setModalMessage("");
  };

  const { executeAddFunds } = useAddFunds({
    openModal,
    closeModal,
    fetchTotalStaked,
    refreshAllStakes,
    address: address,
  });

  const {
    validateAndStake: validateAndRestake,
    isModalOpen: isRestakeModalOpen,
    modalState: restakeModalState,
    modalMessage: restakeModalMessage,
    modalDetails: restakeModalDetails,
    closeModal: closeRestakeModal,
    handleConfirmStake: handleConfirmRestake,
  } = useStake({
    address,
    isAdmin,
    promotionActive,
    walletBalance,
    systemStatus,
    showNotification,
    fetchTotalStaked: fetchTotalStaked || (() => undefined),
    refreshAllStakes: refreshAllStakes || (() => undefined),
  });

  const handleAddFunds = async (txnHash: string, additionalAmount: string) => {
    return executeAddFunds(txnHash, additionalAmount);
  };

  const openModalWithPromise = (
    state: "confirm" | "loading" | "success" | "error" | "newstake" | "newAddFunds",
    config: { message: string; details?: string[] }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsModalOpen(true);
      setModalState(state);
      setModalMessage(config.message);
      setModalDetails(config.details || []);

      const confirmHandler = () => {
        setIsModalOpen(false);
        resolve(true);
      };

      setOnConfirmHandler(() => confirmHandler);
    });
  };

  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (!address || !isConnected || hasAbiError) {
        return;
      }

      setCurrentPage(newPage);
    },
    [address, isConnected, hasAbiError]
  );

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    clearAbiError();

    if (!address) {
      showNotification(t("connectWallet"), "error");
      setLoading(false);
      return;
    }

    try {
      // Reset quickly so stale records are not shown while new token/chain history is loading.
      setPartialRecords([]);

      // Keep primary stake UI responsive: do not block on partial-history scan.
      const stakesTask = fetchUserStakeData(address, selectedToken.address, chainId);
      const summaryTask = (async () => {
        try {
          const summary = await fetchLockedStakesSummary(address, selectedToken.symbol as any);
          setWalletBalanceSummary(summary.walletBalance);
          setTotalStakedSummary(summary.totalStaked);
          setTotalClaimedSummary(summary.totalClaimedRewards);
          const unlockedSummary = await fetchUnlockedStakesSummary(
            address,
            selectedToken.symbol as any
          );
          setUnlockedTotalStaked(unlockedSummary.totalStaked);
          setUnlockedTotalRewards(unlockedSummary.totalRewardsClaimed);
        } catch (err) {
          console.error("Failed to fetch stakes summary:", err);
        }
      })();

      await Promise.all([stakesTask, summaryTask]);

      // Background refresh for partial history.
      const partialFetchId = ++latestPartialFetchIdRef.current;
      fetchPartialRecordsFromApi(address, selectedToken.address, chainId)
        .then((history) => {
          if (partialFetchId === latestPartialFetchIdRef.current) {
            setPartialRecords(history);
          }
        })
        .catch((error) => console.warn("Partial unstake history unavailable:", error));
    } catch (error) {
      console.error("Failed to load stakes:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [
    address,
    selectedToken.address,
    selectedToken.symbol,
    t,
    clearAbiError,
    fetchUserStakeData,
    fetchPartialRecordsFromApi,
    chainId,
    showNotification,
  ]);

  const handleRestake = useCallback(
    async (stake: PaginatedStakeData["activeStakes"][number]) => {
      if (!isConnected || !address) {
        showNotification(t("connectWallet"), "info");
        return;
      }

      const start = new Date(stake.startDate).getTime();
      const end = new Date(stake.endDate).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        showNotification(t("nopromotionrestake"), "error");
        return;
      }

      const durationInMinutes = Math.floor((end - start) / (1000 * 60));
      const availableConfigs = isAdmin
        ? promotionActive
          ? ADMIN_PROMOTION_DURATION_CONFIGS
          : ADMIN_NORMAL_DURATION_CONFIGS
        : promotionActive
        ? USER_PROMOTION_DURATION_CONFIGS
        : USER_NORMAL_DURATION_CONFIGS;

      const matchedDuration = Object.entries(availableConfigs).find(
        ([, config]) => config.durationInMinutes === durationInMinutes
      );

      if (!matchedDuration) {
        showNotification(t("nopromotionrestake"), "error");
        return;
      }

      const durationName = matchedDuration[0] as DurationName;
      await validateAndRestake(stake.totalStaked, durationName);
    },
    [
      address,
      isAdmin,
      isConnected,
      promotionActive,
      showNotification,
      t,
      validateAndRestake,
    ]
  );

  const contractAddress = getNetworkConfig().contractAddress;
  const contractABI = loadABI("contract");
  const erc20ABI = loadABI("erc20");

  const formatTokenAmountFromWei = useCallback(
    (value: bigint) => {
      return trimTrailingZeros(
        limitDecimalPoint(convertToHumanReadNumber(value.toString(), chainId).toString(), 4)
      );
    },
    [chainId, trimTrailingZeros]
  );

  const shortfallChainLabel = useMemo(() => {
    switch (chainId) {
      case 97:
        return "BSC Testnet";
      case 84532:
        return "Base Testnet";
      case 56:
        return "BSC Mainnet";
      case 8453:
        return "Base Mainnet";
      case 196:
        return "X Layer Mainnet";
      default:
        return getNetworkName(chainId);
    }
  }, [chainId]);

  const payoutPendingMessage = t("claimRewardsPayoutPending", {
    defaultValue: "Network congestion, please wait a few hours and try again.",
  });
  const payoutPendingDetail = t("claimRewardsPayoutPendingDetail", {
    defaultValue: "Network congestion, please wait a few hours and try again.",
  });

  const reportShortfallAlert = useCallback(
    async (
      action: StakingShortfallAction,
      stakeTxnHash: string | undefined,
      requiredAmountWei: bigint,
      availableAmountWei: bigint
    ) => {
      if (!address) return;

      const shortfallAmountWei =
        requiredAmountWei > availableAmountWei ? requiredAmountWei - availableAmountWei : 0n;
      if (shortfallAmountWei <= 0n) return;

      const alertKey = [
        chainId,
        action,
        selectedToken.address.toLowerCase(),
        String(stakeTxnHash || "").toLowerCase(),
        address.toLowerCase(),
      ].join(":");
      const now = Date.now();
      const lastSentAt = shortfallAlertCooldownRef.current.get(alertKey) || 0;
      if (now - lastSentAt < 5 * 60 * 1000) {
        return;
      }
      shortfallAlertCooldownRef.current.set(alertKey, now);

      const payload: StakingLiquidityShortfallAlertRequest = {
        source: "staking-frontend",
        chain: shortfallChainLabel,
        chainId,
        action,
        userWallet: address,
        tokenAddress: selectedToken.address,
        tokenSymbol: selectedToken.symbol,
        stakeTxnHash,
        requiredAmount: formatTokenAmountFromWei(requiredAmountWei),
        availableAmount: formatTokenAmountFromWei(availableAmountWei),
        shortfallAmount: formatTokenAmountFromWei(shortfallAmountWei),
        contractAddress,
        timestamp: new Date().toISOString(),
      };

      try {
        await fetch("/api/staking/liquidity-shortfall-alert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.warn("Shortfall alert report failed:", error);
      }
    },
    [
      address,
      chainId,
      contractAddress,
      formatTokenAmountFromWei,
      shortfallChainLabel,
      selectedToken.address,
      selectedToken.symbol,
    ]
  );

  const getHotWalletPayoutCapacity = useCallback(
    async (requiredAmount: bigint) => {
      if (requiredAmount <= 0n) {
        return {
          sufficient: true,
          availableAmount: 0n,
          requiredAmount,
          shortfallAmount: 0n,
        };
      }

      const hotWallet = (await (readContract as any)(wagmiConfig, {
        abi: contractABI,
        address: contractAddress as `0x${string}`,
        functionName: "tokenHotWallets",
        args: [selectedToken.address],
      })) as `0x${string}`;

      if (!hotWallet || /^0x0{40}$/i.test(hotWallet)) {
        return {
          sufficient: true,
          availableAmount: 0n,
          requiredAmount,
          shortfallAmount: 0n,
        };
      }

      const [hwBalance, hwAllowance] = await Promise.all([
        (readContract as any)(wagmiConfig, {
          abi: erc20ABI,
          address: selectedToken.address as `0x${string}`,
          functionName: "balanceOf",
          args: [hotWallet],
        }) as Promise<bigint>,
        (readContract as any)(wagmiConfig, {
          abi: erc20ABI,
          address: selectedToken.address as `0x${string}`,
          functionName: "allowance",
          args: [hotWallet, contractAddress],
        }) as Promise<bigint>,
      ]);

      const availableAmount = hwBalance < hwAllowance ? hwBalance : hwAllowance;
      const shortfallAmount =
        requiredAmount > availableAmount ? requiredAmount - availableAmount : 0n;

      return {
        sufficient: shortfallAmount <= 0n,
        availableAmount,
        requiredAmount,
        shortfallAmount,
      };
    },
    [contractABI, contractAddress, erc20ABI, selectedToken.address]
  );

  const handleUnstake = async (txnHash: string, amount: string) => {
    if (!address) {
      return;
    }

    try {
      if (!systemStatus && !isAdmin) {
        showNotification(t("noActiveStakes"), "error");
        return;
      }

      const stakeInfo = paginatedLockedStakes?.activeStakes.find(
        (stake) => stake.txnHash === txnHash
      );

      if (!stakeInfo) {
        showNotification(t("noActiveStakes"), "error");
        return;
      }

      try {
        const {
          finalReturnAmount,
        } = calculatePenalty(amount, stakeInfo);

        const pendingRewards = BigInt(
          convertToBlockchainNumber(stakeInfo.currentRewards || "0").toFixed()
        );
        const unstakeReturn = BigInt(
          convertToBlockchainNumber(finalReturnAmount).toFixed()
        );
        const requiredAmount = pendingRewards + unstakeReturn;
        const action: StakingShortfallAction = new BigNumber(amount).isLessThan(
          stakeInfo.totalStaked
        )
          ? "partial_unstake"
          : "unstake";
        const capacity = await getHotWalletPayoutCapacity(requiredAmount);

        if (!capacity.sufficient) {
          void reportShortfallAlert(action, txnHash, requiredAmount, capacity.availableAmount);
          openModal("error", {
            message: payoutPendingMessage,
            details: [payoutPendingDetail],
          });
          return;
        }
      } catch (precheckError) {
        console.warn("Unstake payout precheck unavailable:", precheckError);
      }

      const isRenewed = stakeInfo.stakingType > 1;
      const isLocked = isRenewed ? false : isWithinLockPeriod(stakeInfo.endDate);

      const {
        penaltyPercentage,
        unstakeAmount,
        penaltyAmount,
        finalReturnAmount,
      } = calculatePenalty(amount, stakeInfo);

      const userConfirmed = await openModalWithPromise("confirm", {
        message: isLocked
          ? t("unstakePenaltyInfo", { penaltyPercentage })
          : t("confirmUnlock"),
        details: isLocked
          ? [
              `${t("unstakeAmount")}: ${unstakeAmount} ${selectedToken.symbol}`,
              `${t("penaltyAmount", {
                penaltyPercentage,
              })}: -${penaltyAmount} ${selectedToken.symbol}`,
              `${t("finalReturnAmount")}: ${finalReturnAmount} ${selectedToken.symbol}`,
            ]
          : [`${t("unstakeAmount")}: ${unstakeAmount} ${selectedToken.symbol}`],
      });

      if (!userConfirmed) {
        return;
      }

      openModal("loading", { message: t("processingUnstake") });

      const unstakeTxHash = await (writeContract as any)(wagmiConfig, {
        abi: contractABI,
        address: contractAddress as `0x${string}`,
        functionName: "unstake",
        args: [
          selectedToken.address,
          txnHash,
          BigInt(convertToBlockchainNumber(amount).toFixed()),
        ],
      });

      const tx = await waitForTransactionReceipt(wagmiConfig, {
        hash: unstakeTxHash,
        confirmations: 1,
      });

      const unstakeClassification = classifyUnstakeReceipt(
        tx,
        contractAddress,
        contractABI as any[]
      );
      if (
        unstakeClassification.kind !== "unknown" &&
        unstakeClassification.unstakeTxnHash
      ) {
        rememberUnstakeKind(
          unstakeClassification.unstakeTxnHash,
          unstakeClassification.kind
        );
      }

      const parsedReceipt = parseReceipt(tx, ["Unstaked", "PartialUnstaked"]);
      const unstakeDetails = String(unstakeClassification.details || "")
        .replace(/^\d+::?/, "")
        .trim();

      if (parsedReceipt.status) {
        markStakeAsUnstaked(txnHash, unstakeTxHash);
        openModal("success", {
          message:
            parsedReceipt.text ||
            unstakeDetails ||
            (isLocked ? t("earlyUnstakeSuccess") : t("unlockSuccess")),
        });
        // Immediate refresh.
        await refreshAllStakes?.();
        await fetchTotalStaked?.();
        await refreshWalletBalance?.();

        // Stabilization passes for RPC/indexer lag.
        setTimeout(() => {
          refreshAllStakes?.();
          fetchTotalStaked?.();
          refreshWalletBalance?.();
        }, 1200);
        setTimeout(() => {
          refreshAllStakes?.();
          fetchTotalStaked?.();
          refreshWalletBalance?.();
        }, 3200);
      } else {
        openModal("error", { message: parsedReceipt.text || t("unstakeFailed") });
      }
    } catch (error) {
      console.error(error);
      if (isInsufficientHotWalletLiquidityError(error)) {
        const stakeInfo = paginatedLockedStakes?.activeStakes.find(
          (stake) => stake.txnHash === txnHash
        );
        if (stakeInfo) {
          try {
            const { finalReturnAmount } = calculatePenalty(amount, stakeInfo);
            const requiredAmount =
              BigInt(convertToBlockchainNumber(stakeInfo.currentRewards || "0").toFixed()) +
              BigInt(convertToBlockchainNumber(finalReturnAmount).toFixed());
            const action: StakingShortfallAction = new BigNumber(amount).isLessThan(
              stakeInfo.totalStaked
            )
              ? "partial_unstake"
              : "unstake";
            const capacity = await getHotWalletPayoutCapacity(requiredAmount);
            void reportShortfallAlert(action, txnHash, requiredAmount, capacity.availableAmount);
          } catch (reportError) {
            console.warn("Unstake shortfall alert unavailable:", reportError);
          }
        }
        openModal("error", {
          message: payoutPendingMessage,
          details: [payoutPendingDetail],
        });
        return;
      }
      openModal("error", {
        message: extractContractErrorMessage(error, t("unexpectedError")),
      });
    }
  };

  const handleClaimRewards = async (txnHash: string) => {
    if (!address) {
      showNotification("Please connect your wallet.", "error");
      return;
    }

    try {
      if (!systemStatus && !isAdmin) {
        showNotification(t("noActiveStakes"), "error");
        return;
      }

      const stakeInfo = paginatedLockedStakes?.activeStakes.find(
        (stake) => stake.txnHash === txnHash
      );

      if (
        stakeInfo?.currentRewards &&
        new BigNumber(stakeInfo.currentRewards).isGreaterThan(0)
      ) {
        try {
          const requiredAmount = BigInt(
            convertToBlockchainNumber(stakeInfo.currentRewards).toFixed()
          );
          const capacity = await getHotWalletPayoutCapacity(requiredAmount);

          if (requiredAmount > 0n && !capacity.sufficient) {
            void reportShortfallAlert("claim", txnHash, requiredAmount, capacity.availableAmount);
            openModal("error", {
              message: payoutPendingMessage,
              details: [payoutPendingDetail],
            });
            return;
          }
        } catch (precheckError) {
          console.warn("Claim payout precheck unavailable:", precheckError);
        }
      }

      openModal("loading", { message: t("processingClaimRewards") });

      const claimTxHash = await (writeContract as any)(wagmiConfig, {
        abi: contractABI,
        address: contractAddress as `0x${string}`,
        functionName: "claimRewards",
        args: [selectedToken.address, txnHash],
      });

      const tx = await waitForTransactionReceipt(wagmiConfig, {
        hash: claimTxHash,
        confirmations: 1,
      });

      const parsedReceipt = parseReceipt(tx, ["StakeRenewed", "RewardsClaimed"]);

      if (parsedReceipt.status) {
        openModal("success", {
          message: parsedReceipt.text || t("claimRewardsSuccess"),
        });
        // Immediate refresh.
        await refreshAllStakes?.();
        await fetchTotalStaked?.();
        await refreshWalletBalance?.();

        // Stabilization passes for RPC/indexer lag.
        setTimeout(() => {
          refreshAllStakes?.();
          fetchTotalStaked?.();
          refreshWalletBalance?.();
        }, 1200);
        setTimeout(() => {
          refreshAllStakes?.();
          fetchTotalStaked?.();
          refreshWalletBalance?.();
        }, 3200);
      } else {
        openModal("error", {
          message: parsedReceipt.text || t("claimRewardsFailed"),
        });
      }
    } catch (error) {
      console.error(error);
      if (isInsufficientHotWalletLiquidityError(error)) {
        const stakeInfo = paginatedLockedStakes?.activeStakes.find(
          (stake) => stake.txnHash === txnHash
        );
        if (
          stakeInfo?.currentRewards &&
          new BigNumber(stakeInfo.currentRewards).isGreaterThan(0)
        ) {
          try {
            const requiredAmount = BigInt(
              convertToBlockchainNumber(stakeInfo.currentRewards).toFixed()
            );
            const capacity = await getHotWalletPayoutCapacity(requiredAmount);
            void reportShortfallAlert("claim", txnHash, requiredAmount, capacity.availableAmount);
          } catch (reportError) {
            console.warn("Claim shortfall alert unavailable:", reportError);
          }
        }
        openModal("error", {
          message: payoutPendingMessage,
          details: [payoutPendingDetail],
        });
        return;
      }
      openModal("error", {
        message: extractContractErrorMessage(error, t("unexpectedError")),
      });
    }
  };

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const status = await (readContract as any)(wagmiConfig, {
          abi: contractABI,
          address: contractAddress as `0x${string}`,
          functionName: "systemEnabled",
          args: [],
        }).then((response) => response as boolean);

        setSystemStatus(status);
      } catch (error) {
        console.error("Failed to fetch system status:", error);
      }
    };
    fetchSystemStatus();
  }, []);

  useEffect(() => {
    const container = activeListRef.current;
    if (!container) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setActiveIndex(getCenteredIndex(container, "[data-active-card]"));
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [getCenteredIndex, paginatedLockedStakes.activeStakes.length]);

  useEffect(() => {
    const container = pastListRef.current;
    if (!container) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPastIndex(getCenteredIndex(container, "[data-past-card]"));
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [getCenteredIndex, userUnlockedStakes.length]);

  useEffect(() => {
    const container = partialListRef.current;
    if (!container) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPartialIndex(getCenteredIndex(container, "[data-partial-card]"));
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [getCenteredIndex, partialRecords.length]);

  const networkName = getNetworkName(chainId);
  const networkConfig = getNetworkConfig(chainId);
  const networkTokenConfigs = (getTokenConfigs()[networkName] ||
    {}) as Partial<Record<SupportedToken, TokenConfig>>;
  const networkTokens = Object.values(networkTokenConfigs) as TokenConfig[];
  const isSelectedTokenSupportedOnChain = Boolean(
    networkTokenConfigs[selectedToken.symbol as SupportedToken]
  );

  useEffect(() => {
    if (isSelectedTokenSupportedOnChain) return;
    const fallbackToken = networkTokens[0];
    if (fallbackToken && fallbackToken.symbol !== selectedToken.symbol) {
      changeSelectedToken(fallbackToken.symbol as SupportedToken);
    }
  }, [
    isSelectedTokenSupportedOnChain,
    networkTokens,
    selectedToken.symbol,
    changeSelectedToken,
  ]);

  useEffect(() => {
    if (!isConnected || !address || hasAbiError || !isSelectedTokenSupportedOnChain) return;
    // Prevent cross-token stale history flash while new token history is loading.
    setPartialRecords([]);
    handleRefresh();
    setRefreshLockedStakes(() => handleRefresh);
  }, [
    isConnected,
    address,
    chainId,
    selectedToken.address,
    hasAbiError,
    isSelectedTokenSupportedOnChain,
    handleRefresh,
    setRefreshLockedStakes,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [chainId, selectedToken.address]);

  useEffect(() => {
    if (!isConnected || !address || loading) return;

    const staked = toNumberSafe(totalStakedSummary);
    if (staked <= 0 || userLockedStakes.length > 0) return;

    const healKey = `${address.toLowerCase()}|${chainId}|${selectedToken.address.toLowerCase()}`;
    if (lastSelfHealKeyRef.current === healKey) return;
    lastSelfHealKeyRef.current = healKey;

    const timer = setTimeout(() => {
      fetchUserStakeData(address, selectedToken.address, chainId).catch((error) => {
        console.warn("Active stakes self-heal fetch failed:", error);
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [
    isConnected,
    address,
    chainId,
    selectedToken.address,
    totalStakedSummary,
    userLockedStakes.length,
    loading,
    fetchUserStakeData,
    markStakeAsUnstaked,
    toNumberSafe,
  ]);

  const hasStakes =
    isConnected &&
    paginatedLockedStakes &&
    paginatedLockedStakes.activeStakes.length > 0;

  return (
    <section className="relative pt-4 sm:pt-5 md:pt-6 pb-16 md:pb-24 px-4">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-white text-3xl md:text-4xl font-inter font-bold mb-6">
            {t("stakingPlans.titlePrefix")}{" "}
            <span className="text-ws-green">{t("stakingPlans.titleAccent")}</span>
          </h2>
          <p className="text-ws-gray text-lg md:text-2xl lg:text-3xl font-inter">
            {t("stakingPlans.subtitle")}
          </p>
        </div>

        <div className="mb-8">
          <div className="rounded-[28px] border-2 border-ws-card-border p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0b0b0b] flex items-center justify-center border border-ws-card-border">
                <img src={selectedToken.icon} alt={selectedToken.symbol} className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs md:text-sm text-ws-gray">{t("walletBalance")}:</div>
                <div className="text-lg md:text-xl text-white font-bold whitespace-nowrap">{formatNumber(walletBalanceSummary, 3)} {selectedToken.symbol}</div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-xs md:text-sm text-ws-gray whitespace-nowrap">{t("totalStaked")}:</div>
                <div className="text-base md:text-lg text-white font-bold whitespace-nowrap">{formatTotalStaked(totalStakedSummary)} {selectedToken.symbol}</div>
              </div>
              <div className="text-center">
                <div className="text-xs md:text-sm text-ws-gray whitespace-nowrap">{t("claimedrewards")}:</div>
                <div className="text-base md:text-lg text-white font-bold whitespace-nowrap">{formatNumber(totalClaimedSummary, 4)} {selectedToken.symbol}</div>
              </div>
            </div>

            <div className="hidden items-center gap-3">
              <div className="rounded-full border border-ws-card-border bg-transparent p-1.5 flex gap-2">
                {networkTokens.map((tokenConfig) => (
                  <button
                    key={tokenConfig.symbol}
                    onClick={() => changeSelectedToken(tokenConfig.symbol as SupportedToken)}
                    className={`px-4 py-1.5 rounded-full font-inter text-sm md:text-base font-semibold transition-colors whitespace-nowrap leading-none ${
                      selectedToken.symbol === tokenConfig.symbol
                        ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {tokenConfig.symbol}
                  </button>
                ))}
              </div>

              <button
                onClick={async () => {
                  setSummaryLoading(true);
                  await handleRefresh();
                  setSummaryLoading(false);
                }}
                className="px-4 py-2 rounded-full bg-transparent border border-ws-card-border text-white hover:border-ws-green transition-colors text-sm md:text-base whitespace-nowrap leading-none"
              >
                {summaryLoading || loading ? t("activeStakes.refreshing") : t("activeStakes.refresh")}
              </button>
            </div>

            <div className="mt-3 w-full flex justify-end">
              <div className="rounded-2xl border border-ws-card-border bg-[#0b0b0b]/50 p-2 inline-flex max-w-full">
                <div className="flex items-center gap-2 overflow-x-auto ws-scrollbar">
                  {networkTokens.map((tokenConfig) => (
                    <button
                      key={tokenConfig.symbol}
                      onClick={() => changeSelectedToken(tokenConfig.symbol as SupportedToken)}
                      className={`px-3 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors whitespace-nowrap ${
                        selectedToken.symbol === tokenConfig.symbol
                          ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                          : "text-white/80 hover:text-white border border-ws-card-border"
                      }`}
                    >
                      {tokenConfig.symbol}
                    </button>
                  ))}
                  <button
                    onClick={async () => {
                      setSummaryLoading(true);
                      await handleRefresh();
                      setSummaryLoading(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-transparent border border-ws-card-border text-white hover:border-ws-green transition-colors text-xs font-semibold whitespace-nowrap"
                  >
                    {summaryLoading || loading ? t("activeStakes.refreshing") : t("activeStakes.refresh")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!hasStakes ? (
          <div className="max-w-2xl mx-auto backdrop-blur-xl rounded-[43px] border-2 border-ws-card-border bg-transparent p-12 md:p-16">
            <div className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32 md:w-36 md:h-36 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-[27px] bg-[#0b2b1f]/25 blur-2xl" />
                <div className="relative w-full h-full rounded-[27px] border-2 border-[#282D29] bg-black/40 flex items-center justify-center">
                  <svg
                    width="57"
                    height="56"
                    viewBox="0 0 57 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 md:w-12 md:h-12"
                  >
                    <path
                      d="M13.5634 7.53356C16.1117 5.57818 18.9863 4.09484 22.051 3.15075C22.4932 3.01451 22.7143 2.94639 22.9004 3.04924C23.0864 3.15209 23.1478 3.3814 23.2707 3.84003L29.7412 27.9882C29.8632 28.4435 29.9242 28.6712 29.8206 28.8505C29.7171 29.0299 29.4894 29.0909 29.0341 29.2129L4.88593 35.6834C4.4273 35.8063 4.19799 35.8677 4.01591 35.7581C3.83383 35.6484 3.78227 35.4228 3.67913 34.9717C2.96442 31.8456 2.81173 28.6145 3.23099 25.4299C3.69379 21.9145 4.84447 18.5248 6.61731 15.4541C8.39016 12.3834 10.7505 9.69204 13.5634 7.53356Z"
                      stroke="#6B7280"
                      strokeWidth="6"
                    />
                    <path
                      d="M38.1857 11.8076C41.4995 13.3896 44.284 15.8981 46.2021 19.0295C48.1202 22.1608 49.0898 25.7809 48.9935 29.4518C48.8973 33.1227 47.7394 36.687 45.6599 39.7136C43.5804 42.7402 40.6683 45.0993 37.2761 46.5055C33.8839 47.9118 30.1569 48.3049 26.546 47.6373C22.935 46.9697 19.5949 45.2701 16.9297 42.744"
                      stroke="#6B7280"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-white text-2xl md:text-[33px] font-inter font-bold mb-4">
                {t("activeStakes.emptyTitle")}
              </h3>
              <p className="text-ws-gray text-xl md:text-[27px] font-inter">
                {t("activeStakes.emptySubtitle")}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={activeListRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-3 ws-scrollbar"
            >
              {paginatedLockedStakes.activeStakes.map((stake) => (
                <div
                  key={stake.txnHash}
                  data-active-card
                  className="min-w-[86vw] sm:min-w-[70vw] md:min-w-[520px] snap-center pr-4"
                >
                  <ActiveStakeCard
                    stake={stake}
                    isLoading={loading}
                    onUnstake={handleUnstake}
                    onClaimReward={handleClaimRewards}
                    onAddFunds={handleAddFunds}
                  />
                </div>
              ))}
            </div>
            {paginatedLockedStakes.activeStakes.length > 1 && activeIndex > 0 && (
              <button
                type="button"
                aria-label="Previous"
                onClick={() =>
                  scrollToIndex(activeListRef.current, "[data-active-card]", activeIndex - 1)
                }
                className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-ws-card-border bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
              >
                ←
              </button>
            )}
            {paginatedLockedStakes.activeStakes.length > 1 &&
              activeIndex < paginatedLockedStakes.activeStakes.length - 1 && (
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() =>
                    scrollToIndex(activeListRef.current, "[data-active-card]", activeIndex + 1)
                  }
                  className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-ws-card-border bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
                >
                  →
                </button>
              )}
          </div>
        )}

        {(userUnlockedStakes.length > 0 || partialRecords.length > 0) && (
          <div className="mt-16 text-center">
            <h2 className="text-white text-3xl md:text-4xl font-inter font-bold mb-4">
              {t("pastStakes.title")}{" "}
              <span className="text-ws-green">{t("pastStakes.titleAccent")}</span>
            </h2>
            <p className="text-ws-gray text-lg md:text-xl font-inter max-w-3xl mx-auto">
              {t("pastStakes.subtitle")}
            </p>
          </div>
        )}

        {(userUnlockedStakes.length > 0 || partialRecords.length > 0) && (
          <div className="mt-8">
            <div className="rounded-[19px] border-2 border-ws-card-border p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0b0b0b] flex items-center justify-center border border-ws-card-border">
                    <img src={selectedToken.icon} alt={selectedToken.symbol} className="w-7 h-7" />
                  </div>
                  <div className="text-white text-lg font-semibold">{selectedToken.symbol}</div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-xs md:text-sm text-ws-gray">{t("totalStaked")}</div>
                    <div className="text-base md:text-lg text-white font-bold">
                      {trimTrailingZeros(limitDecimalPoint(unlockedTotalStaked, 4) || "0." + "0".repeat(4))} {selectedToken.symbol}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs md:text-sm text-ws-gray">{t("totalRewards")}</div>
                    <div className="text-base md:text-lg text-white font-bold">
                      {trimTrailingZeros(limitDecimalPoint(unlockedTotalRewards, 10) || "0." + "0".repeat(10))} {selectedToken.symbol}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="rounded-full border border-ws-card-border bg-transparent p-1.5 flex gap-2">
                    {networkTokens.map((tokenConfig) => (
                      <button
                        key={tokenConfig.symbol}
                        onClick={() => changeSelectedToken(tokenConfig.symbol as SupportedToken)}
                        className={`px-4 py-1.5 rounded-full font-inter text-sm md:text-base font-semibold transition-colors ${
                          selectedToken.symbol === tokenConfig.symbol
                            ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                            : "text-white/80 hover:text-white"
                        }`}
                      >
                        {tokenConfig.symbol}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      setSummaryLoading(true);
                      await handleRefresh();
                      setSummaryLoading(false);
                    }}
                    className="hidden md:inline-flex px-4 py-2 rounded-full bg-transparent border border-ws-card-border text-white hover:border-ws-green transition-colors text-sm md:text-base"
                  >
                    {summaryLoading || loading ? t("activeStakes.refreshing") : t("activeStakes.refresh")}
                  </button>
                </div>
              </div>
              <div className="mt-3 w-full md:hidden">
                <div className="rounded-2xl border border-ws-card-border bg-[#0b0b0b]/50 p-2">
                  <div className="flex items-center gap-2 overflow-x-auto ws-scrollbar">
                    {networkTokens.map((tokenConfig) => (
                      <button
                        key={tokenConfig.symbol}
                        onClick={() => changeSelectedToken(tokenConfig.symbol as SupportedToken)}
                        className={`px-3 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors whitespace-nowrap ${
                          selectedToken.symbol === tokenConfig.symbol
                            ? "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black"
                            : "text-white/80 hover:text-white border border-ws-card-border"
                        }`}
                      >
                        {tokenConfig.symbol}
                      </button>
                    ))}
                    <button
                      onClick={async () => {
                        setSummaryLoading(true);
                        await handleRefresh();
                        setSummaryLoading(false);
                      }}
                      className="ml-auto px-3 py-1.5 rounded-full bg-transparent border border-ws-card-border text-white hover:border-ws-green transition-colors text-xs font-semibold whitespace-nowrap"
                    >
                      {summaryLoading || loading ? t("activeStakes.refreshing") : t("activeStakes.refresh")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {partialRecords.length > 0 && (
              <div className="mb-6">
                <div className="text-white text-lg font-semibold mb-3">
                  {t("pastStakes.partialRecordsTitle", "Partial Unstake History")}
                </div>
                <div className="relative">
                  <div
                    ref={partialListRef}
                    className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory pb-3 ws-scrollbar"
                  >
                  {partialRecords.map((record, idx) => (
                    <div
                      key={`${record.unstakeTxnHash}-${idx}`}
                      data-partial-card
                      className="min-w-[86vw] sm:min-w-[70vw] md:min-w-[520px] snap-center pr-4 rounded-2xl bg-[#050606] border border-[#1f2a25] p-4"
                    >
                      <div className="text-xs text-[#FBBF24] font-semibold mb-2">
                        {t("pastStakes.partialUnstakeTag", "Partial Unstake")}
                      </div>
                      {(() => {
                        const resolvedTokenSymbol =
                          tokenAddressToSymbol.get((record.tokenAddress || "").toLowerCase()) ||
                          selectedToken.symbol;
                        return (
                          <>
                      <div className="text-sm text-white">
                        {t("unstakeAmount", "Unstaked Amount")}:{" "}
                        <span className="font-semibold">
                          {trimTrailingZeros(limitDecimalPoint(record.amountUnstaked, 6))}{" "}
                          {resolvedTokenSymbol}
                        </span>
                      </div>
                      <div className="text-sm text-white">
                        {t("penalty", "Penalty")}:{" "}
                        <span className="font-semibold">
                          {trimTrailingZeros(limitDecimalPoint(record.penalty, 6))}{" "}
                          {resolvedTokenSymbol}
                        </span>
                      </div>
                      <div className="text-sm text-white">
                        {t("remaining", "Remaining")}:{" "}
                        <span className="font-semibold">
                          {trimTrailingZeros(limitDecimalPoint(record.remainingStake, 6))}{" "}
                          {resolvedTokenSymbol}
                        </span>
                      </div>
                          </>
                        );
                      })()}
                      <div className="text-xs text-ws-gray mt-2">
                        {new Date(record.timestamp * 1000).toLocaleString()}
                      </div>
                      {getExplorerTxUrl(record.txHash) && (
                        <a
                          href={getExplorerTxUrl(record.txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex mt-3 text-xs text-[#12B980] hover:underline"
                        >
                          {t("pastStakes.viewOnExplorer", "View on Explorer")}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                  {partialRecords.length > 1 && partialIndex > 0 && (
                    <button
                      type="button"
                      aria-label="Previous"
                      onClick={() =>
                        scrollToIndex(partialListRef.current, "[data-partial-card]", partialIndex - 1)
                      }
                      className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-ws-card-border bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
                    >
                      ←
                    </button>
                  )}
                  {partialRecords.length > 1 && partialIndex < partialRecords.length - 1 && (
                    <button
                      type="button"
                      aria-label="Next"
                      onClick={() =>
                        scrollToIndex(partialListRef.current, "[data-partial-card]", partialIndex + 1)
                      }
                      className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-ws-card-border bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="relative">
            <div
              ref={pastListRef}
              className="flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory pb-3 ws-scrollbar"
            >
                {userUnlockedStakes.map((stake) => (
                  <div
                    key={stake.txnHash}
                    data-past-card
                    className="min-w-[86vw] sm:min-w-[70vw] md:min-w-[520px] snap-center pr-4 h-full"
                  >
                    <PastStakeCard stake={stake} onRestake={handleRestake} />
                  </div>
                ))}
              </div>
              {userUnlockedStakes.length > 1 && pastIndex > 0 && (
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() =>
                    scrollToIndex(pastListRef.current, "[data-past-card]", pastIndex - 1)
                  }
                  className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-ws-card-border bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
                >
                  ←
                </button>
              )}
              {userUnlockedStakes.length > 1 && pastIndex < userUnlockedStakes.length - 1 && (
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() =>
                    scrollToIndex(pastListRef.current, "[data-past-card]", pastIndex + 1)
                  }
                  className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-ws-card-border bg-black/60 px-3 py-2 text-white/90 backdrop-blur-sm"
                >
                  →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <StakingModal
        open={isModalOpen}
        onClose={() => {
          closeModal();
        }}
        state={modalState}
        message={modalMessage}
        details={modalDetails}
        onConfirm={() => {
          if (onConfirmHandler) {
            onConfirmHandler();
            setOnConfirmHandler(null);
          }
        }}
      />
      <StakingModal
        open={isRestakeModalOpen}
        state={restakeModalState}
        message={restakeModalMessage}
        details={restakeModalDetails}
        onClose={closeRestakeModal}
        onConfirm={restakeModalState === "confirm" ? handleConfirmRestake : null}
      />
    </section>
  );
};

export default ActiveStakes;
