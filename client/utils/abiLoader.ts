import { getChainId } from "@wagmi/core";

import baseABIFile from "../../BASEABI.json";
import baseTestnetArtifact from "../../BASEtestnetABI.json";
import bscABIFile from "../../BSCABI.json";
import bscTestnetABIFile from "../../BSCtestnetABI.json";
import xLayerABIFile from "../../XlayerABI.json";
import globalABI from "../abi/global/SimpleStorageABI.json";
import indonesiaABI from "../abi/indonesia/SimpleStorageABI.json";
import erc20ABI from "../abi/erc20ABI.json";
import { wagmiConfig } from "@/wagmi";
import { loadEnvConfig } from "./envLoader";

type AbiItem = Record<string, unknown>;
type AbiSource = AbiItem[] | { abi?: AbiItem[] };

const normalizeAbi = (source: AbiSource): AbiItem[] => {
  if (Array.isArray(source)) return source;
  if (source && Array.isArray(source.abi)) return source.abi;
  return [];
};

const networkAbiByChainId: Record<number, AbiItem[]> = {
  56: normalizeAbi(bscABIFile as AbiSource),
  97: normalizeAbi(bscTestnetABIFile as AbiSource),
  196: normalizeAbi(xLayerABIFile as AbiSource),
  8453: normalizeAbi(baseABIFile as AbiSource),
  84532: normalizeAbi(baseTestnetArtifact as AbiSource),
};

const getFallbackAbi = (): AbiItem[] => {
  const envConfig = loadEnvConfig();
  const serviceName = String(envConfig.serviceName || "").trim().toLowerCase();

  switch (serviceName) {
    case "indonesia":
      return normalizeAbi(indonesiaABI as AbiSource);
    case "global":
    default:
      return normalizeAbi(globalABI as AbiSource);
  }
};

const resolveActiveChainId = (): number | null => {
  try {
    return getChainId(wagmiConfig);
  } catch {
    return null;
  }
};

export const loadABI = (abiType = "contract", chainId: number | null = null): AbiItem[] => {
  if (abiType === "erc20") {
    return normalizeAbi(erc20ABI as AbiSource);
  }

  const activeChainId = chainId ?? resolveActiveChainId();
  if (activeChainId && networkAbiByChainId[activeChainId]?.length) {
    return networkAbiByChainId[activeChainId];
  }

  return getFallbackAbi();
};
