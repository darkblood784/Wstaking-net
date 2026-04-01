import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { useNotification } from "../components/NotificationProvider";
import { limitDecimalPoint, convertToHumanReadNumber } from "@/utils/limitDecimalPoint";
import { getChainIds, getNetworkConfig, getNetworkName } from "@/utils/networkUtils";
import {
	SUPPORTED_TOKENS,
	SupportedToken,
	TOKEN_ADDRESS_CONFIGS,
	TOKEN_NOADDRESS_CONFIGS,
	TokenConfig,
} from "@/configs/tokenConfigs";
import { customReadContract } from "@/utils/customReadContract";
import BigNumber from "bignumber.js";
import useCryptoPrice, { getTokenUsdPrice } from "@/hooks/useCryptoPrice";
interface SystemDetailsContextType {
	isLoading: boolean;
	showNotification: (message: string, type: "success" | "error" | "info") => void;
	hasAbiError: boolean;
	clearAbiError: () => void;
	totalStaked: string;
	fetchTotalStaked: () => Promise<void>;
	supportedTokens: Record<SupportedToken, TokenConfig>;
	fetchSupportedTokens: () => Promise<void>;
}

const SystemDetailsContext = createContext<SystemDetailsContextType>({
	isLoading: false,
	showNotification: () => {},
	hasAbiError: false,
	clearAbiError: () => {},
	totalStaked: "0",
	fetchTotalStaked: async () => {},
	supportedTokens: {} as any,
	fetchSupportedTokens: async () => {},
});

export type GetAllSupportedTokensResponse = [`0x${string}`[], SupportedToken[]];

export const SystemDetailsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [totalStaked, setTotalStaked] = useState<string>("0");
	const [isLoading, setIsLoading] = useState(false);
	const [hasAbiError, setHasAbiError] = useState(false);
	const [supportedTokens, setSupportedTokens] = useState<Record<SupportedToken, TokenConfig>>({} as any);

	const { showNotification } = useNotification();

	const chainId = useChainId();
	const initializedRef = useRef(false);
	const initializingRef = useRef(false);

	const clearAbiError = useCallback(() => {
		setHasAbiError(false);
	}, []);

	const fetchTotalStaked = async () => {
		let totalStakedValue = new BigNumber(0);

		const tokenPrices = await Promise.all(
			SUPPORTED_TOKENS.map(async (token) => {
				const tokenConfigs = TOKEN_NOADDRESS_CONFIGS[token];
				if (!tokenConfigs) return [token, new BigNumber(0)] as const;
				const tokenPrice = await getTokenUsdPrice(tokenConfigs);
				return [token, tokenPrice] as const;
			})
		).then((entries) => Object.fromEntries(entries) as Record<SupportedToken, BigNumber>);

		for (const chainId of getChainIds("mainnet")) {
			for (const token of SUPPORTED_TOKENS) {
				const networkTokenConfigs = TOKEN_ADDRESS_CONFIGS[getNetworkName(chainId)];
				if (!networkTokenConfigs) continue;

				const tokenAddress = networkTokenConfigs[token];
				if (!tokenAddress) continue;

				const tokenStakedValue = await customReadContract("getTokenAgg", [tokenAddress], chainId)
					.then((response) => response as [bigint, bigint, bigint, bigint, bigint])
					.then((response) => response[0])
					.then((response) => new BigNumber(response.toString()))
					.then((response) => convertToHumanReadNumber(response.toFixed(), chainId));

				const tokenPrice = tokenPrices[token];
				if (!tokenPrice) continue;

				const tokenUsdStakedValue = tokenStakedValue.multipliedBy(tokenPrice);
				totalStakedValue = totalStakedValue.plus(tokenUsdStakedValue);
			}
		}

		setTotalStaked(totalStakedValue.toFixed(0));
	};

	const fetchSupportedTokens = async () => {
		const response = await customReadContract("getAllSupportedTokens", [], chainId).then(
			(response) => response as GetAllSupportedTokensResponse
		);

		const result: Record<SupportedToken, TokenConfig> = {} as any;

		response[1].forEach((tokenName, index) => {
			result[tokenName] = {
				...TOKEN_NOADDRESS_CONFIGS[tokenName],
				address: response[0][index],
			};
		});

		setSupportedTokens(result);
	};

	const reinitializeState = useCallback(async () => {
		setIsLoading(true);

		try {
			await fetchTotalStaked();
			await fetchSupportedTokens();
			initializedRef.current = true;
			console.log("Fetched system details successfully.");
		} catch (error) {
			console.error("Failed to fetch system details:", error);
			setTotalStaked("0");
			setSupportedTokens({} as any);
		} finally {
			setIsLoading(false);
		}
	}, [fetchTotalStaked, fetchSupportedTokens]);

	useEffect(() => {
		initializedRef.current = false;
	}, [chainId]);

	useEffect(() => {
		if (!initializedRef.current && !initializingRef.current) {
			initializingRef.current = true;
			reinitializeState();
		}
	}, [chainId, reinitializeState]);

	return (
		<SystemDetailsContext.Provider
			value={{
				isLoading,
				showNotification,
				hasAbiError,
				clearAbiError,
				totalStaked,
				fetchTotalStaked,
				supportedTokens,
				fetchSupportedTokens,
			}}
		>
			{children}
		</SystemDetailsContext.Provider>
	);
};

export const useSystemDetails = () => useContext(SystemDetailsContext);
