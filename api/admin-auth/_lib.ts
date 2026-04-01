import { createHmac } from "crypto";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SESSION_COOKIE_NAME = "wstaking_admin_session";
const ADMIN_READ_ABI = [
  {
    type: "function",
    name: "admins",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getSuperAdmin",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "superAdmin",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

interface SignedTokenPayload {
  [key: string]: any;
  exp: number;
}

export interface ChallengePayload extends SignedTokenPayload {
  walletAddress: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  origin: string;
}

export interface SessionPayload extends SignedTokenPayload {
  walletAddress: string;
  chainId: number;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function getSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) throw new Error("Missing ADMIN_AUTH_SECRET");
  return secret;
}

function signPayload(payload: SignedTokenPayload): string {
  const secret = getSecret();
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(payloadEncoded).digest();
  const signatureEncoded = base64UrlEncode(signature);
  return `${payloadEncoded}.${signatureEncoded}`;
}

export function createSignedToken(payload: Record<string, any>, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return signPayload({ ...payload, exp });
}

export function verifySignedToken<T extends SignedTokenPayload>(token: string): T | null {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) return null;
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return null;

  const expectedSignature = base64UrlEncode(createHmac("sha256", secret).update(payloadEncoded).digest());
  if (expectedSignature !== signatureEncoded) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8")) as T;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isWalletAddress(value: string): boolean {
  return WALLET_REGEX.test(value);
}

export function getOrigin(req: any): string {
  const origin = String(req.headers?.origin || "").trim();
  if (origin) return origin;
  const host = String(req.headers?.host || "").trim();
  return host ? `https://${host}` : "unknown-origin";
}

export function buildChallengeMessage(payload: Omit<ChallengePayload, "exp">): string {
  return [
    "WStaking Admin Authentication",
    "",
    `Wallet: ${payload.walletAddress}`,
    `Chain ID: ${payload.chainId}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${payload.issuedAt}`,
    `Origin: ${payload.origin}`,
    "",
    "Sign this message to prove wallet ownership for admin access.",
  ].join("\n");
}

export async function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const { verifyMessage } = await import("viem");
    return await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

function getRpcUrls(chainId: number): string[] {
  const fromEnv = (value: string | undefined): string[] =>
    String(value || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

  switch (chainId) {
    case 97:
      return fromEnv(process.env.ADMIN_AUTH_RPC_97).concat(["https://bsc-testnet-rpc.publicnode.com"]);
    case 56:
      return fromEnv(process.env.ADMIN_AUTH_RPC_56).concat([
        "https://bsc-dataseed.binance.org",
        "https://rpc.ankr.com/bsc",
      ]);
    case 196:
      return fromEnv(process.env.ADMIN_AUTH_RPC_196).concat([
        "https://rpc.xlayer.tech",
        "https://xlayerrpc.okx.com",
        "https://rpc.ankr.com/xlayer",
      ]);
    case 84532:
      return fromEnv(process.env.ADMIN_AUTH_RPC_84532).concat(["https://rpc.ankr.com/base_sepolia"]);
    case 8453:
      return fromEnv(process.env.ADMIN_AUTH_RPC_8453).concat(["https://rpc.ankr.com/base"]);
    default:
      return [];
  }
}

function getContractAddress(chainId: number): string | null {
  switch (chainId) {
    case 97:
      return process.env.VITE_BSC_TESTNET_CONTRACT_ADDRESS || null;
    case 56:
      return process.env.VITE_BSC_CONTRACT_ADDRESS || null;
    case 196:
      return process.env.VITE_XLAYER_CONTRACT_ADDRESS || null;
    case 84532:
      return process.env.VITE_BASE_SEPOLIA_CONTRACT_ADDRESS || null;
    case 8453:
      return process.env.VITE_BASE_CONTRACT_ADDRESS || null;
    default:
      return null;
  }
}

export async function isOnChainAdmin(walletAddress: string, chainId: number): Promise<boolean> {
  const rpcUrls = getRpcUrls(chainId);
  const contractAddress = getContractAddress(chainId);
  if (!rpcUrls.length || !contractAddress) return false;

  const normalizedWallet = walletAddress.toLowerCase();
  const allowlist = String(process.env.ADMIN_AUTH_OWNER_ALLOWLIST || "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.includes(normalizedWallet)) return true;

  try {
    const { createPublicClient, http } = await import("viem");
    const uniqueRpcUrls = Array.from(new Set(rpcUrls));
    for (const rpcUrl of uniqueRpcUrls) {
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      // 1) Admin mapping check
      try {
        const isAdmin = (await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: ADMIN_READ_ABI,
          functionName: "admins",
          args: [walletAddress as `0x${string}`],
        })) as boolean;
        if (isAdmin) return true;
      } catch {
        // no-op
      }

      // 2) Owner / super-admin fallbacks
      const ownerFunctions: Array<"owner" | "getSuperAdmin" | "superAdmin"> = [
        "owner",
        "getSuperAdmin",
        "superAdmin",
      ];
      for (const functionName of ownerFunctions) {
        try {
          const ownerAddress = (await client.readContract({
            address: contractAddress as `0x${string}`,
            abi: ADMIN_READ_ABI,
            functionName,
            args: [],
          })) as `0x${string}`;
          if (String(ownerAddress || "").toLowerCase() === normalizedWallet) return true;
        } catch {
          // no-op
        }
      }
    }
  } catch (error) {
    console.error("isOnChainAdmin check failed:", error);
    return false;
  }

  return false;
}

export function setSessionCookie(res: any, token: string): void {
  const isSecure = process.env.NODE_ENV === "production";
  const cookie = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${6 * 60 * 60}`,
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res: any): void {
  const isSecure = process.env.NODE_ENV === "production";
  const cookie = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function readSessionCookie(req: any): string | null {
  const cookieHeader = String(req.headers?.cookie || "");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    const [name, ...rest] = part.split("=");
    if (name === SESSION_COOKIE_NAME) return rest.join("=");
  }
  return null;
}

