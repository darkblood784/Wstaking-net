import { createHmac, randomBytes } from "crypto";
import { enforceRateLimit, logReferralError, setPrivateApiHeaders } from "./_lib";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const SETUP_NONCE_TTL_SECONDS = 10 * 60;

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createSignedToken(payload: Record<string, any>, ttlSeconds: number): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) throw new Error("Missing ADMIN_AUTH_SECRET");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payloadEncoded = base64UrlEncode(JSON.stringify({ ...payload, exp }));
  const sig = base64UrlEncode(
    createHmac("sha256", secret).update(payloadEncoded).digest()
  );
  return `${payloadEncoded}.${sig}`;
}

export default function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "setup-nonce", 20, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const wallet = String(req.query.wallet || "").trim().toLowerCase();
  if (!WALLET_REGEX.test(wallet)) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }

  try {
    const nonce = base64UrlEncode(randomBytes(16));
    const issuedAt = new Date().toISOString();
    const challengeToken = createSignedToken(
      { walletAddress: wallet, nonce, issuedAt, purpose: "setup" },
      SETUP_NONCE_TTL_SECONDS
    );
    const message =
      `WStaking Referral Code Setup\n\n` +
      `Wallet: ${wallet}\n` +
      `Nonce: ${nonce}\n` +
      `Issued At: ${issuedAt}\n\n` +
      `Sign to confirm you own this wallet and authorize this referral code setup.`;

    return res.status(200).json({ ok: true, challengeToken, message });
  } catch (error) {
    logReferralError("setup-nonce", error);
    return res.status(500).json({ ok: false, error: "Internal server error." });
  }
}
