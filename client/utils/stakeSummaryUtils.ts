import { wagmiConfig } from "@/wagmi";
import BigNumber from "bignumber.js";
import { getNetworkConfig, getNetworkName } from "./networkUtils";
import { loadABI } from "./abiLoader";
import { readContract } from "wagmi/actions";
import { convertToHumanReadNumber } from "./limitDecimalPoint";
import { FormattedStakeInfo } from "./userStakesUtils";
import { getTokenConfig, SupportedToken } from "@/configs/tokenConfigs";
import { customReadContract } from "./customReadContract";

type RawStakesSummary = [BigNumber, BigNumber];

export interface LockedStakesSummary {
	totalStaked: string;
	totalClaimedRewards: string;
	walletBalance: string;
}

export interface UnlockedStakesSummary {
	totalStaked: string;
	totalRewardsClaimed: string;
}

export interface PaginatedStakeData {
	activeStakes: FormattedStakeInfo[];
	currentPage: number;
	totalPages: number;
	totalItems: number;
	hasStakes: boolean;
}

export const fetchLockedStakesSummary = async (
	address: string,
	tokenSymbol: SupportedToken
): Promise<LockedStakesSummary> => {
	try {
		if (!address || !tokenSymbol) {
			throw new Error("必要參數缺失");
		}

		const contractAddress = getNetworkConfig().contractAddress;

		const contractABI = loadABI("contract");
		const erc20ABI = loadABI("erc20");

		const tokenConfig = getTokenConfig(tokenSymbol, getNetworkName());

		// 獲取用戶質押摘要
		const [stakesSummary, balance] = await Promise.all([
			customReadContract("getUserLockedStakesSummary", [address, tokenConfig.address]).then(
				(response) => response as RawStakesSummary
			),
			(readContract as any)(wagmiConfig, {
				abi: erc20ABI,
				address: tokenConfig.address as `0x${string}`,
				functionName: "balanceOf",
				args: [address],
			})
				.then((response) => response as BigNumber)
				.catch(() => "0"),
		]);

		// 解構必要的數據
		// 安全地解構數據，提供預設值
		const [totalStaked = "0", totalClaimedRewards = "0"] =
			stakesSummary && Array.isArray(stakesSummary) ? stakesSummary : [];

		return {
			// 將大數轉換為可讀的以太幣單位
			totalStaked: convertToHumanReadNumber(totalStaked.toString()).toString(),
			totalClaimedRewards: convertToHumanReadNumber(totalClaimedRewards.toString()).toString(),
			walletBalance: convertToHumanReadNumber(balance.toString() || "0")
				.toString()
				.toString(),
		};
	} catch (error) {
		console.error("獲取質押總計數據失敗:", error);
		return {
			totalStaked: "0",
			totalClaimedRewards: "0",
			walletBalance: "0",
		};
	}
};

export const fetchUnlockedStakesSummary = async (
	address: string,
	tokenSymbol: SupportedToken
): Promise<UnlockedStakesSummary> => {
	try {
		if (!address || !tokenSymbol) {
			throw new Error("必要參數缺失");
		}

		const tokenConfig = getTokenConfig(tokenSymbol, getNetworkName());

		// 獲取用戶質押摘要
		const stakesSummary = await customReadContract("getUserUnlockedStakesSummary", [address, tokenConfig.address])
		.then((response) => response as RawStakesSummary);

		// 解構必要的數據
		// 安全地解構數據，提供預設值
		const [totalStaked = "0", totalRewardsLeft = "0"] =
			stakesSummary && Array.isArray(stakesSummary) ? stakesSummary : [];

		return {
			// 將大數轉換為可讀的以太幣單位
			totalStaked: convertToHumanReadNumber(totalStaked.toString()).toString(),
			totalRewardsClaimed: convertToHumanReadNumber(totalRewardsLeft.toString()).toString(),
		};
	} catch (error) {
		console.error("獲取質押總計數據失敗:", error);
		return {
			totalStaked: "0",
			totalRewardsClaimed: "0",
		};
	}
};
