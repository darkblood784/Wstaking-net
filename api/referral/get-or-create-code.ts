import {
  enforceRateLimit,
  getReferralCodeValidationError,
  getDb,
  logReferralError,
  setPrivateApiHeaders,
  WALLET_REGEX,
} from "./_lib";
import type { ReferralCodeOwnerResponse } from "@shared/referral";

function generateReferralCode(walletAddress: string): string {
  const hex = walletAddress.toLowerCase().replace("0x", "");
  return (hex.slice(0, 4) + hex.slice(-4)).toUpperCase();
}

function generateReferralCodeCandidates(walletAddress: string): string[] {
  const wallet = walletAddress.toLowerCase().replace("0x", "");
  const candidates = [
    generateReferralCode(walletAddress),
    (wallet.slice(0, 6) + wallet.slice(-2)).toUpperCase(),
    (wallet.slice(2, 6) + wallet.slice(-4)).toUpperCase(),
    (wallet.slice(0, 4) + wallet.slice(8, 12)).toUpperCase(),
  ];
  return Array.from(new Set(candidates)).filter((candidate) => !getReferralCodeValidationError(candidate));
}

export default async function handler(req: any, res: any) {
  setPrivateApiHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "get-or-create-code", 12, 60_000)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const { walletAddress } = req.body || {};
  if (!WALLET_REGEX.test(walletAddress)) {
    return res.status(400).json({ ok: false, error: "Invalid wallet address." });
  }

  let db: any;
  try {
    db = await getDb();
  } catch (err: any) {
    return res.status(503).json({ ok: false, error: "Firebase unavailable." });
  }

  try {
    const wallet = walletAddress.toLowerCase();
    const existingSnap = await db
      .collection("referralCodes")
      .where("inviterWallet", "==", wallet)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const data = existingSnap.docs[0].data();
      const response: ReferralCodeOwnerResponse = {
        ok: true,
        code: data.code,
        inviterWallet: data.inviterWallet,
        createdAt: data.createdAt,
        isActive: data.isActive,
      };
      return res.status(200).json(response);
    }

    const candidates = generateReferralCodeCandidates(wallet);
    let code = "";
    for (const candidate of candidates) {
      const collisionSnap = await db.collection("referralCodes").doc(candidate).get();
      if (!collisionSnap.exists) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return res.status(409).json({
        ok: false,
        error: "Unable to generate an available referral code automatically. Please choose a custom code.",
      });
    }

    const data = {
      code,
      inviterWallet: wallet,
      createdAt: Date.now(),
      isActive: true,
      isKOL: false,
      allocationMode: "owner_master_80_20",
      contractEnd: null,
      masterWallet: String(process.env.REFERRAL_DEFAULT_MASTER_WALLET || "").trim().toLowerCase() || null,
    };

    await db.collection("referralCodes").doc(code).set(data);

    const response: ReferralCodeOwnerResponse = {
      ok: true,
      code: data.code,
      inviterWallet: data.inviterWallet,
      createdAt: data.createdAt,
      isActive: data.isActive,
    };
    return res.status(200).json(response);
  } catch (error) {
    logReferralError("get-or-create-code", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to get or create referral code.",
    });
  }
}
