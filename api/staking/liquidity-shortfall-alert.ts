type StakingShortfallAction = "claim" | "unstake" | "partial_unstake";

interface StakingLiquidityShortfallAlertRequest {
  source: string;
  chain: string;
  chainId: number;
  action: StakingShortfallAction;
  userWallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  stakeTxnHash?: string;
  requiredAmount: string;
  availableAmount: string;
  shortfallAmount: string;
  contractAddress: string;
  timestamp: string;
}

interface StakingLiquidityShortfallAlertResponse {
  ok: boolean;
  forwarded: boolean;
  id?: string;
  message: string;
}

const ALLOWED_ACTIONS = new Set<StakingShortfallAction>([
  "claim",
  "unstake",
  "partial_unstake",
]);

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const COLLECTION_NAME = "stakingLiquidityShortfalls";

let dbPromise: Promise<any> | null = null;

function setPrivateApiHeaders(res: any): void {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function logShortfallAudit(event: string, meta: Record<string, unknown> = {}): void {
  console.info(`[staking-shortfall/${event}]`, {
    at: new Date().toISOString(),
    ...meta,
  });
}

function logShortfallError(event: string, error: unknown, meta: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[staking-shortfall/${event}]`, {
    at: new Date().toISOString(),
    message,
    ...meta,
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function getDb(): Promise<any> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { getApps, initializeApp, cert } = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");

      if (getApps().length > 0) {
        return getFirestore();
      }

      const serviceAccountJson = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
      if (serviceAccountJson) {
        initializeApp({
          credential: cert(JSON.parse(serviceAccountJson)),
        });
        return getFirestore();
      }

      const projectId = String(process.env.FIREBASE_PROJECT_ID || "").trim();
      const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "").trim();
      const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Firebase Admin credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.",
        );
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      return getFirestore();
    })();
  }

  return dbPromise;
}

function validatePayload(body: unknown):
  | { ok: true; payload: StakingLiquidityShortfallAlertRequest }
  | { ok: false; message: string } {
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
  if (!isNonEmptyString(payload.action) || !ALLOWED_ACTIONS.has(payload.action as StakingShortfallAction)) {
    return { ok: false, message: "Invalid action." };
  }
  if (!isNonEmptyString(payload.userWallet) || !WALLET_REGEX.test(payload.userWallet)) {
    return { ok: false, message: "Invalid userWallet." };
  }
  if (!isNonEmptyString(payload.tokenAddress) || !WALLET_REGEX.test(payload.tokenAddress)) {
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
  if (!isNonEmptyString(payload.contractAddress) || !WALLET_REGEX.test(payload.contractAddress)) {
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

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "staking shortfall endpoint ready",
      collection: COLLECTION_NAME,
    });
  }

  if (req.method !== "POST") {
    const response: StakingLiquidityShortfallAlertResponse = {
      ok: false,
      forwarded: false,
      message: "Method not allowed",
    };
    return res.status(405).json(response);
  }

  const validation = validatePayload(req.body);
  if (validation.ok === false) {
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

    logShortfallAudit("enqueued", {
      id: docRef.id,
      chainId: payload.chainId,
      action: payload.action,
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
    logShortfallError("enqueue-failed", error, {
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
}
