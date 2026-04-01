import { WagmiChainName } from "@/utils/networkUtils";
import { ALL_DURATIONS, DurationName } from "./durationConfigs";
import usdt from "@/assets/tokens/usdt.png";
import usdc from "@/assets/tokens/usdc.png";

export interface TokenNoaddressConfig {
	symbol: SupportedToken;
	name: string;
	icon: string;
	gasLimit: number;
	gasPrice: string;
	decimals: number;
	minStakeAmount: string;
	maxStakeAmount: string;
	coingeckoId: string;
	priceEndpoint: string;
	supportedDurations: DurationName[];
	earlyUnstakePenalty: number;
}

export interface TokenConfig extends TokenNoaddressConfig {
    address: `0x${string}`;
}

export type SupportedToken = 'BSC_USDT' | 'XLAYER_USDT' | 'USDT' | 'USDC';

export const SUPPORTED_TOKENS: SupportedToken[] = ['BSC_USDT', 'XLAYER_USDT', 'USDT', 'USDC'];

export const TOKEN_NOADDRESS_CONFIGS: Record<SupportedToken, TokenNoaddressConfig> = {
    BSC_USDT: {
        symbol: "BSC_USDT",
        name: "Tether USD",
        icon: usdt,
        gasLimit: 2000000,
        gasPrice: "6",
        decimals: 6,
        minStakeAmount: "10",
        maxStakeAmount: "0",
        coingeckoId: "tether",
        priceEndpoint: "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
        supportedDurations: ALL_DURATIONS,
        earlyUnstakePenalty: 10,
    },
    XLAYER_USDT: {
        symbol: "XLAYER_USDT",
        name: "Tether USD",
        icon: usdt,
        gasLimit: 2000000,
        gasPrice: "6",
        decimals: 6,
        minStakeAmount: "10",
        maxStakeAmount: "0",
        coingeckoId: "tether",
        priceEndpoint: "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
        supportedDurations: ALL_DURATIONS,
        earlyUnstakePenalty: 10,
    },
    USDT: {
        symbol: "USDT",
        name: "Tether USD",
        icon: usdt,
        gasLimit: 2000000,
        gasPrice: "6",
        decimals: 6,
        minStakeAmount: "10",
        maxStakeAmount: "0",
        coingeckoId: "tether",
        priceEndpoint: "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
        supportedDurations: ALL_DURATIONS,
        earlyUnstakePenalty: 10,
    },
    USDC: {
        symbol: "USDC",
        name: "USDC",
        icon: usdc,
        gasLimit: 2000000,
        gasPrice: "6",
        decimals: 6,
        minStakeAmount: "10",
        maxStakeAmount: "0",
        coingeckoId: "usd-coin",
        priceEndpoint: "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd",
        supportedDurations: ALL_DURATIONS,
        earlyUnstakePenalty: 10,
    }
};

export const TOKEN_ADDRESS_CONFIGS: Partial<Record<WagmiChainName, Partial<Record<SupportedToken, `0x${string}`>>>> = {
    'BNB Smart Chain Testnet': {
        BSC_USDT: '0xd3acF2272aC16DBb5D105f4E4AD533b239168F8D',
        USDT: '0x0674650Fe8d5f5CFAAf00987F7Ac25da4DD8c27A',
        USDC: '0x7007c2413B3D508102Df54a0387A03Be24078eF9',
    },
    'BNB Smart Chain': {
        USDT: '0x55d398326f99059ff775485246999027b3197955',
        USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
    },
    'X Layer Mainnet': {
        XLAYER_USDT: '0x1e4a5963abfd975d8c9021ce480b42188849d41d',
        USDT: '0x779ded0c9e1022225f8e0630b35a9b54be713736',
        USDC: '0x74b7f16337b8972027f6196a17a631ac6de26d22'
    },
    'Base': {
        USDT: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
        USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
    },
    'Base Sepolia': {
        USDT: '0x0d2660e14E231F9375e1139F654ebF9D53Dc4c29',
        USDC: '0xfc9bdac7c265e2baDf2eEF7F226feE5cb8b2C34A'
    }
}

export const getTokenConfig = (token: SupportedToken, network: WagmiChainName): TokenConfig => {
    const networkAddresses = TOKEN_ADDRESS_CONFIGS[network];
    const tokenNoaddressConfig = TOKEN_NOADDRESS_CONFIGS[token];

    if (networkAddresses && networkAddresses[token] && tokenNoaddressConfig) {
        return {
            ...tokenNoaddressConfig,
            address: networkAddresses[token],
        }
    }

    throw new Error(`Token configuration not found for ${token} on ${network}`);
}

export const getTokenConfigs = (): Record<WagmiChainName, Record<SupportedToken, TokenConfig>> => {
    const result: Record<WagmiChainName, Record<SupportedToken, TokenConfig>> = {} as any;

    for (const network in TOKEN_ADDRESS_CONFIGS) {
        const networkName = network as WagmiChainName;
        result[networkName] = {} as any;

        for (const token in TOKEN_ADDRESS_CONFIGS[networkName]) {
            const tokenName = token as SupportedToken;
            result[networkName][tokenName] = getTokenConfig(tokenName, networkName);
        }
    }

    return result;
}