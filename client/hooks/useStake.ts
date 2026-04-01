import { useState } from "react";
import { loadABI } from "@/utils/abiLoader";
import {
	ADMIN_NORMAL_DURATION_CONFIGS,
	ADMIN_PROMOTION_DURATION_CONFIGS,
	DurationName,
	USER_NORMAL_DURATION_CONFIGS,
	USER_PROMOTION_DURATION_CONFIGS,
} from "@/configs/durationConfigs";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { limitDecimalPoint, convertToBlockchainNumber } from "@/utils/limitDecimalPoint";
import { writeContract } from "wagmi/actions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { wagmiConfig } from "@/wagmi";
import { parseReceipt } from "@/utils/parseReceipt";
import { getNetworkConfig } from "@/utils/networkUtils";
import { getAdjustedAPR } from "@/utils/userStakesUtils";
import { sendStakeRealTxnHash } from "@/utils/firebase";
import { checkAllowance } from "@/utils/allowanceUtils";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useUserDetails } from "@/contexts/UserDetailsContext";

const DEV_MIN_STAKE = new BigNumber(10);
const DEV_MAX_THRESHOLD = new BigNumber(10000);

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

export interface UseStakeProps {
	address: string | undefined;
	isAdmin: boolean;
	promotionActive: boolean;
	walletBalance: string;
	systemStatus: boolean;
	showNotification: (message: string, type: "success" | "error" | "info") => void;
	fetchTotalStaked: () => void;
	refreshAllStakes: () => void;
}

