import { Interface } from "ethers";
import { JsonRpcProvider } from "ethers";
import { WebSocketProvider } from "ethers";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type PartialHistoryRecord = {
  txHash: string;
  unstakeTxnHash: string;
  tokenAddress: string;
  amountUnstaked: string;
  penalty: string;
  remainingStake: string;
  timestamp: number;
  blockNumber: number;
  logIndex: number;
};

type CacheEntry = {
  expiresAt: number;
  value: PartialHistoryRecord[];
};

const PARTIAL_UNSTAKE_EVENT_ABI = [
  "event PartialUnstaked(address indexed user,address token,uint256 amountUnstaked,uint256 penalty,uint256 remainingStake,uint256 time,bytes32 unstakeTxnHash,string details)",
];

const CACHE = new Map<string, CacheEntry>();
const FAILED_RPC_UNTIL = new Map<string, number>();

function isAddress(value: string): boolean {
  return ADDRESS_REGEX.test(String(value || "").trim());
}

function toNum(value: any, fallback: number): number {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function getCacheTtlMs(): number {
  return toNum(process.env.PARTIAL_UNSTAKE_HISTORY_CACHE_TTL_MS, 60000);
}

function getChunkSize(): number {
  return Math.max(300, toNum(process.env.PARTIAL_UNSTAKE_HISTORY_CHUNK_SIZE, 1200));
}

function getLookbackBlocks(chainId?: number): number {
  if (chainId) {
    const scoped = toNum(
      process.env[`PARTIAL_UNSTAKE_HISTORY_LOOKBACK_BLOCKS_${chainId}`],
      -1
    );
    if (scoped > 0) return Math.max(1000, scoped);
  }
  return Math.max(2000, toNum(process.env.PARTIAL_UNSTAKE_HISTORY_LOOKBACK_BLOCKS, 40000));
}

function getStartBlockOverride(chainId: number): number | null {
  const scoped = toNum(process.env[`PARTIAL_UNSTAKE_HISTORY_START_BLOCK_${chainId}`], -1);
  if (scoped >= 0) return scoped;
  const global = toNum(process.env.PARTIAL_UNSTAKE_HISTORY_START_BLOCK, -1);
  if (global >= 0) return global;
  return null;
}

function parseRpcList(value: string | undefined): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseWsList(value: string | undefined): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.startsWith("wss://"));
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

type RpcTarget = { url: string; kind: "http" | "ws" };

function toTargets(httpUrls: string[], wsUrls: string[]): RpcTarget[] {
  const httpTargets = httpUrls.map((url) => ({ url, kind: "http" as const }));
  const wsTargets = wsUrls.map((url) => ({ url, kind: "ws" as const }));
  // Prefer websocket endpoints first for log queries; fall back to HTTP.
  return [...wsTargets, ...httpTargets];
}

function getRpcTargets(chainId: number): RpcTarget[] {
  const explicitList = parseRpcList(process.env[`PARTIAL_HISTORY_RPCS_${chainId}`]);
  const explicitWsList = parseWsList(process.env[`PARTIAL_HISTORY_WSS_${chainId}`]);

  switch (chainId) {
    case 97: {
      const httpUrls = unique(
        explicitList
          .concat([
            process.env.PARTIAL_HISTORY_RPC_97 ||
              process.env.VITE_BSC_TESTNET_RPC ||
              "https://lb.drpc.live/bsc-testnet/AhXdQvaIkEOQoCdAuFxwhmAzX-MPEJsR8bwK-uF7NYYO",
            "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
            "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
            "https://bsc-testnet-rpc.publicnode.com",
            "https://bsc-testnet.publicnode.com",
          ])
          .filter(Boolean)
      );
      return toTargets(httpUrls, explicitWsList);
    }
    case 56: {
      const httpUrls = unique(
        explicitList
          .concat([
            process.env.PARTIAL_HISTORY_RPC_56 ||
              "https://lb.drpc.live/bsc/AhXdQvaIkEOQoCdAuFxwhmAzX-MPEJsR8bwK-uF7NYYO",
            "https://bsc-rpc.publicnode.com",
            "https://1rpc.io/bnb",
            "https://binance.llamarpc.com",
            "https://bsc-dataseed.bnbchain.org",
            "https://bsc-dataseed1.bnbchain.org",
          ])
          .filter(Boolean)
      );
      const wsUrls = unique(explicitWsList.concat(["wss://bsc-rpc.publicnode.com"]));
      return toTargets(httpUrls, wsUrls);
    }
    case 196: {
      const httpUrls = unique(
        explicitList
          .concat([
            process.env.PARTIAL_HISTORY_RPC_196 ||
              process.env.VITE_XLAYER_RPC_PRIMARY ||
              process.env.VITE_XLAYER_RPC_PAID ||
              "https://lb.drpc.live/xlayer/AhXdQvaIkEOQoCdAuFxwhmAixyUkDdsR8bi3-uF7NYYO",
            "https://xlayer.drpc.org",
            "https://rpc.sentio.xyz/xlayer-mainnet",
            "https://okx-xlayer.rpc.blxrbdn.com",
            "https://xlayer.rpc.blxrbdn.com",
            "https://xlayerrpc.okx.com",
            "https://rpc.xlayer.tech",
          ])
          .filter(Boolean)
      );
      const wsUrls = unique(explicitWsList.concat(["wss://xlayer.drpc.org"]));
      return toTargets(httpUrls, wsUrls);
    }
    case 84532: {
      const httpUrls = unique(
        explicitList
          .concat([
            process.env.PARTIAL_HISTORY_RPC_84532 ||
              "https://rpc.ankr.com/base_sepolia/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c",
            "https://base-sepolia-rpc.publicnode.com",
          ])
          .filter(Boolean)
      );
      return toTargets(httpUrls, explicitWsList);
    }
    case 8453: {
      const httpUrls = unique(
        explicitList
          .concat([
            process.env.PARTIAL_HISTORY_RPC_8453 ||
              "https://rpc.ankr.com/base/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c",
            "https://base-rpc.publicnode.com",
          ])
          .filter(Boolean)
      );
      return toTargets(httpUrls, explicitWsList);
    }
    default:
      return toTargets(explicitList, explicitWsList);
  }
}

