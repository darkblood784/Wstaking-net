import * as wagmiChains from "wagmi/chains";
import { getChainId } from "@wagmi/core";
import { loadEnvConfig } from "./envLoader";
import { wagmiConfig } from "@/wagmi";

import bnbLogo from "@/assets/networks/bnb.png";
import xLayerLogo from "@/assets/networks/xlayer.png";
import baseLogo from "@/assets/networks/base.png";

export type WagmiChainName = (typeof wagmiChains)[keyof typeof wagmiChains]["name"];

export interface NetworkConfig {
	name: WagmiChainName;
	contractAddress: string;
	precision: number;
	icon: string;
	chainId: number;
}

const envConfig = loadEnvConfig();

const bscTestnetContractAddress = envConfig.bscTestnetContractAddress;
const bscTestnetPrecision = Number(envConfig.bscTestnetPrecision);

const bscContractAddress = envConfig.bscContractAddress;
const bscPrecision = Number(envConfig.bscPrecision);

const xLayerContractAddress = envConfig.xLayerContractAddress;
const xLayerPrecision = Number(envConfig.xLayerPrecision);

const baseSepoliaContractAddress = envConfig.baseSepoliaContractAddress;
const baseSepoliaPrecision = Number(envConfig.baseSepoliaPrecision);

const baseContractAddress = envConfig.baseContractAddress;
const basePrecision = Number(envConfig.basePrecision);

export const NETWORK_CONFIGS: { [key in WagmiChainName]?: NetworkConfig } = {
	"BNB Smart Chain Testnet": {
		name: "BNB Smart Chain Testnet",
		contractAddress: bscTestnetContractAddress,
		precision: bscTestnetPrecision,
		icon: bnbLogo,
		chainId: 97,
	},
	"BNB Smart Chain": {
		name: "BNB Smart Chain",
		contractAddress: bscContractAddress,
		precision: bscPrecision,
		icon: bnbLogo,
		chainId: 56,
	},
	"X Layer Mainnet": {
		name: "X Layer Mainnet",
		contractAddress: xLayerContractAddress,
		precision: xLayerPrecision,
		icon: xLayerLogo,
		chainId: 196,
	},
	"Base Sepolia": {
		name: "Base Sepolia",
		contractAddress: baseSepoliaContractAddress,
		precision: baseSepoliaPrecision,
		icon: baseLogo,
		chainId: 84532,
	},
	"Base": {
		name: "Base",
		contractAddress: baseContractAddress,
		precision: basePrecision,
		icon: baseLogo,
		chainId: 8453,
	},
};

// TODO: refactor and replace with constant in project once free
export const getNetworkConfig = (chainId: null | number = null): NetworkConfig => {
	const networkName = chainId ? getNetworkName(chainId) : getNetworkName();
	const networkConfig = NETWORK_CONFIGS[networkName]

	if (!networkConfig) {
		throw new Error(`Network with chainId ${chainId} is not configured.`);
	}
	
	return networkConfig;
};

export const getAllNetworkConfigs = (): NetworkConfig[] => {
	return getChainIds("all").map((chainId) => getNetworkConfig(chainId));
}

export const getNetworkName = (chainId: null | number = null): WagmiChainName => {
	const envConfig = loadEnvConfig();
	const chainIdValue = chainId || getChainId(wagmiConfig);
	const SUPPORTED_CHAINS = envConfig.supportedChains
		.split(",")
		.map((chainName) => (wagmiChains as any)[chainName.trim()])
		.filter((chain) => chain !== undefined);
	const chain = SUPPORTED_CHAINS.find((c) => c.id === chainIdValue);
	const chainName = chain ? chain.name : `Unknown Chain (ID: ${chainIdValue || "N/A"})`;

	return chainName;
};

export const getChainIds = (type: string): number[] => {
	const envConfig = loadEnvConfig();
	switch (type) {
		case "all":
			const SUPPORTED_CHAINS = envConfig.supportedChains
				.split(",")
				.map((chainName) => (wagmiChains as any)[chainName.trim()])
				.filter((chain) => chain !== undefined);
			return SUPPORTED_CHAINS.map((chain) => chain.id);
		case "mainnet":
			const MAINNET_CHAINS = envConfig.mainnetChains
				.split(",")
				.map((chainName) => (wagmiChains as any)[chainName.trim()])
				.filter((chain) => chain !== undefined);
			return MAINNET_CHAINS.map((chain) => chain.id);
		default:
			return [56, 196]; // BSC Mainnet, X Layer Mainnet
	}
};
