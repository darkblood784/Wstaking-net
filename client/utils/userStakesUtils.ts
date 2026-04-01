import useConvertFromBigNumber from "@/hooks/useConvertFromBigNumber";
import { TFunction } from "i18next";
import { convertToHumanReadNumber, limitDecimalPoint } from "./limitDecimalPoint";
import BigNumber from "bignumber.js";
import { format } from "date-fns";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "@/wagmi";
import { getNetworkConfig } from "./networkUtils";
import { loadABI } from "./abiLoader";
import { customReadContract } from "./customReadContract";
import { getStoredUnstakeKind, UnstakeKind } from "./unstakeKindStore";

export interface UnformattedStakeInfo {
	APR: bigint;
	addFundAllowed: boolean;
	adjustedAPR: bigint;
	claimed: boolean;
	claimedRewards: bigint;
	claimedTxnHashes: string[];
	currentRewards: bigint;
	expectedTotalRewards: bigint;
	isPromo: boolean;
	originalRewards: bigint;
	originalStakedAmount: bigint;
	promoId: bigint;
	rewards: bigint;
	stakeEnd: bigint;
	stakedAmount: bigint;
	stakedAt: bigint;
	stakingType: bigint;
	txnHash: string;
	unlockedAt: bigint;
	unstakeTxnHash: string;
	unstaked: boolean;
	version: bigint;
}

export interface FormattedStakeInfo {
	txnHash: string;
	unstakeTxnHash: string;
	unstakeKind?: UnstakeKind;
	totalStaked: string;
	originalStakedAmount: string;
	apr: string;
	adjustedAPR: string;
	rewards: string;
	claimed: boolean;
	unstaked: boolean;
	duration: string;
	durationInMinutes: number;
	startDate: string;
	endDate: string;
	unlockedAt: string;
	renewedDuration: string; // 雖然未解鎖質押也會有這個數據，只有已解鎖質押才會用
	currentRewards: string | null;
	totalRewards: string | null;
	claimedRewards: string;
	addFundAllowed: boolean;
	isPromo: boolean;
	promoId: number;
	version: string;
	stakingType: number;
}

export interface PaginatedStakeData {
	activeStakes: FormattedStakeInfo[];
	currentPage: number;
	totalPages: number;
	totalItems: number;
	hasStakes: boolean;
}

export const fetchAllUserStakes = async (
	userAddress: string,
	tokenAddress: string,
	chainId?: number
) => {
	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	const maxAttempts = 4;
	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await (readContract as any)(wagmiConfig, {
				address: getNetworkConfig(chainId).contractAddress as `0x${string}`,
				abi: loadABI("contract"),
				functionName: "getAllUserStakes",
				args: [userAddress, tokenAddress],
				chainId: chainId ?? getNetworkConfig().chainId,
			});
			return response as UnformattedStakeInfo[];
		} catch (error: any) {
			lastError = error;
			const message = String(error?.shortMessage || error?.message || error || "");
			const errorBlob = `${message} ${JSON.stringify(error ?? {})}`.toLowerCase();

			if (
				errorBlob.includes("nolockedstakesfound") ||
				errorBlob.includes("no locked stakes found")
			) {
				return [];
			}

			const retryable =
				message.includes("over rate limit") ||
				message.includes("Request Timeout") ||
				message.includes("timeout") ||
				message.includes("408") ||
				message.includes("429") ||
				message.includes("503") ||
				message.includes("NETWORK_ERROR") ||
				message.includes("SERVER_ERROR");

			if (!retryable || attempt === maxAttempts) {
				break;
			}

			await wait(250 * attempt);
		}
	}

	console.error("Failed to fetch user stakes without false-empty fallback:", lastError);
	return null;
};

export const formatZeroCheck = (value: string | number, decimals: number = 18): string => {
	const num = new BigNumber(value);
	if (num.isZero()) {
		return "0";
	}
	return num.toFixed(decimals, BigNumber.ROUND_DOWN).replace(/\.?0+$/, "");
};

export const formatDateWithDateFns = (timestamp: number): string => {
	try {
		if (timestamp <= 0 || timestamp > Number.MAX_SAFE_INTEGER) {
			// 判断时间戳是否无效或超出合理范围
			return timestamp.toString();
		}

		const date = new Date(timestamp);
		if (isNaN(date.getTime())) {
			// 检查日期是否无法解析
			return "無效的時間戳";
		}

		return format(date, "yyyy/MM/dd HH:mm:ss");
	} catch (error) {
		console.error("格式化时间戳时出错:", error);
		return "無效的時間戳";
	}
};

