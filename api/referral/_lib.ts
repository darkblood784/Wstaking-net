/**
 * api/referral/_lib.ts
 *
 * Shared server-side utilities for the referral API routes.
 *
 * Responsibilities:
 *  1. Firebase Admin SDK initialisation (server-side Firestore access)
 *  2. Admin session cookie verification (reuses the same signed-token scheme
 *     as the existing admin-auth flow)
 *  3. On-chain stake fetching via viem (for snapshot creation)
 *  4. Snapshot-based reward calculation (the source of truth for claim amounts)
 *  5. Claim nonce creation / verification (prevents replay attacks)
 *
 * Required env vars:
 *   ADMIN_AUTH_SECRET                 – HMAC signing key (existing)
 *   FIREBASE_SERVICE_ACCOUNT_JSON     – Firebase Admin service account JSON
 *     OR individually:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 *   Per-chain RPC URLs (at least one per supported chain):
 *   REFERRAL_BSC_RPC_URLS             – comma-separated BSC mainnet RPCs
 *   REFERRAL_BSCTEST_RPC_URLS         – BSC testnet RPCs
 *   REFERRAL_XLAYER_RPC_URLS          – X Layer RPCs
 *   REFERRAL_BASE_RPC_URLS            – Base mainnet RPCs
 *   REFERRAL_BASESEP_RPC_URLS         – Base Sepolia RPCs
 *
 *   (Fallback: VITE_* contract addresses set in the env dashboard are readable
 *    from process.env in Vercel functions even though they have the VITE_ prefix)
 */

import { createHmac, timingSafeEqual, randomBytes } from "crypto";
// ── Firebase Admin ─────────────────────────────────────────────────────────
// Uses native ESM dynamic import for firebase-admin (Vercel-compatible).
// Call getDb() only inside request handlers.
let _dbPromise: Promise<any> | null = null;

