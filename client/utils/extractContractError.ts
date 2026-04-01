import { getErrorMessage, ERROR_SELECTOR_MAP } from "./errorReasonMap";

type ErrorLike = {
  code?: number | string;
  shortMessage?: string;
  message?: string;
  details?: string;
  reason?: string;
  cause?: unknown;
};

const GENERIC_PATTERNS = [
  /^an unexpected error occurred$/i,
  /^unknown error$/i,
  /^execution reverted$/i,
  /^internal json-rpc error$/i,
  /^transaction execution failed$/i,
  /^request failed$/i,
  /^something went wrong$/i,
  /^the contract function .* reverted$/i,
];

const PREFIX_PATTERNS = [
  /^execution reverted:?\s*/i,
  /^reverted:?\s*/i,
  /^error:?\s*/i,
  /^rpc error:?\s*/i,
  /^contract function .* reverted with the following reason:?\s*/i,
  /^the contract function .* reverted with the following reason:?\s*/i,
  /^vm exception while processing transaction:?\s*/i,
];

const SUFFIX_PATTERNS = [/\s*\[.*$/s, /\s*Version: viem@.*$/i];
const HOT_WALLET_FALLBACK_PATTERNS = [
  /exceeds max transaction gas limit/i,
  /transaction gas limit too high/i,
  /gas required exceeds allowance/i,
  /always failing transaction/i,
];

const cleanMessage = (value: string): string => {
  let output = String(value || "").trim();

  for (const pattern of PREFIX_PATTERNS) {
    output = output.replace(pattern, "").trim();
  }

  for (const pattern of SUFFIX_PATTERNS) {
    output = output.replace(pattern, "").trim();
  }

  if ((output.startsWith('"') && output.endsWith('"')) || (output.startsWith("'") && output.endsWith("'"))) {
    output = output.slice(1, -1).trim();
  }

  return output;
};

const isMeaningfulMessage = (value: string): boolean => {
  if (!value) return false;
  return !GENERIC_PATTERNS.some((pattern) => pattern.test(value));
};

const collectMessages = (error: unknown, seen = new Set<unknown>()): string[] => {
  if (!error || seen.has(error)) return [];
  if (typeof error !== "object") {
    if (typeof error === "string") return [error];
    return [];
  }

  seen.add(error);
  const candidate = error as ErrorLike & Record<string, unknown>;
  const messages: string[] = [];

  for (const field of [candidate.shortMessage, candidate.reason, candidate.details, candidate.message]) {
    if (typeof field === "string" && field.trim()) {
      messages.push(field);
    }
  }

  if (candidate.cause) {
    messages.push(...collectMessages(candidate.cause, seen));
  }

  return messages;
};

export const extractContractErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const candidate = error as ErrorLike | undefined;

  if (candidate?.code === 4001 || candidate?.code === "ACTION_REJECTED") {
    return "Transaction rejected in wallet.";
  }

  const messages = collectMessages(error)
    .map(cleanMessage)
    .filter(Boolean);

  if (isInsufficientHotWalletLiquidityError(error)) {
    return getErrorMessage("InsufficientHotWalletLiquidity", fallbackMessage);
  }

  const best = messages.find(isMeaningfulMessage);

  if (best) {
    const selectorMatch = best.match(/(0x[a-fA-F0-9]{8})/);
    if (selectorMatch) {
      const selector = selectorMatch[1].toLowerCase();
      const errorName = ERROR_SELECTOR_MAP[selector];
      if (errorName) {
        const mappedMessage = getErrorMessage(errorName, "");
        if (mappedMessage) {
          return mappedMessage;
        }
      }
    }

    const errorNameMatch = best.match(/(\w+)\(\)/);
    if (errorNameMatch) {
      const errorName = errorNameMatch[1];
      const mappedMessage = getErrorMessage(errorName, "");
      if (mappedMessage) {
        return mappedMessage;
      }
    }

    const mappedMessage = getErrorMessage(best, "");
    if (mappedMessage) {
      return mappedMessage;
    }
  }

  return best || fallbackMessage;
};

export const isInsufficientHotWalletLiquidityError = (error: unknown): boolean => {
  const messages = collectMessages(error)
    .map(cleanMessage)
    .filter(Boolean);

  const maskedHotWalletFailure = messages.find((message) =>
    HOT_WALLET_FALLBACK_PATTERNS.some((pattern) => pattern.test(message))
  );
  if (maskedHotWalletFailure) {
    return true;
  }

  const best = messages.find(isMeaningfulMessage);
  if (!best) {
    return false;
  }

  const selectorMatch = best.match(/(0x[a-fA-F0-9]{8})/);
  if (selectorMatch) {
    const selector = selectorMatch[1].toLowerCase();
    return ERROR_SELECTOR_MAP[selector] === "InsufficientHotWalletLiquidity";
  }

  const errorNameMatch = best.match(/(\w+)\(\)/);
  if (errorNameMatch) {
    return errorNameMatch[1] === "InsufficientHotWalletLiquidity";
  }

  return best === "InsufficientHotWalletLiquidity";
};
