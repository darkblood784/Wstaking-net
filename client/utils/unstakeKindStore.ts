import { Interface } from "ethers";

export type UnstakeKind = "partial" | "full";

const STORAGE_KEY = "ws_unstake_kind_map_v1";
const PARTIAL_RECORDS_KEY = "ws_partial_unstake_records_v1";

type UnstakeKindMap = Record<string, UnstakeKind>;
export interface PartialUnstakeRecord {
  chainId: number;
  walletAddress: string;
  tokenAddress: string;
  txHash: string;
  unstakeTxnHash: string;
  amountUnstaked: string;
  penalty: string;
  remainingStake: string;
  timestamp: number;
}

const normalizeHash = (value: string) => String(value || "").toLowerCase().trim();

const readMap = (): UnstakeKindMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as UnstakeKindMap) : {};
  } catch {
    return {};
  }
};

const writeMap = (map: UnstakeKindMap): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage write failures
  }
};

const readPartialRecords = (): PartialUnstakeRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PARTIAL_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PartialUnstakeRecord[]) : [];
  } catch {
    return [];
  }
};

const writePartialRecords = (records: PartialUnstakeRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PARTIAL_RECORDS_KEY, JSON.stringify(records.slice(0, 300)));
  } catch {
    // ignore storage write failures
  }
};

export const getStoredUnstakeKind = (unstakeTxnHash?: string): UnstakeKind | undefined => {
  const key = normalizeHash(unstakeTxnHash || "");
  if (!key) return undefined;
  const map = readMap();
  return map[key];
};

export const rememberUnstakeKind = (unstakeTxnHash: string, kind: UnstakeKind): void => {
  const key = normalizeHash(unstakeTxnHash);
  if (!key) return;
  const map = readMap();
  map[key] = kind;
  writeMap(map);
};

export const rememberPartialUnstakeRecord = (record: PartialUnstakeRecord): void => {
  const hash = normalizeHash(record.unstakeTxnHash || record.txHash);
  if (!hash) return;
  const records = readPartialRecords();
  const deduped = records.filter((item) => {
    const key = normalizeHash(item.unstakeTxnHash || item.txHash);
    return key !== hash;
  });
  deduped.unshift(record);
  writePartialRecords(deduped);
};

export const getStoredPartialUnstakeRecords = (
  walletAddress: string,
  tokenAddress: string,
  chainId: number
): PartialUnstakeRecord[] => {
  const wallet = normalizeHash(walletAddress);
  const token = normalizeHash(tokenAddress);
  return readPartialRecords()
    .filter((record) => {
      return (
        Number(record.chainId) === Number(chainId) &&
        normalizeHash(record.walletAddress) === wallet &&
        normalizeHash(record.tokenAddress) === token
      );
    })
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
};

export const classifyUnstakeReceipt = (
  receipt: any,
  contractAddress: string,
  abi: any[]
): {
  kind: UnstakeKind | "unknown";
  unstakeTxnHash?: string;
  details?: string;
  partialData?: {
    tokenAddress: string;
    amountUnstaked: string;
    penalty: string;
    remainingStake: string;
    timestamp: number;
  };
} => {
  try {
    const iface = new Interface(abi);
    const target = String(contractAddress || "").toLowerCase();
    let hasPartial = false;
    let hasFull = false;
    let unstakeTxnHash = "";
    let details = "";
    let partialData:
      | {
          tokenAddress: string;
          amountUnstaked: string;
          penalty: string;
          remainingStake: string;
          timestamp: number;
        }
      | undefined;

    for (const log of receipt?.logs || []) {
      if (String(log?.address || "").toLowerCase() !== target) continue;
      try {
        const parsed = iface.parseLog(log);
        if (!parsed) continue;
        if (parsed.name === "PartialUnstaked") {
          hasPartial = true;
          if (!unstakeTxnHash && parsed?.args?.unstakeTxnHash) {
            unstakeTxnHash = String(parsed.args.unstakeTxnHash);
          }
          if (!details) {
            details = String(parsed?.args?.details || parsed?.args?.message || "");
          }
          partialData = {
            tokenAddress: String(parsed?.args?.token || ""),
            amountUnstaked: String(parsed?.args?.amountUnstaked || "0"),
            penalty: String(parsed?.args?.penalty || "0"),
            remainingStake: String(parsed?.args?.remainingStake || "0"),
            timestamp: Number(parsed?.args?.time || 0),
          };
        }
        if (parsed.name === "Unstaked") {
          hasFull = true;
          if (!unstakeTxnHash && parsed?.args?.unstakeTxnHash) {
            unstakeTxnHash = String(parsed.args.unstakeTxnHash);
          }
          if (!details) {
            details = String(parsed?.args?.details || parsed?.args?.message || "");
          }
        }
      } catch {
        // ignore unrelated logs
      }
    }

    if (hasPartial && !hasFull) return { kind: "partial", unstakeTxnHash, details, partialData };
    if (hasFull && !hasPartial) return { kind: "full", unstakeTxnHash, details };
    return { kind: "unknown", unstakeTxnHash, details };
  } catch {
    return { kind: "unknown" };
  }
};