export const formatDuration = (durationInMs: number, t: (key: string) => string): string => {
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;
	const month = 30 * day;
	const year = 365 * day;

	if (durationInMs < hour) {
		const minutes = Math.round(durationInMs / minute);

		if (minutes === 1) {
			return `1 ${t("minute")}`;
		} else {
			return `${minutes} ${t("minutes")}`;
		}
	} else if (durationInMs < day) {
		const hours = Math.round(durationInMs / hour);

		if (hours === 1) {
			return `1 ${t("hour")}`;
		} else {
			return `${hours} ${t("hours")}`;
		}
	} else if (durationInMs < month) {
		const days = Math.round(durationInMs / day);

		if (days === 1) {
			return `1 ${t("day")}`;
		} else {
			return `${days} ${t("days")}`;
		}
	} else if (durationInMs < year) {
		const months = Math.round(durationInMs / month);

		if (months === 1) {
			return `30 ${t("days")}`; // 為了符合figma上用的詞
		} else {
			return `${months} ${t("months")}`;
		}
	} else {
		const years = Math.round(durationInMs / year);

		if (years === 1) {
			return `1 ${t("year")}`;
		} else {
			return `${years} ${t("years")}`;
		}
	}
};

export const formatStakeInfo = (stake: UnformattedStakeInfo, t: TFunction): FormattedStakeInfo => {
	const convertFromBigNumber = useConvertFromBigNumber();

	const stakedAmount = stake.stakedAmount ? stake.stakedAmount.toString() : "0"; // 質押金額
	const rewards = stake.rewards ? stake.rewards.toString() : "0"; // 獎勵金額
	const stakedAt = Number(stake.stakedAt) * 1000; // 轉換為毫秒
	const stakeEnd = Number(stake.stakeEnd) * 1000; // 轉換為毫秒
	const durationInMs = stakeEnd - stakedAt; // 計算質押持續時間
	const aprValue = stake.APR;
	const adjustedAPRValue = limitDecimalPoint(
		new BigNumber(convertFromBigNumber(stake.adjustedAPR.toString())).toString(),
		6
	); // 使用 `useConvertFromBigNumber`
	const claimedRewards = stake.claimedRewards;
	const unlockedAt = Number(stake.unlockedAt) * 1000;
	const addFundAllowed = stake.addFundAllowed;
	const isPromo = stake.isPromo;
	const promoId = stake.promoId;
	const version = stake.version.toString().split("").join("."); // 把提供的版本數字改成“數字.數字”各式
	const stakingType = Number(stake.stakingType);
	const renewedDuration = formatDuration(Number(unlockedAt - stakedAt), t);

	return {
		txnHash: stake.txnHash,
		unstakeTxnHash: stake.unstakeTxnHash,
		unstakeKind: getStoredUnstakeKind(stake.unstakeTxnHash),
		totalStaked: formatZeroCheck(convertToHumanReadNumber(stakedAmount).toString()),
		originalStakedAmount: formatZeroCheck(convertToHumanReadNumber(stake.originalStakedAmount.toString()).toString()),
		apr: `${aprValue}%`, // 年化收益率
		adjustedAPR: `${adjustedAPRValue}%`, // 年化收益率
		startDate: formatDateWithDateFns(stakedAt), // 質押開始時間
		endDate: formatDateWithDateFns(stakeEnd), // 質押結束時間
		unlockedAt: formatDateWithDateFns(unlockedAt),
		rewards: formatZeroCheck(convertToHumanReadNumber(rewards).toString()),
		claimed: stake.claimed, // 是否已領取獎勵
		unstaked: stake.unstaked, // 是否已解除質押
		duration: formatDuration(Number(durationInMs), t),
		durationInMinutes: Math.round(durationInMs / (60 * 1000)),
		currentRewards: formatZeroCheck(convertToHumanReadNumber(stake.currentRewards.toString()).toString()),
		totalRewards: formatZeroCheck(convertToHumanReadNumber(stake.expectedTotalRewards.toString()).toString()),
		claimedRewards: formatZeroCheck(convertToHumanReadNumber(claimedRewards.toString()).toString()),
		addFundAllowed: addFundAllowed,
		isPromo: isPromo,
		promoId: Number(promoId.toString()),
		version: version,
		stakingType: stakingType,
		renewedDuration: renewedDuration,
	};
};

export const getAdjustedAPR = async (amountToStake: number, durationInMinutes: number): Promise<string> => {
	if (isNaN(Number(amountToStake))) {
		return "0";
	}

	try {
		const response = await customReadContract("getAdjustedAPR", [amountToStake, durationInMinutes]).then(
			(response) => response as [bigint, bigint, bigint, bigint]
		);

		const formattedResponse = {
			rawAdjustedAPR: response[0].toString(),
			baseAPR: response[3].toString(),
		};

		return new BigNumber(formattedResponse.rawAdjustedAPR).multipliedBy(100).dividedBy(1e18).toFixed(18).toString();
	} catch (error) {
		console.error("APR 計算錯誤:", error);
		return "0";
	}
};

export const isWithinLockPeriod = (endDate: string): boolean => {
	try {
		const unlockTime = new Date(endDate).getTime();
		const now = Date.now();
		return unlockTime > now;
	} catch (error) {
		console.error("鎖定期檢查錯誤:", error);
		return false;
	}
};