const useStake = ({
	address,
	isAdmin,
	promotionActive,
	walletBalance,
	systemStatus,
	showNotification,
	fetchTotalStaked,
	refreshAllStakes,
}: UseStakeProps) => {
	const { t } = useTranslation();
	const { selectedToken } = useSelectedToken();
	const { refreshWalletBalance } = useUserDetails();
	const contractAddress = getNetworkConfig().contractAddress;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalState, setModalState] = useState<"confirm" | "loading" | "success" | "error" | "newstake">("confirm");
	const [modalMessage, setModalMessage] = useState("");
	const [modalDetails, setModalDetails] = useState<string[]>([]);

	// 用來存儲等待確認的質押請求
	const [pendingStake, setPendingStake] = useState<{ amount: string; duration: string } | null>(null);

	const openModal = (
		state: "confirm" | "loading" | "success" | "error" | "newstake",
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
		setPendingStake(null);
	};

	const executeStake = async (amount: string, duration: string): Promise<boolean> => {
		try {
			if (!address) {
				throw new Error("遺失必要參數");
			}

			if (!systemStatus && !isAdmin) {
				showNotification(t("systemMaintenance"), "error");
				return false;
			}

			const amountToStake = convertToBlockchainNumber(amount);
			const contractABI = loadABI("contract");

			openModal("loading", { message: t("stakeInProgress") });

			await checkAllowance(amount, address, selectedToken.symbol, openModal, t);

			// 使用 wagmi 的 writeContract 來呼叫 stake 方法
			const stakeTxHash = await (writeContract as any)(wagmiConfig, {
				address: contractAddress as `0x${string}`,
				abi: contractABI,
				functionName: "stake",
				args: [selectedToken.address, duration, BigInt(amountToStake.toFixed())],
			});

			const tx = await waitForTransactionReceipt(wagmiConfig, {
				hash: stakeTxHash,
				confirmations: 1
			});

			const parsedReceipt = parseReceipt(tx, ["Staked"]);

			if (parsedReceipt.status) {
				// save internal & real txnHashes to firebase if stake successful
				sendStakeRealTxnHash(stakeTxHash, parsedReceipt.internalTxnHash);

				// Immediate refresh.
				await refreshAllStakes?.();
				await fetchTotalStaked?.();
				await refreshWalletBalance?.();

				// Stabilization passes for RPC/indexer lag (renew/normal stake both).
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

				openModal("newstake", {
					message: parsedReceipt.text || t("stakeSuccess"),
					details: [t("blockchainTxnHash"), tx.transactionHash],
				});
				return true;
			} else {
				openModal("error", { message: parsedReceipt.text || t("transactionFailed") });
				return false;
			}
		} catch (error) {
			console.error("質押錯誤:", error);
			openModal("error", { message: t("transactionFailed") });
			return false; // **交易失敗，回傳 false**
		} finally {
			setPendingStake(null); //確保執行後清除 pendingStake
		}
	};

	const validateAndStake = async (amount: string, duration: DurationName): Promise<boolean> => {
		try {
			setPendingStake(null);

			const availableConfigs = isAdmin
				? promotionActive
					? ADMIN_PROMOTION_DURATION_CONFIGS
					: ADMIN_NORMAL_DURATION_CONFIGS
				: promotionActive
				? USER_PROMOTION_DURATION_CONFIGS
				: USER_NORMAL_DURATION_CONFIGS;
			const durationConfig = availableConfigs[duration];

			if (!durationConfig) {
				showNotification(t("invalidDuration"), "error");
				return false;
			}

			const minStakeAmount = new BigNumber(selectedToken.minStakeAmount || "10");
			const maxStakeAmount = new BigNumber(selectedToken.maxStakeAmount || "0");
			const inputAmount = new BigNumber(amount);
			const walletAmount = new BigNumber(walletBalance);

			if (inputAmount.isNaN() || inputAmount.isLessThanOrEqualTo(0)) {
				showNotification(t("enterValidAmount"), "error");
				return false;
			}

			if (inputAmount.isLessThan(minStakeAmount)) {
				showNotification(`${t("minimumStakeAmount")}: ${minStakeAmount.toString()} ${selectedToken.symbol}`, "error");
				return false;
			}

			if (!amount.endsWith(".") && inputAmount.isGreaterThan(walletBalance)) {
				showNotification?.(t("balanceExceededError"), "error");
				return false;
			}

			if (maxStakeAmount.isGreaterThan(0) && inputAmount.isGreaterThan(maxStakeAmount)) {
				showNotification(`${t("maximumStakeAmount")}: ${maxStakeAmount.toString()} ${selectedToken.symbol}`, "error");
				return false;
			}

			if (walletAmount.isNaN() || inputAmount.isGreaterThan(walletAmount)) {
				showNotification(t("insufficientBalance"), "error");
				return false;
			}

			if (!systemStatus && !isAdmin) {
				showNotification(t("systemMaintenance"), "error");
				return false;
			}

			const amountToStake = convertToBlockchainNumber(amount).toNumber();
			const durationInMinutes = durationConfig.durationInMinutes;
			const localDevApr = getLocalPreviewApr(amount, durationInMinutes);
			const adjustedAPR = localDevApr
				? localDevApr.toFixed(18)
				: await getAdjustedAPR(amountToStake, durationInMinutes);

			// Apply local APR interpolation fallback so modal matches UI and doesn't round-up near thresholds
			const APR_RANGES: Record<string, { min: number; max: number }> = {
				"1 Month": { min: 10, max: 10 },
				"3 Months": { min: 12, max: 15 },
				"6 Months": { min: 15, max: 24 },
				"1 Year": { min: 24, max: 36 },
			};

			const humanAmount = Number(amount || 0);
			const range = APR_RANGES[duration] || { min: 10, max: 10 };
			const minThreshold = 10;
			const maxThreshold = 10000;

			let localAprNumeric = range.min;
			if (range.min !== range.max) {
				if (humanAmount >= maxThreshold) {
					localAprNumeric = range.max;
				} else if (humanAmount <= minThreshold) {
					localAprNumeric = range.min;
				} else {
					const t = (humanAmount - minThreshold) / (maxThreshold - minThreshold);
					localAprNumeric = range.min + t * (range.max - range.min);
				}
			}

			const contractAprNumeric = new BigNumber(adjustedAPR).toNumber();
			const chosenApr = localDevApr
				? contractAprNumeric
				: humanAmount < 10000 && contractAprNumeric > localAprNumeric
					? localAprNumeric
					: contractAprNumeric;
			const aprDisplayValue = limitDecimalPoint(chosenApr, 2);

			openModal("confirm", {
				message: t("confirmStakingInfo"),
				details: [
					`${t("stakeAmount")}: ${amount} ${selectedToken.symbol}`,
					`${t("stakingDuration")}: ${duration}`,
					`${t("stakeAPR")}: ${aprDisplayValue}%`,
				],
			});

			// 存儲待確認的質押請求
			setPendingStake({ amount, duration: durationInMinutes.toString() });

			return true; // ✅ 表示驗證成功，等待用戶點擊確認
		} catch (error) {
			console.error("質押驗證錯誤:", error);
			setPendingStake(null);
			showNotification(t("systemMaintenance"), "error");
			return false; // ❌ 表示驗證失敗
		}
	};

	// 當用戶按下 Confirm 時執行 `executeStake`
	const handleConfirmStake = async (): Promise<boolean> => {
		if (!pendingStake) return false;
		return executeStake(pendingStake.amount, pendingStake.duration);
	};

	return {
		validateAndStake,
		isModalOpen,
		modalState,
		modalMessage,
		modalDetails,
		openModal,
		closeModal,
		handleConfirmStake,
	};
};

export default useStake;
