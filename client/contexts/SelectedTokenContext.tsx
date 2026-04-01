import { getTokenConfig, getTokenConfigs, SupportedToken, TokenConfig } from "@/configs/tokenConfigs";
import { getNetworkName } from "@/utils/networkUtils";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";

interface SelectedTokenContextType {
	selectedToken: TokenConfig;
	changeSelectedToken: (token: SupportedToken) => void;
}

const SelectedTokenContext = createContext<SelectedTokenContextType>({
	selectedToken: getTokenConfig("USDT", getNetworkName()),
	changeSelectedToken: () => {},
});

export const SelectedTokenContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const chainId = useChainId();
	const getDefaultTokenByNetwork = (
		networkName: ReturnType<typeof getNetworkName>
	): SupportedToken => {
		return networkName === "X Layer Mainnet" ? "XLAYER_USDT" : "USDT";
	};

	const getSafeTokenConfig = (token: SupportedToken, networkName: ReturnType<typeof getNetworkName>) => {
		const allConfigs = getTokenConfigs();
		const networkConfigs = allConfigs[networkName];
		if (networkConfigs && networkConfigs[token]) {
			return networkConfigs[token];
		}
		if (networkConfigs && networkConfigs.USDT) {
			return networkConfigs.USDT;
		}
		const fallback = networkConfigs ? Object.values(networkConfigs)[0] : undefined;
		return fallback || getTokenConfig("USDT", getNetworkName());
	};

	const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<SupportedToken>(
		getDefaultTokenByNetwork(getNetworkName(chainId))
	);

	const selectedToken = useMemo<TokenConfig>(() => {
		return getSafeTokenConfig(selectedTokenSymbol, getNetworkName(chainId));
	}, [selectedTokenSymbol, chainId]);

	const changeSelectedToken = (token: SupportedToken) => {
		setSelectedTokenSymbol(token);
	};

	// Enforce deterministic default token whenever chain changes.
	useEffect(() => {
		const networkName = getNetworkName(chainId);
		setSelectedTokenSymbol(getDefaultTokenByNetwork(networkName));
	}, [chainId]);

	return (
		<SelectedTokenContext.Provider value={{ selectedToken, changeSelectedToken }}>
			{children}
		</SelectedTokenContext.Provider>
	);
};

export const useSelectedToken = () => useContext(SelectedTokenContext);
