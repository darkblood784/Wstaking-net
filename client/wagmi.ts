import { Chain, connectorsForWallets } from "@rainbow-me/rainbowkit";
import * as wagmiChains from "wagmi/chains";
import * as rainbowWallets from "@rainbow-me/rainbowkit/wallets";
import { createConfig, fallback, http, webSocket } from "wagmi";
import type { Transport } from "viem";
import { loadEnvConfig } from "./utils/envLoader";
import xLayerIcon from "@/assets/networks/xlayer.png";

const envConfig = loadEnvConfig();

if (!envConfig.projectId) {
  throw new Error("Missing WalletConnect Project ID. Please configure it in your environment variables.");
}

export const supportedChains: readonly [Chain, ...Chain[]] = envConfig.supportedChains
  .split(",")
  .map((chainName) => {
    const chain = (wagmiChains as any)[chainName.trim()] as Chain | undefined;
    if (!chain) return undefined;
    if (chain.id === 196) {
      return {
        ...chain,
        iconUrl: xLayerIcon,
        iconBackground: "#0B0F0D",
      } as Chain;
    }
    return chain;
  })
  .filter((chain): chain is Chain => chain !== undefined) as [Chain, ...Chain[]];

if (supportedChains.length === 0) {
  throw new Error("No supported chains found. Please enable at least one chain in environment variables.");
}

const xLayerPaidRpc =
  import.meta.env.VITE_XLAYER_RPC_PAID ||
  import.meta.env.VITE_XLAYER_RPC_PRIMARY ||
  "https://lb.drpc.live/xlayer/AhXdQvaIkEOQoCdAuFxwhmAixyUkDdsR8bi3-uF7NYYO";
const xLayerWsRpc = import.meta.env.VITE_XLAYER_RPC_WS || "wss://xlayer.drpc.org";

const xLayerFreeRpcList = String(
  import.meta.env.VITE_XLAYER_RPC_FALLBACKS ||
    import.meta.env.VITE_XLAYER_RPC_FALLBACK ||
    [
      "https://xlayer.drpc.org",
      "https://rpc.sentio.xyz/xlayer-mainnet",
    ].join(",")
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const xLayerRpcPool = Array.from(new Set([xLayerPaidRpc, ...xLayerFreeRpcList]));
const rotateRpcPool = (pool: string[], key: string): string[] => {
  if (pool.length <= 1) return pool;
  let index = 0;
  if (typeof window !== "undefined") {
    const stored = Number(window.localStorage.getItem(key) || "0");
    index = Number.isFinite(stored) ? stored % pool.length : 0;
    window.localStorage.setItem(key, String((index + 1) % pool.length));
  }
  return [...pool.slice(index), ...pool.slice(0, index)];
};
const xLayerRpcPoolRotated = rotateRpcPool(xLayerRpcPool, "wstaking:xlayer-rpc-index");
const createFastHttp = (url: string) =>
  http(url, {
    timeout: 4000,
    retryCount: 0,
  });

const transports = supportedChains.reduce((acc, chain) => {
  if (chain.id === 56) {
    acc[chain.id] = fallback([
      createFastHttp(
        "https://rpc.ankr.com/bsc/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c"
      ),
      createFastHttp("https://bsc-rpc.publicnode.com"),
    ]);
  } else if (chain.id === 196) {
    acc[chain.id] = fallback(
      [...xLayerRpcPoolRotated.map((url) => createFastHttp(url)), webSocket(xLayerWsRpc)],
      { rank: false }
    );
  } else if (chain.id === 8453) {
    acc[chain.id] = fallback([
      createFastHttp(
        "https://rpc.ankr.com/base/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c"
      ),
      createFastHttp("https://base-rpc.publicnode.com"),
    ]);
  } else if (chain.id === 84532) {
    acc[chain.id] = fallback([
      createFastHttp(
        "https://rpc.ankr.com/base_sepolia/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c"
      ),
      createFastHttp("https://base-sepolia-rpc.publicnode.com"),
    ]);
  } else {
    acc[chain.id] = http();
  }
  return acc;
}, {} as Record<number, Transport>);

const supportedWallets = envConfig.supportedWallets
  .split(",")
  .map((walletName) => (rainbowWallets as any)[walletName.trim()])
  .filter((wallet) => wallet !== undefined);

if (supportedWallets.length === 0) {
  throw new Error("No supported wallets found. Please enable at least one wallet in environment variables.");
}

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: supportedWallets,
    },
  ],
  {
    appName: envConfig.appName || "My App",
    projectId: envConfig.projectId,
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: supportedChains,
  ssr: false,
  transports,
});
