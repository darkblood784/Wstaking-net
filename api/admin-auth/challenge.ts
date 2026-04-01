import { createHmac, randomBytes } from "crypto";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

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

function createSignedToken(payload: Record<string, any>, ttlSeconds: number): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_AUTH_SECRET");
  }
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payloadEncoded = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const signatureEncoded = base64UrlEncode(createHmac("sha256", secret).update(payloadEncoded).digest());
  return `${payloadEncoded}.${signatureEncoded}`;
}

function getOrigin(req: any): string {
  const origin = String(req.headers?.origin || "").trim();
  if (origin) return origin;
  const host = String(req.headers?.host || "").trim();
  return host ? `https://${host}` : "unknown-origin";
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    const response = {
      ok: false,
      message: "Method not allowed",
    };
    return res.status(405).json(response);
  }

  try {
    if (!process.env.ADMIN_AUTH_SECRET) {
      return res.status(503).json({
        ok: false,
        message: "ADMIN_AUTH_SECRET is not configured",
      });
    }

    const { walletAddress, chainId } = req.body || {};
    const normalizedWallet = String(walletAddress || "").trim();
    const parsedChainId = Number(chainId);

    if (!isWalletAddress(normalizedWallet)) {
      const response = {
        ok: false,
        message: "Invalid wallet address",
      };
      return res.status(400).json(response);
    }

    if (!Number.isFinite(parsedChainId) || parsedChainId <= 0) {
      const response = {
        ok: false,
        message: "Invalid chain id",
      };
      return res.status(400).json(response);
    }

    const nonce = randomBytes(16).toString("hex");
    const issuedAt = new Date().toISOString();
    const origin = getOrigin(req);

    const challengePayload = {
      walletAddress: normalizedWallet,
      chainId: parsedChainId,
      nonce,
      issuedAt,
      origin,
    };
    const challengeToken = createSignedToken(challengePayload, 5 * 60);
    const message = buildChallengeMessage(challengePayload);

    const response = {
      ok: true,
      message,
      challengeToken,
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error("Failed to generate admin auth challenge:", error);
    const response = {
      ok: false,
      message: "Failed to generate challenge",
    };
    return res.status(500).json(response);
  }
}
