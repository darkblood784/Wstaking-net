export interface ChallengeRecord {
  id: string;
  nonce: string;
  walletAddress: string;
  chainId: number;
  message: string;
  expiresAt: number;
  used: boolean;
}

export interface SessionRecord {
  id: string;
  walletAddress: string;
  chainId: number;
  createdAt: number;
  expiresAt: number;
}

const challenges = new Map<string, ChallengeRecord>();
const sessions = new Map<string, SessionRecord>();
const failedVerifyAlertCooldown = new Map<string, number>();

const CHALLENGE_TTL_SECONDS = Number(process.env.ADMIN_CHALLENGE_TTL_SECONDS || 300);
const SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 1800);
const FAILED_ALERT_COOLDOWN_SECONDS = Number(process.env.ADMIN_VERIFY_FAIL_ALERT_COOLDOWN_SECONDS || 60);
const COOKIE_NAME = "wstaking_admin_session";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function randomHex(bytes = 16): string {
  const size = bytes > 0 ? bytes : 16;
  const cryptoApi = (globalThis as any)?.crypto;
  if (cryptoApi?.getRandomValues) {
    const arr = new Uint8Array(size);
    cryptoApi.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let value = "";
  for (let i = 0; i < size; i++) {
    value += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0");
  }
  return value;
}

function cleanupStores(): void {
  const now = nowSeconds();
  for (const [key, value] of challenges.entries()) {
    if (value.expiresAt <= now || value.used) {
      challenges.delete(key);
    }
  }
  for (const [key, value] of sessions.entries()) {
    if (value.expiresAt <= now) {
      sessions.delete(key);
    }
  }
  for (const [key, ts] of failedVerifyAlertCooldown.entries()) {
    if (now - ts > FAILED_ALERT_COOLDOWN_SECONDS) {
      failedVerifyAlertCooldown.delete(key);
    }
  }
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS > 0 ? SESSION_TTL_SECONDS : 1800;
}

export function createChallenge(walletAddress: string, chainId: number, origin: string) {
  cleanupStores();
  const id = randomHex(16);
  const nonce = randomHex(16);
  const issuedAt = new Date().toISOString();
  const message = [
    "WStaking Admin Authentication",
    "",
    `Wallet: ${walletAddress}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Origin: ${origin}`,
    "",
    "Sign this message to prove wallet ownership for admin access.",
  ].join("\n");
  const ttlSeconds = CHALLENGE_TTL_SECONDS > 0 ? CHALLENGE_TTL_SECONDS : 300;
  const expiresAt = nowSeconds() + ttlSeconds;

  const record: ChallengeRecord = {
    id,
    nonce,
    walletAddress: walletAddress.toLowerCase(),
    chainId,
    message,
    expiresAt,
    used: false,
  };
  challenges.set(id, record);
  return { challengeToken: id, message };
}

export function verifyAndConsumeChallenge(
  challengeToken: string,
  walletAddress: string,
  chainId: number,
  message: string
): { ok: boolean; reason?: string } {
  cleanupStores();
  const challengeId = String(challengeToken || "").trim();
  if (!challengeId) return { ok: false, reason: "Challenge token invalid" };
  const record = challenges.get(challengeId);
  if (!record) {
    return { ok: false, reason: "Challenge not found or expired" };
  }
  if (record.used) {
    return { ok: false, reason: "Challenge already used" };
  }
  if (record.expiresAt < nowSeconds()) {
    challenges.delete(challengeId);
    return { ok: false, reason: "Challenge expired" };
  }
  if (record.walletAddress !== walletAddress.toLowerCase()) {
    return { ok: false, reason: "Challenge wallet mismatch" };
  }
  if (record.chainId !== chainId) {
    return { ok: false, reason: "Challenge chain mismatch" };
  }
  if (record.message !== message) {
    return { ok: false, reason: "Challenge message mismatch" };
  }

  record.used = true;
  challenges.set(challengeId, record);
  return { ok: true };
}

export function createSession(walletAddress: string, chainId: number): { sessionToken: string; sessionId: string } {
  cleanupStores();
  const sessionId = randomHex(32);
  const ttl = getSessionTtlSeconds();
  const expiresAt = nowSeconds() + ttl;
  sessions.set(sessionId, {
    id: sessionId,
    walletAddress: walletAddress.toLowerCase(),
    chainId,
    createdAt: nowSeconds(),
    expiresAt,
  });

  return { sessionToken: sessionId, sessionId };
}

export function verifySessionToken(sessionToken: string): { ok: boolean; reason?: string; payload?: any } {
  cleanupStores();
  const sessionId = String(sessionToken || "").trim();
  if (!sessionId) return { ok: false, reason: "Session token invalid" };
  const record = sessions.get(sessionId);
  if (!record) return { ok: false, reason: "Session not found" };
  if (record.expiresAt < nowSeconds()) {
    sessions.delete(sessionId);
    return { ok: false, reason: "Session expired" };
  }
  return {
    ok: true,
    payload: {
      walletAddress: record.walletAddress,
      chainId: record.chainId,
      exp: record.expiresAt,
      sessionId: record.id,
    },
  };
}

export function invalidateSessionFromToken(sessionToken: string): void {
  const sessionId = String(sessionToken || "").trim();
  if (sessionId) sessions.delete(sessionId);
}

export function readSessionCookie(req: any): string | null {
  const cookieHeader = String(req.headers?.cookie || "");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    const [name, ...rest] = part.split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return null;
}

export function setSessionCookie(res: any, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${getSessionTtlSeconds()}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res: any): void {
  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getClientIp(req: any): string {
  const rawForwardedFor = req.headers?.["x-forwarded-for"];
  if (rawForwardedFor) {
    const [firstIp] = String(rawForwardedFor).split(",");
    return firstIp?.trim() || "unknown";
  }
  return String(req.socket?.remoteAddress || req.ip || "unknown");
}

function getDeviceMeta(req: any) {
  const userAgent = String(req.headers?.["user-agent"] || "unknown");
  const country = String(req.headers?.["x-vercel-ip-country"] || "unknown");
  const region = String(req.headers?.["x-vercel-ip-country-region"] || "unknown");
  const city = String(req.headers?.["x-vercel-ip-city"] || "unknown");
  const timezone = String(req.headers?.["x-vercel-ip-timezone"] || "unknown");
  return { userAgent, country, region, city, timezone };
}

function getTelegramChatIds(): string[] {
  const envList = String(process.env.TELEGRAM_CHAT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const list = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID_2, ...envList]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

export async function sendSecurityAlert(
  req: any,
  event: "verify_success" | "verify_failed" | "logout",
  walletAddress: string,
  details: string,
  options?: { rateLimitKey?: string }
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();
  if (!botToken || !chatIds.length) return;

  if (event === "verify_failed") {
    const key = options?.rateLimitKey || `${walletAddress.toLowerCase()}::${getClientIp(req)}`;
    const now = nowSeconds();
    const last = failedVerifyAlertCooldown.get(key);
    if (last && now - last < FAILED_ALERT_COOLDOWN_SECONDS) {
      return;
    }
    failedVerifyAlertCooldown.set(key, now);
  }

  const ip = getClientIp(req);
  const { userAgent, country, region, city, timezone } = getDeviceMeta(req);
  const env = process.env.VITE_EXECUTION_ENV || process.env.NODE_ENV || "unknown";
  const timestamp = new Date().toISOString();
  const title =
    event === "verify_success"
      ? "Admin Session Created"
      : event === "logout"
      ? "Admin Session Logout"
      : "Admin Verify Failed";

  const text = [
    `<b>${title}</b>`,
    `Wallet: <code>${escapeHtml(walletAddress)}</code>`,
    `Details: <code>${escapeHtml(details)}</code>`,
    `IP: <code>${escapeHtml(ip)}</code>`,
    `Place: <code>${escapeHtml(city)}, ${escapeHtml(region)}, ${escapeHtml(country)}</code>`,
    `Timezone: <code>${escapeHtml(timezone)}</code>`,
    `Env: <code>${escapeHtml(env)}</code>`,
    `Time: <code>${escapeHtml(timestamp)}</code>`,
    `UA: <code>${escapeHtml(userAgent)}</code>`,
  ].join("\n");

  try {
    await Promise.allSettled(
      chatIds.map((chatId) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        })
      )
    );
  } catch (error) {
    console.error("Failed to send admin security alert:", error);
  }
}
