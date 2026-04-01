const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

export interface WalletConnectRecord {
  walletAddress: string;
  chainId: number | null;
  chainName: string;
  path: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  userAgent: string;
  env: string;
  connectedAt: string;
  dayKey: string;
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

async function resolvePaths(): Promise<{ dataDir: string; logFilePath: string; stateFilePath: string }> {
  const path = await import("path");
  const dataDir = getDataDir();
  return {
    dataDir,
    logFilePath: path.join(dataDir, "wallet-connect-log.jsonl"),
    stateFilePath: path.join(dataDir, "wallet-connect-report-state.json"),
  };
}

export function isWalletAddress(value: string): boolean {
  return WALLET_REGEX.test(String(value || "").trim());
}

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getClientIp(
  rawForwardedFor: string | string[] | undefined,
  fallbackIp: string | undefined
): string {
  if (Array.isArray(rawForwardedFor)) {
    const first = String(rawForwardedFor[0] || "").trim();
    if (first) return first;
  }
  if (typeof rawForwardedFor === "string" && rawForwardedFor.trim()) {
    const [firstIp] = rawForwardedFor.split(",");
    return firstIp?.trim() || "unknown";
  }
  return fallbackIp || "unknown";
}

export function getTelegramChatIds(): string[] {
  const envList = String(process.env.TELEGRAM_CHAT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const list = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID_2, ...envList]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

export function getReportTimezone(): string {
  return String(process.env.WALLET_CONNECT_REPORT_TIMEZONE || "Asia/Taipei");
}

export function getDateKey(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function getPreviousDateKey(now: Date, timeZone: string): string {
  const localNow = new Date(now);
  localNow.setUTCDate(localNow.getUTCDate() - 1);
  return getDateKey(localNow, timeZone);
}

export async function appendWalletConnectRecord(record: WalletConnectRecord): Promise<void> {
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
      return;
    }
  } catch (error) {
    console.error("wallet-connect KV append failed, fallback to file:", error);
  }

  const fs = await import("fs/promises");
  const { dataDir, logFilePath } = await resolvePaths();
  await fs.mkdir(dataDir, { recursive: true });
  await fs.appendFile(logFilePath, `${json}\n`, "utf8");
}

export async function readWalletConnectRecords(): Promise<WalletConnectRecord[]> {
  try {
    const fs = await import("fs/promises");
    const { logFilePath } = await resolvePaths();
    const content = await fs.readFile(logFilePath, "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as WalletConnectRecord;
        } catch {
          return null;
        }
      })
      .filter((item): item is WalletConnectRecord => Boolean(item));
  } catch {
    return [];
  }
}

export async function readLastReportedDayKey(): Promise<string | null> {
  try {
    const fs = await import("fs/promises");
    const { stateFilePath } = await resolvePaths();
    const content = await fs.readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(content) as { lastReportedDayKey?: string };
    return parsed.lastReportedDayKey || null;
  } catch {
    return null;
  }
}

export async function writeLastReportedDayKey(dayKey: string): Promise<void> {
  const fs = await import("fs/promises");
  const { dataDir, stateFilePath } = await resolvePaths();
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(stateFilePath, JSON.stringify({ lastReportedDayKey: dayKey }), "utf8");
}

export async function sendTelegramHtmlMessage(text: string): Promise<{ ok: boolean; count: number }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();
  if (!botToken || !chatIds.length) return { ok: false, count: 0 };

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

  const okCount = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
  return { ok: okCount > 0, count: okCount };
}
