import { createHmac } from "crypto";

interface SessionPayload {
  walletAddress: string;
  chainId: number;
  exp: number;
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function readSessionCookie(req: any): string | null {
  const cookieHeader = String(req.headers?.cookie || "");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part: string) => part.trim());
  for (const part of parts) {
    const [name, ...rest] = part.split("=");
    if (name === "wstaking_admin_session") return rest.join("=");
  }
  return null;
}

function verifySignedToken(token: string): SessionPayload | null {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) return null;
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return null;

  const expectedSignature = base64UrlEncode(createHmac("sha256", secret).update(payloadEncoded).digest());
  if (expectedSignature !== signatureEncoded) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET") {
      const response = {
        ok: false,
        authenticated: false,
        message: "Method not allowed",
      };
      return res.status(405).json(response);
    }

    const token = readSessionCookie(req);
    if (!token) {
      const response = {
        ok: true,
        authenticated: false,
        message: "No session cookie",
      };
      return res.status(200).json(response);
    }

    const payload = verifySignedToken(token);
    if (!payload) {
      const response = {
        ok: true,
        authenticated: false,
        message: "Session is invalid or expired",
      };
      return res.status(200).json(response);
    }

    const response = {
      ok: true,
      authenticated: true,
      walletAddress: payload.walletAddress,
      chainId: payload.chainId,
      message: "Session is valid",
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error("admin-auth/session failed:", error);
    return res.status(500).json({
      ok: false,
      authenticated: false,
      message: "Session handler failed",
    });
  }
}