async function initFirebaseAdmin(): Promise<any> {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const apps = getApps();
  if (apps.length > 0) {
    return getFirestore();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let credential: any;

  if (serviceAccountJson) {
    try {
      credential = cert(JSON.parse(serviceAccountJson));
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is set but cannot be parsed as JSON");
    }
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores multi-line private keys with literal \n
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  } else {
    throw new Error(
      "Firebase Admin credentials not configured. " +
      "Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
    );
  }

  initializeApp({ credential });
  return getFirestore();
}

export function getDb(): Promise<any> {
  if (!_dbPromise) _dbPromise = initFirebaseAdmin();
  return _dbPromise;
}

// ── Shared API hardening helpers ─────────────────────────────────────────────
const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{4,12}$/;
const REFERRAL_CAPTURE_COOKIE_NAME = "wstaking_referral_capture";
const REFERRAL_CAPTURE_TTL_SECONDS = 30 * 24 * 60 * 60;
const RESERVED_REFERRAL_CODES = new Set([
  "ADMIN",
  "OWNER",
  "MASTER",
  "ROOT",
  "SYSTEM",
  "SUPPORT",
  "WS",
  "WSTAKING",
  "REFERRAL",
  "REFERRALS",
  "REWARD",
  "REWARDS",
  "CLAIM",
  "CLAIMS",
  "NULL",
  "UNDEFINED",
  "TEST",
  "DEFAULT",
]);

export function setPrivateApiHeaders(res: any): void {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export function getClientIp(req: any): string {
  return (
    String(req.headers?.["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() ||
    String(req.socket?.remoteAddress || "").trim() ||
    "unknown"
  );
}

export function redactWallet(value: unknown): string | null {
  const wallet = String(value || "").trim().toLowerCase();
  if (!WALLET_REGEX.test(wallet)) return null;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function redactReferralCode(value: unknown): string | null {
  const code = normalizeReferralCode(String(value || ""));
  if (!isValidReferralCode(code)) return null;
  if (code.length <= 4) return code;
  return `${code.slice(0, 2)}...${code.slice(-2)}`;
}

export function enforceRateLimit(
  req: any,
  res: any,
  bucket: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const key = `${bucket}:${getClientIp(req)}`;
  const current = RATE_LIMIT_STORE.get(key);

  if (!current || current.resetAt <= now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    logReferralEvent("rate-limit-exceeded", {
      bucket,
      ip: getClientIp(req),
      limit,
      windowMs,
      retryAfterSeconds,
    });
    return false;
  }

  current.count += 1;
  RATE_LIMIT_STORE.set(key, current);
  return true;
}

export function logReferralEvent(
  event: string,
  meta: Record<string, unknown> = {},
): void {
  console.warn(`[referral/${event}]`, meta);
}

export function logReferralError(
  event: string,
  error: unknown,
  meta: Record<string, unknown> = {},
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[referral/${event}]`, { ...meta, message });
}

export function logReferralAudit(
  event: string,
  meta: Record<string, unknown> = {},
): void {
  console.info(`[referral/audit/${event}]`, {
    at: new Date().toISOString(),
    ...meta,
  });
}

export function isValidReferralCode(value: string): boolean {
  return REFERRAL_CODE_REGEX.test(String(value || "").trim().toUpperCase());
}

export function normalizeReferralCode(value: string): string {
  return String(value || "").trim().toUpperCase();
}

export function isReservedReferralCode(value: string): boolean {
  return RESERVED_REFERRAL_CODES.has(normalizeReferralCode(value));
}

export function getReferralCodeValidationError(value: string): string | null {
  const normalized = normalizeReferralCode(value);
  if (!isValidReferralCode(normalized)) {
    return "Code must be 4-12 characters using letters A-Z and digits 0-9 only.";
  }
  if (isReservedReferralCode(normalized)) {
    return "That code is reserved. Please choose a different one.";
  }
  return null;
}

// ── Admin session verification ──────────────────────────────────────────────
const SESSION_COOKIE_NAME = "wstaking_admin_session";

function base64UrlDecode(input: string): Buffer {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function readCookie(req: any, name: string): string | null {
  const header = String(req.headers?.cookie || "");
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

function verifySignedTokenPayload(token: string): Record<string, any> | null {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) return null;
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return null;
  const expected = base64UrlEncode(
    createHmac("sha256", secret).update(payloadEncoded).digest()
  );
  // Constant-time comparison to prevent timing attacks on HMAC
  let signaturesMatch = false;
  try {
    signaturesMatch = timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureEncoded)
    );
  } catch {
    // Buffer lengths differ — definitely not equal
    signaturesMatch = false;
  }
  if (!signaturesMatch) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSignedToken(
  payload: Record<string, any>,
  ttlSeconds: number
): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) throw new Error("Missing ADMIN_AUTH_SECRET");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payloadEncoded = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const sig = base64UrlEncode(
    createHmac("sha256", secret).update(payloadEncoded).digest()
  );
  return `${payloadEncoded}.${sig}`;
}

function appendSetCookie(res: any, cookieValue: string): void {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }
  const next = Array.isArray(current) ? [...current, cookieValue] : [String(current), cookieValue];
  res.setHeader("Set-Cookie", next);
}

function buildCookieAttributes(maxAgeSeconds: number): string[] {
  const attrs = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === "production") {
    attrs.push("Secure");
  }
  return attrs;
}

export function setReferralCaptureCookie(res: any, referralCode: string): void {
  const normalizedCode = normalizeReferralCode(referralCode);
  const token = createSignedToken(
    { code: normalizedCode, purpose: "referral-capture" },
    REFERRAL_CAPTURE_TTL_SECONDS,
  );
  appendSetCookie(
    res,
    `${REFERRAL_CAPTURE_COOKIE_NAME}=${token}; ${buildCookieAttributes(REFERRAL_CAPTURE_TTL_SECONDS).join("; ")}`
  );
}

export function clearReferralCaptureCookie(res: any): void {
  appendSetCookie(
    res,
    `${REFERRAL_CAPTURE_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
}

export function getCapturedReferralCode(req: any): string | null {
  const token = readCookie(req, REFERRAL_CAPTURE_COOKIE_NAME);
  if (!token) return null;
  const payload = verifySignedTokenPayload(token);
  if (!payload || payload.purpose !== "referral-capture" || !isValidReferralCode(payload.code)) {
    return null;
  }
  return normalizeReferralCode(payload.code);
}

/**
 * Returns the verified admin wallet address from the session cookie,
 * or null if the session is absent / invalid / expired.
 */
export function verifyAdminSession(req: any): string | null {
  const token = readCookie(req, SESSION_COOKIE_NAME);
  if (!token) return null;
  const payload = verifySignedTokenPayload(token);
  if (!payload?.walletAddress) return null;
  return String(payload.walletAddress).toLowerCase();
}

type ReferralAllocationMode = "owner_only" | "owner_master_80_20";

interface NormalizedReferralPolicy {
  inviterWallet: string;
  isActive: boolean;
  isKOL: boolean;
  allocationMode: ReferralAllocationMode;
  contractEnd: number | null;
  masterWallet: string | null;
}

interface ReferralBindingDecision {
  beneficiaryWallet: string;
  beneficiaryType: "owner" | "master" | "split";
  secondaryBeneficiaryWallet: string | null;
  allocationModeAtBind: ReferralAllocationMode;
  bindingSequence: number;
  protectedThreshold: number;
  wasProtectedBucket: boolean;
  contractExpired: boolean;
  masterWalletAtBind: string | null;
  isKOLAtBind: boolean;
  routingVersion: number;
}

const REFERRAL_ROUTING_VERSION = 1;
const NORMAL_PROTECTED_BINDINGS = 3;
const KOL_PROTECTED_BINDINGS = 5;

export function normalizeReferralPolicy(codeData: Record<string, any>): NormalizedReferralPolicy {
  const inviterWallet = String(codeData?.inviterWallet || "").toLowerCase();
  const configuredMasterWallet = String(
    codeData?.masterWallet || process.env.REFERRAL_DEFAULT_MASTER_WALLET || "",
  )
    .trim()
    .toLowerCase();
  const allocationMode =
    String(codeData?.allocationMode || "").trim().toLowerCase() === "owner_only"
      ? "owner_only"
      : "owner_master_80_20";

  const parsedContractEnd = Number(codeData?.contractEnd ?? 0);
  const contractEnd = Number.isFinite(parsedContractEnd) && parsedContractEnd > 0
    ? parsedContractEnd
    : null;

  return {
    inviterWallet,
    isActive: codeData?.isActive !== false,
    isKOL: Boolean(codeData?.isKOL),
    allocationMode,
    contractEnd,
    masterWallet: WALLET_REGEX.test(configuredMasterWallet) ? configuredMasterWallet : null,
  };
}

export function resolveReferralBindingDecision(
  policy: NormalizedReferralPolicy,
  existingBindingCount: number,
): ReferralBindingDecision {
  const bindingSequence = existingBindingCount + 1;
  const protectedThreshold = policy.isKOL ? KOL_PROTECTED_BINDINGS : NORMAL_PROTECTED_BINDINGS;
  const wasProtectedBucket = bindingSequence <= protectedThreshold;
  const contractExpired = policy.contractEnd !== null && Date.now() >= policy.contractEnd;

  if (contractExpired && policy.masterWallet) {
    return {
      beneficiaryWallet: policy.masterWallet,
      beneficiaryType: "master",
      secondaryBeneficiaryWallet: null,
      allocationModeAtBind: policy.allocationMode,
      bindingSequence,
      protectedThreshold,
      wasProtectedBucket: false,
      contractExpired: true,
      masterWalletAtBind: policy.masterWallet,
      isKOLAtBind: policy.isKOL,
      routingVersion: REFERRAL_ROUTING_VERSION,
    };
  }

  if (wasProtectedBucket || policy.allocationMode === "owner_only" || !policy.masterWallet) {
    return {
      beneficiaryWallet: policy.inviterWallet,
      beneficiaryType: "owner",
      secondaryBeneficiaryWallet: null,
      allocationModeAtBind: policy.allocationMode,
      bindingSequence,
      protectedThreshold,
      wasProtectedBucket,
      contractExpired,
      masterWalletAtBind: policy.masterWallet,
      isKOLAtBind: policy.isKOL,
      routingVersion: REFERRAL_ROUTING_VERSION,
    };
  }

  return {
    beneficiaryWallet: policy.inviterWallet,
    beneficiaryType: "split",
    secondaryBeneficiaryWallet: policy.masterWallet,
    allocationModeAtBind: policy.allocationMode,
    bindingSequence,
    protectedThreshold,
    wasProtectedBucket: false,
    contractExpired,
    masterWalletAtBind: policy.masterWallet,
    isKOLAtBind: policy.isKOL,
    routingVersion: REFERRAL_ROUTING_VERSION,
  };
}

// ── Claim nonce (prevents replay attacks on claim submission) ───────────────
const CLAIM_NONCE_TTL_SECONDS = 10 * 60; // 10 minutes

export function createClaimNonce(walletAddress: string): {
  challengeToken: string;
  message: string;
} {
  const nonce = base64UrlEncode(randomBytes(16));
  const issuedAt = new Date().toISOString();
  const normalized = walletAddress.toLowerCase();
  const challengeToken = createSignedToken(
    { walletAddress: normalized, nonce, issuedAt },
    CLAIM_NONCE_TTL_SECONDS
  );
  const message =
    `WStaking Referral Claim Request\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${issuedAt}\n\n` +
    `Sign to prove ownership for reward claim.`;
  return { challengeToken, message };
}

/**
 * Verifies that:
 *  1. The challengeToken is valid and not expired.
 *  2. The walletAddress in the token matches the supplied walletAddress.
 *  3. The EIP-191 signature over the message is valid and from walletAddress.
 *
 * Returns the verified wallet address (lowercase) or throws.
 */
export async function verifyClaimSignature(
  walletAddress: string,
  signature: string,
  challengeToken: string
): Promise<string> {
  const { verifyMessage } = await import("viem");
  const payload = verifySignedTokenPayload(challengeToken);
  if (!payload) throw new Error("Challenge token is invalid or expired.");

  const normalized = walletAddress.toLowerCase();
  if (payload.walletAddress !== normalized) {
    throw new Error("Challenge token wallet mismatch.");
  }

  const message =
    `WStaking Referral Claim Request\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${payload.nonce}\n` +
    `Issued At: ${payload.issuedAt}\n\n` +
    `Sign to prove ownership for reward claim.`;

  const isValid = await verifyMessage({
    address: normalized as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) throw new Error("Signature verification failed.");
  return normalized;
}

// ── Bind nonce (prevents replay / forgery attacks on referral binding) ───────
const BIND_NONCE_TTL_SECONDS = 10 * 60; // 10 minutes

export function createBindNonce(walletAddress: string): {
  challengeToken: string;
  message: string;
} {
  const nonce = base64UrlEncode(randomBytes(16));
  const issuedAt = new Date().toISOString();
  const normalized = walletAddress.toLowerCase();
  const challengeToken = createSignedToken(
    { walletAddress: normalized, nonce, issuedAt, purpose: "bind" },
    BIND_NONCE_TTL_SECONDS
  );
  const message =
    `WStaking Referral Bind\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${issuedAt}\n\n` +
    `Sign to connect your wallet to a referral code.`;
  return { challengeToken, message };
}

/**
 * Verifies a wallet-signed bind nonce challenge.
 * Returns the verified wallet address (lowercase) or throws.
 */
export async function verifyBindSignature(
  walletAddress: string,
  signature: string,
  challengeToken: string
): Promise<string> {
  const { verifyMessage } = await import("viem");
  const payload = verifySignedTokenPayload(challengeToken);
  if (!payload) throw new Error("Challenge token is invalid or expired.");
  if (payload.purpose !== "bind") throw new Error("Token purpose mismatch.");

  const normalized = walletAddress.toLowerCase();
  if (payload.walletAddress !== normalized) {
    throw new Error("Challenge token wallet mismatch.");
  }

  const message =
    `WStaking Referral Bind\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${payload.nonce}\n` +
    `Issued At: ${payload.issuedAt}\n\n` +
    `Sign to connect your wallet to a referral code.`;

  const isValid = await verifyMessage({
    address: normalized as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) throw new Error("Signature verification failed.");
  return normalized;
}

// ── Setup nonce (prevents replay / forgery attacks on referral code setup) ───
const SETUP_NONCE_TTL_SECONDS = 10 * 60; // 10 minutes

export function createSetupNonce(walletAddress: string): {
  challengeToken: string;
  message: string;
} {
  const nonce = base64UrlEncode(randomBytes(16));
  const issuedAt = new Date().toISOString();
  const normalized = walletAddress.toLowerCase();
  const challengeToken = createSignedToken(
    { walletAddress: normalized, nonce, issuedAt, purpose: "setup" },
    SETUP_NONCE_TTL_SECONDS
  );
  const message =
    `WStaking Referral Code Setup\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${issuedAt}\n\n` +
    `Sign to confirm you own this wallet and authorize this referral code setup.`;
  return { challengeToken, message };
}

/**
 * Verifies a wallet-signed setup nonce challenge.
 * Returns the verified wallet address (lowercase) or throws.
 */
export async function verifySetupSignature(
  walletAddress: string,
  signature: string,
  challengeToken: string
): Promise<string> {
  const { verifyMessage } = await import("viem");
  const payload = verifySignedTokenPayload(challengeToken);
  if (!payload) throw new Error("Challenge token is invalid or expired.");
  if (payload.purpose !== "setup") throw new Error("Token purpose mismatch.");

  const normalized = walletAddress.toLowerCase();
  if (payload.walletAddress !== normalized) {
    throw new Error("Challenge token wallet mismatch.");
  }

  const message =
    `WStaking Referral Code Setup\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${payload.nonce}\n` +
    `Issued At: ${payload.issuedAt}\n\n` +
    `Sign to confirm you own this wallet and authorize this referral code setup.`;

  const isValid = await verifyMessage({
    address: normalized as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) throw new Error("Signature verification failed.");
  return normalized;
}

// ── On-chain stake reading via viem ─────────────────────────────────────────
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

async function getChainConfigs(): Promise<Record<
  string,
  {
    chain: any;
    rpcEnvKey: string;
    defaultRpcUrls: string[];
    contractEnvKey: string;
    tokens: Record<string, string>;
    precision: number;
  }
>> {
  const { defineChain } = await import("viem");
  const { bsc, bscTestnet, base, baseSepolia } = await import("viem/chains");

  const xLayerMainnet = defineChain({
    id: 196,
    name: "X Layer Mainnet",
    nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.xlayer.tech"] } },
    blockExplorers: {
      default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
    },
  });

  return {
    "X Layer Mainnet": {
      chain: xLayerMainnet,
      rpcEnvKey: "REFERRAL_XLAYER_RPC_URLS",
      defaultRpcUrls: [
        "https://lb.drpc.live/xlayer/AhXdQvaIkEOQoCdAuFxwhmAixyUkDdsR8bi3-uF7NYYO",
        "https://xlayer.drpc.org",
        "https://rpc.sentio.xyz/xlayer-mainnet",
        "https://rpc.xlayer.tech",
      ],
      contractEnvKey: "VITE_XLAYER_CONTRACT_ADDRESS",
      tokens: {
        "0x1e4a5963abfd975d8c9021ce480b42188849d41d": "USDT",
      },
      precision: 6,
    },
    "BNB Smart Chain": {
      chain: bsc,
      rpcEnvKey: "REFERRAL_BSC_RPC_URLS",
      defaultRpcUrls: [
        "https://rpc.ankr.com/bsc/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c",
        "https://bsc-rpc.publicnode.com",
      ],
      contractEnvKey: "VITE_BSC_CONTRACT_ADDRESS",
      tokens: {
        "0x55d398326f99059ff775485246999027b3197955": "USDT",
        "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC",
      },
      precision: 18,
    },
    "BNB Smart Chain Testnet": {
      chain: bscTestnet,
      rpcEnvKey: "REFERRAL_BSCTEST_RPC_URLS",
      defaultRpcUrls: [
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://data-seed-prebsc-2-s1.binance.org:8545",
      ],
      contractEnvKey: "VITE_BSC_TESTNET_CONTRACT_ADDRESS",
      tokens: {
        "0xd3acf2272ac16dbb5d105f4e4ad533b239168f8d": "BSC_USDT",
        "0x0674650fe8d5f5cfaaf00987f7ac25da4dd8c27a": "USDT",
        "0x7007c2413b3d508102df54a0387a03be24078ef9": "USDC",
      },
      precision: 18,
    },
    Base: {
      chain: base,
      rpcEnvKey: "REFERRAL_BASE_RPC_URLS",
      defaultRpcUrls: [
        "https://rpc.ankr.com/base/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c",
        "https://base-rpc.publicnode.com",
      ],
      contractEnvKey: "VITE_BASE_CONTRACT_ADDRESS",
      tokens: {
        "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2": "USDT",
        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "USDC",
      },
      precision: 6,
    },
    "Base Sepolia": {
      chain: baseSepolia,
      rpcEnvKey: "REFERRAL_BASESEP_RPC_URLS",
      defaultRpcUrls: [
        "https://rpc.ankr.com/base_sepolia/cf03548853492ca52d6ff9dcfa6e9ab3ac4c4e9cce8dad745caac7b02a559a4c",
        "https://base-sepolia-rpc.publicnode.com",
      ],
      contractEnvKey: "VITE_BASE_SEPOLIA_CONTRACT_ADDRESS",
      tokens: {
        "0x0d2660e14e231f9375e1139f654ebf9d53dc4c29": "USDT",
        "0xfc9bdac7c265e2badf2eef7f226fee5cb8b2c34a": "USDC",
      },
      precision: 6,
    },
  };
}

// Minimal ABI for getAllUserStakes
const GET_ALL_USER_STAKES_ABI = [
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
    ],
    name: "getAllUserStakes",
    outputs: [
      {
        components: [
          { name: "stakedAmount", type: "uint256" },
          { name: "originalStakedAmount", type: "uint256" },
          { name: "stakedAt", type: "uint256" },
          { name: "stakeEnd", type: "uint256" },
          { name: "rewards", type: "uint256" },
          { name: "originalRewards", type: "uint256" },
          { name: "unlockedAt", type: "uint256" },
          { name: "APR", type: "uint256" },
          { name: "adjustedAPR", type: "uint256" },
          { name: "claimed", type: "bool" },
          { name: "unstaked", type: "bool" },
          { name: "stakingType", type: "uint256" },
          { name: "txnHash", type: "bytes32" },
          { name: "claimedTxnHashes", type: "bytes32[]" },
          { name: "currentRewards", type: "uint256" },
          { name: "expectedTotalRewards", type: "uint256" },
          { name: "unstakeTxnHash", type: "bytes32" },
          { name: "claimedRewards", type: "uint256" },
          { name: "version", type: "uint256" },
          { name: "isPromo", type: "bool" },
          { name: "promoId", type: "uint256" },
          { name: "addFundAllowed", type: "bool" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Fetches the total active staked amount (USD, using precision) for an invitee
 * across all configured tokens on a given network.
 * Returns 0 if the network is not configured or RPC calls fail.
 */
export async function fetchInviteeActiveStakedUSD(
  inviteeWallet: string,
  networkName: string
): Promise<{ activeStakedUSD: number; firstStakeMs: number | null }> {
  const { createPublicClient, http } = await import("viem");
  const CHAIN_CONFIGS = await getChainConfigs();
  const cfg = CHAIN_CONFIGS[networkName];
  if (!cfg) return { activeStakedUSD: 0, firstStakeMs: null };

  const rpcUrls = (
    String(process.env[cfg.rpcEnvKey] || "")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .length > 0
      ? String(process.env[cfg.rpcEnvKey])
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
      : cfg.defaultRpcUrls
  );

  const contractAddress = String(
    process.env[cfg.contractEnvKey] || ""
  ).trim() as `0x${string}`;
  if (!contractAddress.startsWith("0x"))
    return { activeStakedUSD: 0, firstStakeMs: null };

  const client = createPublicClient({
    chain: cfg.chain,
    transport: http(rpcUrls[0]),
  });

  let totalStakedUSD = 0;
  let firstStakeMs: number | null = null;

  for (const tokenAddr of Object.keys(cfg.tokens)) {
    try {
      const stakes = (await client.readContract({
        address: contractAddress,
        abi: GET_ALL_USER_STAKES_ABI,
        functionName: "getAllUserStakes",
        args: [inviteeWallet as `0x${string}`, tokenAddr as `0x${string}`],
      } as any)) as any[];

      for (const s of stakes) {
        if (s.unstaked) continue;
        const raw = BigInt(s.stakedAmount ?? 0n);
        const human =
          Number(raw) / Math.pow(10, cfg.precision);
        totalStakedUSD += human;

        const stakeAtMs = Number(s.stakedAt) * 1000;
        if (firstStakeMs === null || stakeAtMs < firstStakeMs) {
          firstStakeMs = stakeAtMs;
        }
      }
    } catch {
      // RPC failure for this token — continue with others
    }
  }

  return { activeStakedUSD: totalStakedUSD, firstStakeMs };
}

export async function resolveClaimTokenForNetwork(
  networkName: string,
  tokenAddress?: string | null,
): Promise<{
  network: string;
  tokenAddress: string;
  tokenSymbol: string;
  currency?: "USDT" | "USDC";
} | null> {
  const CHAIN_CONFIGS = await getChainConfigs();
  const cfg = CHAIN_CONFIGS[networkName];
  if (!cfg) return null;

  const entries = Object.entries(cfg.tokens).map(([address, symbol]) => ({
    tokenAddress: address.toLowerCase(),
    tokenSymbol: symbol,
  }));
  if (entries.length === 0) return null;

  const normalizedToken = String(tokenAddress || "").trim().toLowerCase();
  const selected =
    (normalizedToken
      ? entries.find((entry) => entry.tokenAddress === normalizedToken)
      : null) ??
    entries.find((entry) => entry.tokenSymbol === "USDT") ??
    entries[0];

  if (!selected) return null;

  const currency =
    selected.tokenSymbol === "USDT" || selected.tokenSymbol === "USDC"
      ? (selected.tokenSymbol as "USDT" | "USDC")
      : undefined;

  return {
    network: networkName,
    tokenAddress: selected.tokenAddress,
    tokenSymbol: selected.tokenSymbol,
    currency,
  };
}

// ── Snapshot-based reward calculation ────────────────────────────────────────

export interface SnapshotRewardResult {
  inviteeWallet: string;
  snapshots: {
    monthIndex: number;
    activeStakedUSD: number;
    rewardForMonthUSD: number;
    periodEndMs: number;
  }[];
  totalEarnedUSD: number;
}

/**
 * Calculates per-invitee rewards from EXISTING Firestore snapshots only.
 * Does NOT take new snapshots (use writeInviteeSnapshots for that).
 * This pure-read version is safe to call in any context.
 */
export async function calcInviteeRewardFromSnapshots(
  db: any,
  inviteeWallet: string
): Promise<SnapshotRewardResult> {
  const snap = await db
    .collection("referralMonthlySnapshots")
    .where("inviteeWallet", "==", inviteeWallet.toLowerCase())
    .get();

  const snapshots: SnapshotRewardResult["snapshots"] = [];
  let totalEarnedUSD = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    // Only count snapshots whose period has fully elapsed
    if (data.periodEndMs <= Date.now()) {
      snapshots.push({
        monthIndex: data.monthIndex,
        activeStakedUSD: data.activeStakedUSD,
        rewardForMonthUSD: data.rewardForMonthUSD,
        periodEndMs: data.periodEndMs,
      });
      totalEarnedUSD += data.rewardForMonthUSD;
    }
  }

  return { inviteeWallet, snapshots, totalEarnedUSD };
}

/**
 * Ensures that a snapshot document exists for every completed 30-day period
 * for the given invitee. If a period has elapsed and no snapshot exists, one
 * is created using current live stake data (late capture — best effort).
 *
 * Epoch-aware document IDs:
 *   docId = "{inviteeWallet}_{epochStartMs}_{monthIndex}"
 *
 * If the invitee has previously had snapshots, the active epoch's clockStart
 * is recovered from the most recent snapshot's epochStartMs field. This
 * prevents month-index collisions when an invitee fully unstakes and re-stakes
 * (each re-stake gets a new epochStartMs and therefore new docIds).
 *
 * Returns the total earned USD across all finalized snapshots.
 */
export async function writeInviteeSnapshotsIfMissing(
  db: any,
  binding: {
    inviteeWallet: string;
    inviterWallet: string;
    boundAt: number;
    network: string;
    beneficiaryWallet?: string | null;
  },
  captureMethod: "cron" | "claim-trigger" | "manual" = "claim-trigger"
): Promise<{ totalEarnedUSD: number; snapshotsWritten: number }> {
  const { activeStakedUSD, firstStakeMs } =
    await fetchInviteeActiveStakedUSD(binding.inviteeWallet, binding.network);

  // The "live" clock start for any current stake epoch
  const liveClockStart =
    firstStakeMs !== null
      ? Math.max(binding.boundAt, firstStakeMs)
      : binding.boundAt;

  const now = Date.now();

  // ── Recover existing epoch info to detect re-stake scenarios ──────────────
  // Load all existing snapshots sorted ascending so we can determine the
  // current active epoch without relying on live chain data alone.
  const existingSnap = await db
    .collection("referralMonthlySnapshots")
    .where("inviteeWallet", "==", binding.inviteeWallet.toLowerCase())
    .orderBy("capturedAt", "asc")
    .get();

  // Find the latest epoch's clockStart from stored snapshots
  let storedEpochStart: number | null = null;
  let storedEpochLastPeriodEndMs = 0;
  for (const d of existingSnap.docs) {
    const data = d.data();
    if (data.epochStartMs !== undefined) {
      if (storedEpochStart === null || data.epochStartMs > storedEpochStart) {
        storedEpochStart = data.epochStartMs;
      }
      if (data.periodEndMs > storedEpochLastPeriodEndMs) {
        storedEpochLastPeriodEndMs = data.periodEndMs;
      }
    }
  }

  // Determine which epoch is currently active:
  //  • If there are no existing snapshots, or if the live clockStart is beyond
  //    the last period of the stored epoch (invitee fully unstaked and re-staked),
  //    begin a new epoch using liveClockStart.
  //  • Otherwise, continue using the stored epoch's clockStart.
  let clockStart: number;
  if (
    storedEpochStart === null ||
    (firstStakeMs !== null && liveClockStart > storedEpochLastPeriodEndMs)
  ) {
    clockStart = liveClockStart;
  } else {
    clockStart = storedEpochStart;
  }

  const monthsElapsed = Math.floor((now - clockStart) / MONTH_MS);

  let totalEarnedUSD = 0;
  let snapshotsWritten = 0;

  for (let m = 1; m <= monthsElapsed; m++) {
    const periodStartMs = clockStart + (m - 1) * MONTH_MS;
    const periodEndMs = clockStart + m * MONTH_MS;
    // Epoch-scoped docId: wallet + epochStart timestamp + month index
    const docId = `${binding.inviteeWallet.toLowerCase()}_${clockStart}_${m}`;
    const docRef = db.collection("referralMonthlySnapshots").doc(docId);

    const existing = await docRef.get();
    if (existing.exists) {
      totalEarnedUSD += existing.data().rewardForMonthUSD;
      continue;
    }

    // No snapshot yet — write a late snapshot using live data
    // NOTE: if the invitee unstaked before this snapshot was taken, this
    // will capture 0. This is the best we can do without a cron.
    const rewardForMonthUSD = activeStakedUSD * 0.005;
    const snapshotDoc = {
      inviteeWallet: binding.inviteeWallet.toLowerCase(),
      inviterWallet: binding.inviterWallet.toLowerCase(),
      beneficiaryWallet: binding.beneficiaryWallet
        ? String(binding.beneficiaryWallet).toLowerCase()
        : undefined,
      epochStartMs: clockStart,
      monthIndex: m,
      periodStartMs,
      periodEndMs,
      capturedAt: now,
      activeStakedUSD,
      rewardForMonthUSD,
      captureMethod,
    };
    await docRef.set(snapshotDoc);
    totalEarnedUSD += rewardForMonthUSD;
    snapshotsWritten++;
  }

  return { totalEarnedUSD, snapshotsWritten };
}

/**
 * Full inviter reward calculation:
 *  1. Get all invitees for this inviter (from Firestore `referrals` collection)
 *  2. Ensure snapshots are up-to-date for each invitee (writes if missing)
 *  3. Sum total earned USD from all snapshots
 *  4. Subtract totalPaid from `referralPayoutHistory`
 *  5. Return claimable amount (capped at 0 minimum)
 */
export async function calcInviterClaimable(
  db: any,
  inviterWallet: string,
  captureMethod: "cron" | "claim-trigger" | "manual" = "claim-trigger"
): Promise<{
  claimableAmountUSD: number;
  totalEarnedUSD: number;
  totalPaidUSD: number;
  breakdown: {
    inviteeWallet: string;
    earnedUSD: number;
    snapshotsWritten: number;
  }[];
}> {
  const normalized = inviterWallet.toLowerCase();

  // 1. Get all invitees
  const inviteesSnap = await db
    .collection("referrals")
    .where("inviterWallet", "==", normalized)
    .get();

  const breakdown: { inviteeWallet: string; earnedUSD: number; snapshotsWritten: number }[] = [];
  let totalEarnedUSD = 0;

  // 2. Ensure snapshots are current
  for (const doc of inviteesSnap.docs) {
    const binding = doc.data();
    const { totalEarnedUSD: earned, snapshotsWritten } =
      await writeInviteeSnapshotsIfMissing(db, binding, captureMethod);
    totalEarnedUSD += earned;
    breakdown.push({
      inviteeWallet: binding.inviteeWallet,
      earnedUSD: earned,
      snapshotsWritten,
    });
  }

  // 3. Get total paid from confirmed payouts
  const payoutsSnap = await db
    .collection("referralPayoutHistory")
    .where("inviterWallet", "==", normalized)
    .get();
  const totalPaidUSD = payoutsSnap.docs.reduce(
    (sum: number, d: any) => sum + (d.data().amountUSD || 0),
    0
  );

  const claimableAmountUSD = Math.max(0, totalEarnedUSD - totalPaidUSD);
  return { claimableAmountUSD, totalEarnedUSD, totalPaidUSD, breakdown };
}

export async function calcInviterClaimableByBucket(
  db: any,
  inviterWallet: string,
  captureMethod: "cron" | "claim-trigger" | "manual" = "claim-trigger",
): Promise<{
  claimableAmountUSD: number;
  totalEarnedUSD: number;
  totalPaidUSD: number;
  buckets: {
    key: string;
    network: string;
    tokenAddress: string;
    tokenSymbol: string;
    currency?: "USDT" | "USDC";
    totalEarnedUSD: number;
    totalRequestedUSD: number;
    pendingRequestedUSD: number;
    approvedRequestedUSD: number;
    totalPaidUSD: number;
    claimableAmountUSD: number;
  }[];
  breakdown: {
    inviteeWallet: string;
    earnedUSD: number;
    snapshotsWritten: number;
    network: string;
    tokenAddress: string;
    tokenSymbol: string;
  }[];
}> {
  const normalized = inviterWallet.toLowerCase();
  const inviteesSnap = await db
    .collection("referrals")
    .where("inviterWallet", "==", normalized)
    .get();

  const bucketMap = new Map<string, {
    key: string;
    network: string;
    tokenAddress: string;
    tokenSymbol: string;
    currency?: "USDT" | "USDC";
    totalEarnedUSD: number;
    totalRequestedUSD: number;
    pendingRequestedUSD: number;
    approvedRequestedUSD: number;
    totalPaidUSD: number;
    claimableAmountUSD: number;
  }>();

  const breakdown: {
    inviteeWallet: string;
    earnedUSD: number;
    snapshotsWritten: number;
    network: string;
    tokenAddress: string;
    tokenSymbol: string;
  }[] = [];

  let totalEarnedUSD = 0;

  for (const doc of inviteesSnap.docs) {
    const binding = doc.data();
    const resolvedToken = await resolveClaimTokenForNetwork(binding.network);
    if (!resolvedToken) continue;

    const { totalEarnedUSD: earned, snapshotsWritten } =
      await writeInviteeSnapshotsIfMissing(db, binding, captureMethod);

    totalEarnedUSD += earned;
    const key = `${resolvedToken.network}::${resolvedToken.tokenAddress}`;
    const bucket =
      bucketMap.get(key) ??
      {
        key,
        network: resolvedToken.network,
        tokenAddress: resolvedToken.tokenAddress,
        tokenSymbol: resolvedToken.tokenSymbol,
        currency: resolvedToken.currency,
        totalEarnedUSD: 0,
        totalRequestedUSD: 0,
        pendingRequestedUSD: 0,
        approvedRequestedUSD: 0,
        totalPaidUSD: 0,
        claimableAmountUSD: 0,
      };
    bucket.totalEarnedUSD += earned;
    bucketMap.set(key, bucket);

    breakdown.push({
      inviteeWallet: binding.inviteeWallet,
      earnedUSD: earned,
      snapshotsWritten,
      network: resolvedToken.network,
      tokenAddress: resolvedToken.tokenAddress,
      tokenSymbol: resolvedToken.tokenSymbol,
    });
  }

  const claimRequestsSnap = await db
    .collection("referralClaimRequests")
    .where("inviterWallet", "==", normalized)
    .get();
  for (const doc of claimRequestsSnap.docs) {
    const claim = doc.data();
    const resolvedToken = await resolveClaimTokenForNetwork(
      String(claim.network || claim.receivingNetwork || ""),
      claim.tokenAddress,
    );
    if (!resolvedToken) continue;
    const key = `${resolvedToken.network}::${resolvedToken.tokenAddress}`;
    const bucket =
      bucketMap.get(key) ??
      {
        key,
        network: resolvedToken.network,
        tokenAddress: resolvedToken.tokenAddress,
        tokenSymbol: resolvedToken.tokenSymbol,
        currency: resolvedToken.currency,
        totalEarnedUSD: 0,
        totalRequestedUSD: 0,
        pendingRequestedUSD: 0,
        approvedRequestedUSD: 0,
        totalPaidUSD: 0,
        claimableAmountUSD: 0,
      };
    const amount = Number(claim.requestedAmountUSD || 0);
    bucket.totalRequestedUSD += amount;
    if (claim.status === "pending") bucket.pendingRequestedUSD += amount;
    if (claim.status === "approved") bucket.approvedRequestedUSD += amount;
    bucketMap.set(key, bucket);
  }

  const payoutsSnap = await db
    .collection("referralPayoutHistory")
    .where("inviterWallet", "==", normalized)
    .get();
  let totalPaidUSD = 0;
  for (const doc of payoutsSnap.docs) {
    const payout = doc.data();
    const resolvedToken = await resolveClaimTokenForNetwork(
      String(payout.network || payout.receivingNetwork || ""),
      payout.tokenAddress,
    );
    const amount = Number(payout.amountUSD || 0);
    totalPaidUSD += amount;
    if (!resolvedToken) continue;
    const key = `${resolvedToken.network}::${resolvedToken.tokenAddress}`;
    const bucket =
      bucketMap.get(key) ??
      {
        key,
        network: resolvedToken.network,
        tokenAddress: resolvedToken.tokenAddress,
        tokenSymbol: resolvedToken.tokenSymbol,
        currency: resolvedToken.currency,
        totalEarnedUSD: 0,
        totalRequestedUSD: 0,
        pendingRequestedUSD: 0,
        approvedRequestedUSD: 0,
        totalPaidUSD: 0,
        claimableAmountUSD: 0,
      };
    bucket.totalPaidUSD += amount;
    bucketMap.set(key, bucket);
  }

  const buckets = Array.from(bucketMap.values()).map((bucket) => {
    const reservedUSD = bucket.pendingRequestedUSD + bucket.approvedRequestedUSD;
    return {
      ...bucket,
      claimableAmountUSD: Math.max(
        0,
        bucket.totalEarnedUSD - bucket.totalPaidUSD - reservedUSD,
      ),
    };
  });

  const claimableAmountUSD = buckets.reduce(
    (sum, bucket) => sum + bucket.claimableAmountUSD,
    0,
  );

  return {
    claimableAmountUSD,
    totalEarnedUSD,
    totalPaidUSD,
    buckets,
    breakdown,
  };
}

// ── Input validation helpers ─────────────────────────────────────────────────
export const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidWallet(value: string): boolean {
  return WALLET_REGEX.test(String(value || "").trim());
}
