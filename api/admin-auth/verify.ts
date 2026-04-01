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

function isWalletAddress(value: string): boolean {
  return WALLET_REGEX.test(value);
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

function verifySignedToken(token: string): any | null {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) return null;
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return null;

  const expectedSignature = base64UrlEncode(createHmac("sha256", secret).update(payloadEncoded).digest());
  if (expectedSignature !== signatureEncoded) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSignedToken(payload: Record<string, any>, ttlSeconds: number): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) throw new Error("Missing ADMIN_AUTH_SECRET");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payloadEncoded = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const signatureEncoded = base64UrlEncode(createHmac("sha256", secret).update(payloadEncoded).digest());
  return `${payloadEncoded}.${signatureEncoded}`;
}

function setSessionCookie(res: any, token: string): void {
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

function buildChallengeMessage(payload: {
  walletAddress: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  origin: string;
}): string {
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

async function verifyWalletSignature(walletAddress: string, message: string, signature: string): Promise<boolean> {
  try {
    const { verifyMessage } = await import("viem");
    return await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch (error) {
    console.error("verifyWalletSignature failed:", error);
    return false;
  }
}

async function isAuthorizedWallet(walletAddress: string, chainId: number): Promise<boolean> {
  const normalizedWallet = walletAddress.toLowerCase();
  const allowlist = String(process.env.ADMIN_AUTH_OWNER_ALLOWLIST || "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.includes(normalizedWallet)) return true;

  const rpcUrls = getRpcUrls(chainId);
  const contractAddress = getContractAddress(chainId);
  if (!rpcUrls.length || !contractAddress) return false;

  try {
    const { createPublicClient, http } = await import("viem");
    const uniqueRpcUrls = Array.from(new Set(rpcUrls));

    for (const rpcUrl of uniqueRpcUrls) {
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      try {
        const isAdmin = (await (client as any).readContract({
          address: contractAddress as `0x${string}`,
          abi: ADMIN_READ_ABI,
          functionName: "admins",
          args: [walletAddress as `0x${string}`],
        } as any)) as boolean;
        if (isAdmin) return true;
      } catch {
        // try owner/super-admin fallbacks
      }

      const ownerFunctions: Array<"owner" | "getSuperAdmin" | "superAdmin"> = [
        "owner",
        "getSuperAdmin",
        "superAdmin",
      ];
      for (const functionName of ownerFunctions) {
        try {
          const ownerAddress = (await (client as any).readContract({
            address: contractAddress as `0x${string}`,
            abi: ADMIN_READ_ABI,
            functionName,
            args: [],
          } as any)) as `0x${string}`;
          if (String(ownerAddress || "").toLowerCase() === normalizedWallet) return true;
        } catch {
          // no-op
        }
      }
    }
  } catch (error) {
    console.error("isAuthorizedWallet failed:", error);
  }

  return false;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, authenticated: false, message: "Method not allowed" });
    }

    const { walletAddress, chainId, message, signature, challengeToken } = req.body || {};
    const normalizedWallet = String(walletAddress || "").trim();
    const parsedChainId = Number(chainId);
    const normalizedMessage = String(message || "");
    const normalizedSignature = String(signature || "").trim();
    const normalizedChallengeToken = String(challengeToken || "").trim();

    if (!isWalletAddress(normalizedWallet)) {
      return res.status(400).json({ ok: false, authenticated: false, message: "Invalid wallet address" });
    }
    if (!normalizedSignature || !normalizedChallengeToken || !Number.isFinite(parsedChainId)) {
      return res.status(400).json({ ok: false, authenticated: false, message: "Missing verification payload" });
    }

    const challengePayload = verifySignedToken(normalizedChallengeToken);
    if (!challengePayload) {
      return res.status(401).json({ ok: false, authenticated: false, message: "Challenge expired or invalid" });
    }

    if (
      String(challengePayload.walletAddress || "").toLowerCase() !== normalizedWallet.toLowerCase() ||
      Number(challengePayload.chainId) !== parsedChainId
    ) {
      return res.status(401).json({ ok: false, authenticated: false, message: "Challenge payload mismatch" });
    }

    const expectedMessage = buildChallengeMessage({
      walletAddress: challengePayload.walletAddress,
      chainId: challengePayload.chainId,
      nonce: challengePayload.nonce,
      issuedAt: challengePayload.issuedAt,
      origin: challengePayload.origin,
    });
    if (normalizedMessage !== expectedMessage) {
      return res.status(401).json({ ok: false, authenticated: false, message: "Challenge message mismatch" });
    }

    const isSignatureValid = await verifyWalletSignature(normalizedWallet, normalizedMessage, normalizedSignature);
    if (!isSignatureValid) {
      return res.status(401).json({ ok: false, authenticated: false, message: "Invalid wallet signature" });
    }

    const authorized = await isAuthorizedWallet(normalizedWallet, parsedChainId);
    if (!authorized) {
      return res.status(403).json({
        ok: false,
        authenticated: false,
        message: "Wallet is not authorized admin/owner on this chain",
      });
    }

    const sessionToken = createSignedToken(
      {
        walletAddress: normalizedWallet,
        chainId: parsedChainId,
      },
      6 * 60 * 60
    );
    setSessionCookie(res, sessionToken);
    return res.status(200).json({ ok: true, authenticated: true, message: "Admin session established" });
  } catch (error: any) {
    console.error("admin-auth/verify fatal error:", error);
    return res.status(500).json({
      ok: false,
      authenticated: false,
      message: `Verify handler failed: ${error?.message || "unknown error"}`,
    });
  }
}

