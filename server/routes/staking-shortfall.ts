import { RequestHandler } from "express";
import {
  StakingLiquidityShortfallAlertRequest,
  StakingLiquidityShortfallAlertResponse,
  StakingShortfallAction,
} from "@shared/api";
import { getDb } from "../../api/referral/_lib";

const ALLOWED_ACTIONS = new Set<StakingShortfallAction>([
  "claim",
  "unstake",
  "partial_unstake",
]);

const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const COLLECTION_NAME = "stakingLiquidityShortfalls";

function setPrivateApiHeaders(res: any): void {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function logStakingShortfallAudit(event: string, meta: Record<string, unknown> = {}): void {
  console.info(`[staking-shortfall/${event}]`, {
    at: new Date().toISOString(),
    ...meta,
  });
}

function logStakingShortfallError(event: string, error: unknown, meta: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[staking-shortfall/${event}]`, { ...meta, message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePayload(body: unknown): {
  ok: true;
  payload: StakingLiquidityShortfallAlertRequest;
} | {
  ok: false;
  message: string;
} {
  const payload = (body || {}) as Partial<StakingLiquidityShortfallAlertRequest>;

  if (!Number.isFinite(Number(payload.chainId))) {
    return { ok: false, message: "Invalid chainId." };
  }

  if (!isNonEmptyString(payload.source)) {
    return { ok: false, message: "Missing source." };
  }

  if (!isNonEmptyString(payload.chain)) {
    return { ok: false, message: "Missing chain." };
  }

  if (
    !isNonEmptyString(payload.action) ||
    !ALLOWED_ACTIONS.has(payload.action as StakingShortfallAction)
  ) {
    return { ok: false, message: "Invalid action." };
  }

  if (!isNonEmptyString(payload.userWallet) || !walletAddressRegex.test(payload.userWallet)) {
    return { ok: false, message: "Invalid userWallet." };
  }

  if (!isNonEmptyString(payload.tokenAddress) || !walletAddressRegex.test(payload.tokenAddress)) {
    return { ok: false, message: "Invalid tokenAddress." };
  }

  if (!isNonEmptyString(payload.tokenSymbol)) {
    return { ok: false, message: "Missing tokenSymbol." };
  }

  if (!isNonEmptyString(payload.requiredAmount)) {
    return { ok: false, message: "Missing requiredAmount." };
  }

  if (!isNonEmptyString(payload.availableAmount)) {
    return { ok: false, message: "Missing availableAmount." };
  }

  if (!isNonEmptyString(payload.shortfallAmount)) {
    return { ok: false, message: "Missing shortfallAmount." };
  }

  if (
    !isNonEmptyString(payload.contractAddress) ||
    !walletAddressRegex.test(payload.contractAddress)
  ) {
    return { ok: false, message: "Invalid contractAddress." };
  }

  if (!isNonEmptyString(payload.timestamp)) {
    return { ok: false, message: "Missing timestamp." };
  }

  return {
    ok: true,
    payload: {
      source: payload.source.trim(),
      chain: payload.chain.trim(),
      chainId: Number(payload.chainId),
      action: payload.action as StakingShortfallAction,
      userWallet: payload.userWallet.trim().toLowerCase(),
      tokenAddress: payload.tokenAddress.trim().toLowerCase(),
      tokenSymbol: payload.tokenSymbol.trim(),
      stakeTxnHash: String(payload.stakeTxnHash || "").trim() || undefined,
      requiredAmount: payload.requiredAmount.trim(),
      availableAmount: payload.availableAmount.trim(),
      shortfallAmount: payload.shortfallAmount.trim(),
      contractAddress: payload.contractAddress.trim().toLowerCase(),
      timestamp: payload.timestamp.trim(),
    },
  };
}

export const handleStakingShortfallAlert: RequestHandler = async (req, res) => {
  setPrivateApiHeaders(res);

  const validation = validatePayload(req.body);
  if (!("payload" in validation)) {
    const response: StakingLiquidityShortfallAlertResponse = {
      ok: false,
      forwarded: false,
      message: validation.message,
    };
    return res.status(400).json(response);
  }

  const payload = validation.payload;

  try {
    const db = await getDb();
    const nowMs = Date.now();
    const docRef = await db.collection(COLLECTION_NAME).add({
      source: payload.source,
      chain: payload.chain,
      chainId: payload.chainId,
      action: payload.action,
      userWallet: payload.userWallet,
      tokenAddress: payload.tokenAddress,
      tokenSymbol: payload.tokenSymbol,
      stakeTxnHash: payload.stakeTxnHash || null,
      requiredAmount: payload.requiredAmount,
      availableAmount: payload.availableAmount,
      shortfallAmount: payload.shortfallAmount,
      contractAddress: payload.contractAddress,
      status: "pending",
      botStatus: "pending",
      createdAt: nowMs,
      updatedAt: nowMs,
      eventTimestamp: payload.timestamp,
      sentAt: null,
      resolvedAt: null,
      error: null,
    });

    logStakingShortfallAudit("enqueued", {
      id: docRef.id,
      chainId: payload.chainId,
      action: payload.action,
      wallet: payload.userWallet.slice(0, 6) + "..." + payload.userWallet.slice(-4),
      tokenSymbol: payload.tokenSymbol,
      shortfallAmount: payload.shortfallAmount,
    });

    const response: StakingLiquidityShortfallAlertResponse = {
      ok: true,
      forwarded: false,
      id: docRef.id,
      message: "Shortfall alert queued.",
    };
    return res.status(202).json(response);
  } catch (error) {
    logStakingShortfallError("enqueue-failed", error, {
      chainId: payload.chainId,
      action: payload.action,
      tokenSymbol: payload.tokenSymbol,
    });

    const response: StakingLiquidityShortfallAlertResponse = {
      ok: false,
      forwarded: false,
      message: error instanceof Error ? error.message : "Failed to queue shortfall alert.",
    };
    return res.status(500).json(response);
  }
};