function isRangeOrRateError(error: any): boolean {
  const message = String(error?.shortMessage || error?.message || "").toLowerCase();
  const body = String(error?.info?.responseBody || "").toLowerCase();
  const haystack = `${message} ${body}`;
  return (
    haystack.includes("block range is too large") ||
    haystack.includes("max range") ||
    haystack.includes("query returned more than") ||
    haystack.includes("request timeout") ||
    haystack.includes("timeout") ||
    haystack.includes("too many requests") ||
    haystack.includes("429") ||
    haystack.includes("retry limit")
  );
}

function targetFailKey(chainId: number, url: string): string {
  return `${chainId}:${url}`;
}

function isTargetOnCooldown(chainId: number, url: string): boolean {
  const until = FAILED_RPC_UNTIL.get(targetFailKey(chainId, url)) || 0;
  return until > Date.now();
}

function markTargetFailure(chainId: number, url: string, cooldownMs = 120000): void {
  FAILED_RPC_UNTIL.set(targetFailKey(chainId, url), Date.now() + cooldownMs);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const walletAddress = String(req.query?.walletAddress || "").trim();
    const tokenAddress = String(req.query?.tokenAddress || "").trim();
    const contractAddress = String(req.query?.contractAddress || "").trim();
    const chainId = toNum(req.query?.chainId, 0);
    const limit = Math.max(1, Math.min(100, toNum(req.query?.limit, 20)));
    const requestedFromBlock = toNum(req.query?.fromBlock, -1);

    if (!isAddress(walletAddress) || !isAddress(tokenAddress) || !isAddress(contractAddress)) {
      return res.status(400).json({ ok: false, message: "Invalid address params" });
    }
    if (!chainId) {
      return res.status(400).json({ ok: false, message: "Invalid chainId" });
    }

    const allTargets = getRpcTargets(chainId);
    const cooledTargets = allTargets.filter((t) => !isTargetOnCooldown(chainId, t.url));
    const rpcTargets = cooledTargets.length ? cooledTargets : allTargets;
    if (!rpcTargets.length) {
      return res.status(400).json({ ok: false, message: "Unsupported chainId" });
    }

    const cacheKey = [
      chainId,
      contractAddress.toLowerCase(),
      walletAddress.toLowerCase(),
      tokenAddress.toLowerCase(),
      requestedFromBlock,
      limit,
    ].join(":");

    const cached = CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({ ok: true, records: cached.value, cached: true });
    }

    const iface = new Interface(PARTIAL_UNSTAKE_EVENT_ABI);
    const eventFragment = iface.getEvent("PartialUnstaked");
    const topics = iface.encodeFilterTopics(eventFragment, [walletAddress]);
    let lastError: any = null;

    for (const target of rpcTargets) {
      let provider: JsonRpcProvider | WebSocketProvider | null = null;
      try {
        provider =
          target.kind === "ws"
            ? new WebSocketProvider(target.url, chainId)
            : new JsonRpcProvider(target.url, chainId);

        const latestBlock = Number(await provider.getBlockNumber());
        const configuredStartBlock = getStartBlockOverride(chainId);
        const lookbackBlocks = getLookbackBlocks(chainId);
        const baseStartBlock =
          requestedFromBlock >= 0
            ? requestedFromBlock
            : configuredStartBlock !== null
            ? configuredStartBlock
            : Math.max(0, latestBlock - lookbackBlocks);
        const logs: any[] = [];

        const scanWindows = unique(
          [
            latestBlock - baseStartBlock + 1,
            Math.min(15000, lookbackBlocks),
            Math.min(8000, lookbackBlocks),
            Math.min(4000, lookbackBlocks),
            2000,
          ]
            .map((n) => Math.max(1000, Number(n || 0)))
            .filter((n) => Number.isFinite(n))
            .map((n) => String(n))
        ).map((n) => Number(n));

        let scannedStartBlock = baseStartBlock;
        let logsLoaded = false;

        for (const windowSize of scanWindows) {
          const startBlock = Math.max(0, latestBlock - windowSize + 1, baseStartBlock);
          let effectiveChunk = getChunkSize();

          while (true) {
            try {
              for (let from = startBlock; from <= latestBlock; from += effectiveChunk) {
                const to = Math.min(latestBlock, from + effectiveChunk - 1);
                const rows = await provider.getLogs({
                  address: contractAddress,
                  fromBlock: from,
                  toBlock: to,
                  topics,
                });
                if (rows?.length) logs.push(...rows);
                if (logs.length >= limit * 6) break;
              }
              scannedStartBlock = startBlock;
              logsLoaded = true;
              break;
            } catch (windowError: any) {
              if (isRangeOrRateError(windowError) && effectiveChunk > 300) {
                effectiveChunk = Math.max(300, Math.floor(effectiveChunk / 2));
                continue;
              }
              break;
            }
          }
          if (logsLoaded) break;
        }

        if (!logsLoaded) {
          throw new Error("Failed to load logs after adaptive retries");
        }

        const tokenLc = tokenAddress.toLowerCase();
        const records = logs
          .map((log) => {
            try {
              const parsed = iface.parseLog(log);
              const args: any = parsed?.args || {};
              const token = String(args.token || "").toLowerCase();
              if (token !== tokenLc) return null;
              return {
                txHash: String(log.transactionHash || ""),
                unstakeTxnHash: String(args.unstakeTxnHash || ""),
                tokenAddress: String(args.token || ""),
                amountUnstaked: String(args.amountUnstaked || "0"),
                penalty: String(args.penalty || "0"),
                remainingStake: String(args.remainingStake || "0"),
                timestamp: Number(args.time || 0),
                blockNumber: Number(log.blockNumber || 0),
                logIndex: Number(log.logIndex ?? log.index ?? 0),
              } as PartialHistoryRecord;
            } catch {
              return null;
            }
          })
          .filter((row): row is PartialHistoryRecord => Boolean(row))
          .sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) return b.blockNumber - a.blockNumber;
            return b.logIndex - a.logIndex;
          })
          .slice(0, limit);

        CACHE.set(cacheKey, { expiresAt: Date.now() + getCacheTtlMs(), value: records });

        return res.status(200).json({
          ok: true,
          records,
          cached: false,
          meta: {
            latestBlock,
            startBlock: scannedStartBlock,
            scannedBlocks: latestBlock - scannedStartBlock + 1,
            rpcUrl: target.url,
            transport: target.kind,
          },
        });
      } catch (error: any) {
        lastError = error;
        markTargetFailure(chainId, target.url);
        console.warn("partial-unstake-history rpc failed:", {
          chainId,
          transport: target.kind,
          rpcUrl: target.url,
          message: error?.shortMessage || error?.message || "unknown error",
        });
      } finally {
        if (provider && target.kind === "ws") {
          try {
            (provider as WebSocketProvider).destroy();
          } catch {
            // no-op
          }
        }
      }
    }

    console.error("partial-unstake-history all rpc endpoints failed:", {
      chainId,
      tried: rpcTargets.length,
      targets: rpcTargets.map((t) => `${t.kind}:${t.url}`),
      lastError: lastError?.shortMessage || lastError?.message || null,
    });
    return res.status(200).json({ ok: true, records: [], message: "History temporarily unavailable" });
  } catch (error: any) {
    console.error("partial-unstake-history failed:", error);
    return res.status(200).json({ ok: true, records: [], message: "History temporarily unavailable" });
  }
}
