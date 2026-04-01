import { createHmac, timingSafeEqual } from "crypto";
import type { ReferralCodeOwnerResponse } from "@shared/referral";
import {
  enforceRateLimit,
  getReferralCodeValidationError,
  logReferralError,
  normalizeReferralCode,
  setPrivateApiHeaders,
} from "./_lib";

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const CODE_REGEX = /^[A-Z0-9]{4,12}$/;

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

function verifySignedTokenPayload(token: string): Record<string, any> | null {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) return null;
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return null;
  const expected = base64UrlEncode(
    createHmac("sha256", secret).update(payloadEncoded).digest()
  );
  let match = false;
  try {
    match = timingSafeEqual(Buffer.from(expected), Buffer.from(signatureEncoded));
  } catch {
    match = false;
  }
  if (!match) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function verifySetupSignature(
  walletAddress: string,
  signature: string,
  challengeToken: string
): Promise<void> {
  const payload = verifySignedTokenPayload(challengeToken);
  if (!payload) throw new Error("Challenge token is invalid or expired.");
  if (payload.purpose !== "setup") throw new Error("Token purpose mismatch.");
  const normalized = walletAddress.toLowerCase();
  if (payload.walletAddress !== normalized) throw new Error("Challenge token wallet mismatch.");
  const message =
    `WStaking Referral Code Setup\n\n` +
    `Wallet: ${normalized}\n` +
    `Nonce: ${payload.nonce}\n` +
    `Issued At: ${payload.issuedAt}\n\n` +
    `Sign to confirm you own this wallet and authorize this referral code setup.`;
  const { verifyMessage } = await import("viem");
  const isValid = await verifyMessage({
    address: normalized as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
  if (!isValid) throw new Error("Signature verification failed.");
}

async function getDb() {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (getApps().length === 0) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
    initializeApp({ credential: cert(JSON.parse(json)) });
  }
  return getFirestore();
}

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "PUT") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!enforceRateLimit(req, res, "set-custom-code", 10, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const { walletAddress, code, signature, challengeToken } = req.body || {};
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ ok: false, error: "Ownership signature is required." });
  }
  if (!challengeToken || typeof challengeToken !== "string") {
    return res.status(400).json({ ok: false, error: "Challenge token is required." });
  }
  if (!WALLET_REGEX.test(walletAddress)) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }
  try {
    await verifySetupSignature(walletAddress, signature, challengeToken);
  } catch {
    return res.status(401).json({ ok: false, error: "Signature verification failed." });
  }

  const normalizedCode = normalizeReferralCode(code || "");
  const validationError = getReferralCodeValidationError(normalizedCode);
  if (validationError || !CODE_REGEX.test(normalizedCode)) {
    return res.status(400).json({
      ok: false,
      error: validationError || "Code must be 4-12 characters using letters A-Z and digits 0-9 only.",
    });
  }

  try {
    const db = await getDb();
    const wallet = walletAddress.toLowerCase();
    const existingSnap = await db
      .collection("referralCodes")
      .where("inviterWallet", "==", wallet)
      .limit(1)
      .get();
    const oldCode: string | null = existingSnap.empty ? null : existingSnap.docs[0].id;
    const existingData = existingSnap.empty ? null : existingSnap.docs[0].data();
    if (oldCode === normalizedCode) {
      const response: ReferralCodeOwnerResponse = {
        ok: true,
        code: existingData!.code,
        inviterWallet: existingData!.inviterWallet,
        createdAt: existingData!.createdAt,
        isActive: existingData!.isActive,
      };
      return res.status(200).json(response);
    }
    const takenSnap = await db.collection("referralCodes").doc(normalizedCode).get();
    if (takenSnap.exists) {
      return res.status(409).json({ ok: false, error: "That code is already taken. Please choose a different one." });
    }
    const data = {
      code: normalizedCode,
      inviterWallet: wallet,
      createdAt: existingData?.createdAt ?? Date.now(),
      isActive: existingData?.isActive ?? true,
      isKOL: existingData?.isKOL ?? false,
      allocationMode: existingData?.allocationMode ?? "owner_master_80_20",
      contractEnd: existingData?.contractEnd ?? null,
      masterWallet: existingData?.masterWallet ?? (
        String(process.env.REFERRAL_DEFAULT_MASTER_WALLET || "").trim().toLowerCase() || null
      ),
      ownershipSignature: signature,
      ownershipVerifiedAt: Date.now(),
    };
    if (oldCode) {
      await db.collection("referralCodes").doc(oldCode).delete();
    }
    await db.collection("referralCodes").doc(normalizedCode).set(data);
    const response: ReferralCodeOwnerResponse & { replaced?: string } = {
      ok: true,
      code: data.code,
      inviterWallet: data.inviterWallet,
      createdAt: data.createdAt,
      isActive: data.isActive,
      ...(oldCode ? { replaced: oldCode } : {}),
    };
    return res.status(200).json(response);
  } catch (error) {
    logReferralError("set-custom-code", error, { walletAddress });
    return res.status(500).json({ ok: false, error: "Failed to set referral code." });
  }
}
