const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

function isWalletAddress(value: string): boolean {
  return WALLET_REGEX.test(String(value || "").trim());
}

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getClientIp(
  rawForwardedFor: string | string[] | undefined,
  fallbackIp: string | undefined
): string {
  if (Array.isArray(rawForwardedFor) && rawForwardedFor.length > 0) {
    const first = String(rawForwardedFor[0] || "").trim();
    if (first) return first;
  }
  if (typeof rawForwardedFor === "string" && rawForwardedFor.trim()) {
    const [firstIp] = rawForwardedFor.split(",");
    return firstIp?.trim() || "unknown";
  }
  return fallbackIp || "unknown";
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

function getReportTimezone(): string {
  return String(process.env.WALLET_CONNECT_REPORT_TIMEZONE || "Asia/Taipei");
}

function getDateKey(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
}

function getCountryLabel(country: string): string {
  const code = String(country || "").trim().toUpperCase();
  if (!code) return "unknown";
  if (/^[A-Z]{2}$/.test(code)) {
    try {
      const display = new Intl.DisplayNames(["en"], { type: "region" });
      return display.of(code) || code;
    } catch {
      return code;
    }
  }
  return country;
}

function getDataDir(): string {
  if (process.env.WALLET_CONNECT_LOG_DIR) return process.env.WALLET_CONNECT_LOG_DIR;
  if (process.env.VERCEL) return "/tmp/wstaking-logs";
  return `${process.cwd()}/.data`;
}

function getKvConfig(): { url: string; token: string } | null {
  const url = String(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = String(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!url || !token) return null;
  return { url, token };
}

function getDayTtlSeconds(): number {
  const raw = Number.parseInt(String(process.env.WALLET_CONNECT_DAY_TTL_SECONDS || "").trim(), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 1209600; // 14 days default
}

function getRecentRetentionMs(): number {
  const raw = Number.parseInt(String(process.env.WALLET_CONNECT_RECENT_RETENTION_MS || "").trim(), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 172800000; // 48h default
}

async function kvExec(args: any[]): Promise<any> {
  const kv = getKvConfig();
  if (!kv) return null;
  const response = await fetch(kv.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kv.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  return data?.result ?? null;
}

async function persistWalletConnectRecord(record: Record<string, any>): Promise<boolean> {
  const json = JSON.stringify(record);
  const ts = Number.isFinite(Date.parse(String(record.connectedAt || "")))
    ? Date.parse(String(record.connectedAt))
    : Date.now();
  const dayTtlSeconds = getDayTtlSeconds();
  const recentRetentionMs = getRecentRetentionMs();

  try {
    const kv = getKvConfig();
    if (kv) {
      await kvExec(["RPUSH", `wstaking:wallet:day:${record.dayKey}`, json]);
      await kvExec(["EXPIRE", `wstaking:wallet:day:${record.dayKey}`, String(dayTtlSeconds)]);
      await kvExec(["ZADD", "wstaking:wallet:recent", String(ts), json]);
      await kvExec(["ZREMRANGEBYSCORE", "wstaking:wallet:recent", "-inf", String(ts - recentRetentionMs)]);
      return true;
    }
  } catch (error) {
    console.error("wallet-connect KV persist failed, fallback to file:", error);
  }

  try {
    const path = await import("path");
    const fs = await import("fs/promises");
    const dataDir = getDataDir();
    const logFilePath = path.join(dataDir, "wallet-connect-log.jsonl");
    await fs.mkdir(dataDir, { recursive: true });
    await fs.appendFile(logFilePath, `${json}\n`, "utf8");
    return true;
  } catch (error) {
    console.error("wallet-connect file persist failed:", error);
    return false;
  }
}

function formatTimestampForTimezone(date: Date, timezone: string): string {
  const safeTimezone = timezone && timezone !== "unknown" ? timezone : "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get(
      "second"
    )} (${safeTimezone})`;
  } catch {
    return `${date.toISOString()} (UTC)`;
  }
}

async function sendTelegramHtmlMessage(text: string): Promise<boolean> {
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatIds = getTelegramChatIds();
  if (!botToken || !chatIds.length) return false;

  try {
    const results = await Promise.allSettled(
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
    return results.some((result) => result.status === "fulfilled" && result.value.ok);
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const walletAddress = String(req.body?.walletAddress || "").trim();
    const eventType = String(req.body?.eventType || "connect").toLowerCase() === "disconnect"
      ? "disconnect"
      : "connect";
    const chainName = String(req.body?.chainName || "unknown").trim() || "unknown";
    const path = String(req.body?.path || "/").trim() || "/";
    const rawChainId = req.body?.chainId;
    const chainId = Number.isFinite(Number(rawChainId)) ? Number(rawChainId) : null;

    if (!isWalletAddress(walletAddress)) {
      return res.status(400).json({ ok: false, message: "Invalid wallet address" });
    }

    const ip = getClientIp(req.headers?.["x-forwarded-for"], req.socket?.remoteAddress);
    const userAgent = String(req.headers?.["user-agent"] || "unknown");
    const country = String(req.headers?.["x-vercel-ip-country"] || "unknown");
    const region = String(req.headers?.["x-vercel-ip-country-region"] || "unknown");
    const city = String(req.headers?.["x-vercel-ip-city"] || "unknown");
    const timezone = String(req.headers?.["x-vercel-ip-timezone"] || "unknown");
    const now = new Date();
    const connectedAtIso = now.toISOString();
    const connectedAt = formatTimestampForTimezone(now, timezone);
    const immediateNotifyEnabled =
      String(process.env.WALLET_CONNECT_NOTIFY_IMMEDIATE || "").toLowerCase() === "true";
    const disconnectNotifyEnabled =
      String(process.env.WALLET_DISCONNECT_NOTIFY_IMMEDIATE || "").toLowerCase() === "true";

    let telegramStatus = "disabled";
    let persisted = false;

    if (eventType === "connect") {
      const tzForKey = timezone && timezone !== "unknown" ? timezone : getReportTimezone();
      persisted = await persistWalletConnectRecord({
        walletAddress,
        chainId,
        chainName,
        path,
        ip,
        country,
        region,
        city,
        timezone,
        userAgent,
        env: process.env.VITE_EXECUTION_ENV || process.env.NODE_ENV || "unknown",
        connectedAt: connectedAtIso,
        dayKey: getDateKey(now, tzForKey),
      });
    }

    if (eventType === "connect" && immediateNotifyEnabled) {
      const chain = chainName || "unknown";
      const placeShort = `${city || "unknown"}, ${getCountryLabel(country)}`;
      const text = [
        "<b>Wallet Connected</b>",
        `Wallet: <code>${escapeHtml(walletAddress)}</code>`,
        `Chain: <code>${escapeHtml(chain)}</code>`,
        `Place: <code>${escapeHtml(placeShort)}</code>`,
        `IP: <code>${escapeHtml(ip)}</code>`,
        `Time: <code>${escapeHtml(connectedAt)}</code>`,
      ].join("\n");

      const sent = await sendTelegramHtmlMessage(text);
      telegramStatus = sent ? "sent" : "failed";
    }
    if (eventType === "disconnect" && disconnectNotifyEnabled) {
      const chain = chainName || "unknown";
      const placeShort = `${city || "unknown"}, ${getCountryLabel(country)}`;
      const text = [
        "<b>Wallet Disconnected</b>",
        `Wallet: <code>${escapeHtml(walletAddress)}</code>`,
        `Chain: <code>${escapeHtml(chain)}</code>`,
        `Place: <code>${escapeHtml(placeShort)}</code>`,
        `IP: <code>${escapeHtml(ip)}</code>`,
        `Time: <code>${escapeHtml(connectedAt)}</code>`,
      ].join("\n");

      const sent = await sendTelegramHtmlMessage(text);
      telegramStatus = sent ? "sent" : "failed";
    }

    return res.status(200).json({
      ok: true,
      message:
        eventType === "disconnect"
          ? telegramStatus === "sent"
            ? "Wallet disconnect processed (immediate telegram sent)"
            : telegramStatus === "failed"
            ? "Wallet disconnect processed (immediate telegram failed)"
            : "Wallet disconnect processed"
          :
        telegramStatus === "sent"
          ? persisted
            ? "Wallet connect processed (saved + immediate telegram sent)"
            : "Wallet connect processed (immediate telegram sent)"
          : telegramStatus === "failed"
          ? persisted
            ? "Wallet connect processed (saved, immediate telegram failed)"
            : "Wallet connect processed (immediate telegram failed)"
          : persisted
          ? "Wallet connect processed (saved)"
          : "Wallet connect processed",
    });
  } catch (error) {
    console.error("wallet-connect log failed:", error);
    return res.status(500).json({ ok: false, message: "Wallet connect handler crashed" });
  }
}
