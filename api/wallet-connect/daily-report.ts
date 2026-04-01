type WalletConnectRecord = {
  walletAddress?: string;
  chainName?: string;
  chainId?: number | null;
  city?: string;
  region?: string;
  country?: string;
  connectedAt?: string;
  dayKey?: string;
};

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

function getDataDir(): string {
  if (process.env.WALLET_CONNECT_LOG_DIR) return String(process.env.WALLET_CONNECT_LOG_DIR);
  if (process.env.VERCEL) return "/tmp/wstaking-logs";
  return `${process.cwd()}/.data`;
}

function getKvConfig(): { url: string; token: string } | null {
  const url = String(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = String(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!url || !token) return null;
  return { url, token };
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

function getTimezone(): string {
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

function getPreviousDateKey(now: Date, timeZone: string): string {
  const prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return getDateKey(prev, timeZone);
}

function getRequestBaseUrl(req: any): string {
  const explicit = String(process.env.WALLET_CONNECT_REPORT_BASE_URL || "").trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const proto = String(req.headers?.["x-forwarded-proto"] || "https").trim() || "https";
  const host = String(req.headers?.host || "").trim();
  if (host) return `${proto}://${host}`;

  const vercelProjectUrl = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
  if (vercelProjectUrl) {
    return /^https?:\/\//i.test(vercelProjectUrl)
      ? vercelProjectUrl.replace(/\/+$/, "")
      : `https://${vercelProjectUrl.replace(/\/+$/, "")}`;
  }

  const vercelUrl = String(process.env.VERCEL_URL || "").trim();
  if (vercelUrl) {
    return /^https?:\/\//i.test(vercelUrl)
      ? vercelUrl.replace(/\/+$/, "")
      : `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  return "";
}

function formatRecordTime(value: string | undefined, timeZone: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "unknown";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(parsed);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value || "00";
    return `${get("hour")}:${get("minute")}`;
  } catch {
    return raw;
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

function isAuthorizedRequest(req: any): boolean {
  const cronSecret = String(process.env.CRON_SECRET || "").trim();
  const reportToken = String(process.env.WALLET_CONNECT_REPORT_TOKEN || "").trim();
  const authHeader = String(req.headers?.authorization || "").trim();
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const queryToken = String(req.query?.token || "").trim();

  if (cronSecret && bearerToken === cronSecret) return true;
  if (reportToken && queryToken === reportToken) return true;
  return !cronSecret && !reportToken;
}

function isCronInvocation(req: any): boolean {
  const cronHeader = String(req.headers?.["x-vercel-cron"] || "").trim();
  return cronHeader === "1" || cronHeader.toLowerCase() === "true";
}

async function sendTelegramHtmlMessage(text: string): Promise<{ ok: boolean; count: number }> {
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatIds = getTelegramChatIds();
  if (!botToken || !chatIds.length) return { ok: false, count: 0 };

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
    const okCount = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
    return { ok: okCount > 0, count: okCount };
  } catch (error) {
    console.error("wallet-connect daily telegram failed:", error);
    return { ok: false, count: 0 };
  }
}

async function readWalletConnectRecords(dayKey?: string): Promise<WalletConnectRecord[]> {
  try {
    const kv = getKvConfig();
    if (kv && dayKey) {
      const rows = (await kvExec(["LRANGE", `wstaking:wallet:day:${dayKey}`, "0", "-1"])) as
        | string[]
        | null;
      if (Array.isArray(rows)) {
        return rows
          .map((item) => {
            try {
              return JSON.parse(item) as WalletConnectRecord;
            } catch {
              return null;
            }
          })
          .filter((item): item is WalletConnectRecord => Boolean(item));
      }
    }
  } catch (error) {
    console.error("wallet-connect daily KV read failed, fallback to file:", error);
  }

  try {
    const path = await import("path");
    const fs = await import("fs/promises");
    const logFilePath = path.join(getDataDir(), "wallet-connect-log.jsonl");
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
  } catch (error) {
    console.error("wallet-connect daily read failed:", error);
    return [];
  }
}

async function readLastReportedDayKey(): Promise<string | null> {
  try {
    const kv = getKvConfig();
    if (kv) {
      const value = await kvExec(["GET", "wstaking:wallet:daily:lastReportedDayKey"]);
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  } catch (error) {
    console.error("wallet-connect daily KV state read failed, fallback to file:", error);
  }

  try {
    const path = await import("path");
    const fs = await import("fs/promises");
    const statePath = path.join(getDataDir(), "wallet-connect-report-state.json");
    const content = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(content) as { lastReportedDayKey?: string };
    return parsed.lastReportedDayKey || null;
  } catch {
    return null;
  }
}

async function writeLastReportedDayKey(dayKey: string): Promise<void> {
  try {
    const kv = getKvConfig();
    if (kv) {
      await kvExec(["SET", "wstaking:wallet:daily:lastReportedDayKey", dayKey]);
      return;
    }
  } catch (error) {
    console.error("wallet-connect daily KV state write failed, fallback to file:", error);
  }

  try {
    const path = await import("path");
    const fs = await import("fs/promises");
    const dataDir = getDataDir();
    const statePath = path.join(dataDir, "wallet-connect-report-state.json");
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(statePath, JSON.stringify({ lastReportedDayKey: dayKey }), "utf8");
  } catch (error) {
    console.error("wallet-connect daily write state failed:", error);
  }
}

function buildSummaryText(
  dayKey: string,
  timezone: string,
  records: WalletConnectRecord[],
  moreLink?: string,
  fullMode: boolean = false
): string {
  const total = records.length;
  const countryCounts = new Map<string, number>();
  for (const record of records) {
    const key = getCountryLabel(String(record.country || "unknown"));
    countryCounts.set(key, (countryCounts.get(key) || 0) + 1);
  }

  const topCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, count]) => `${escapeHtml(country)}(${count})`)
    .join(", ");

  const maxRows = fullMode ? records.length : 20;
  const rows = records.slice(0, maxRows).map((record, index) => {
    const wallet = escapeHtml(String(record.walletAddress || "unknown"));
    const chain = escapeHtml(String(record.chainName || record.chainId || "unknown"));
    const place = `${escapeHtml(String(record.city || "unknown"))}, ${escapeHtml(
      String(record.region || "unknown")
    )}, ${escapeHtml(getCountryLabel(String(record.country || "unknown")))}`;
    const at = escapeHtml(formatRecordTime(record.connectedAt, timezone));
    return `${index + 1}. <code>${wallet}</code> | ${chain} | ${place} | ${at}`;
  });

  const extraCount = total - maxRows;
  const truncated =
    extraCount > 0
      ? moreLink
        ? `\n<a href="${escapeHtml(moreLink)}">...and ${extraCount} more</a>\n${escapeHtml(moreLink)}`
        : `\n...and ${extraCount} more`
      : "";

  return [
    "<b>Daily Wallet Connect Report</b>",
    `Day: <code>${escapeHtml(dayKey)}</code> (${escapeHtml(timezone)})`,
    `Total Connects: <b>${total}</b>`,
    `Top Countries: <code>${topCountries || "n/a"}</code>`,
    "",
    "<b>Details</b>",
    rows.join("\n"),
    truncated,
  ].join("\n");
}

function getLocalHourMinute(date: Date, timeZone: string): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || "0");
    const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");
    return { hour, minute };
  } catch {
    return { hour: date.getUTCHours(), minute: date.getUTCMinutes() };
  }
}

function getTargetReportTime(): { hour: number; minute: number } {
  const hourRaw = Number.parseInt(String(process.env.WALLET_CONNECT_REPORT_LOCAL_HOUR || "9"), 10);
  const minuteRaw = Number.parseInt(String(process.env.WALLET_CONNECT_REPORT_LOCAL_MINUTE || "0"), 10);
  const hour = Number.isFinite(hourRaw) ? Math.min(23, Math.max(0, hourRaw)) : 9;
  const minute = Number.isFinite(minuteRaw) ? Math.min(59, Math.max(0, minuteRaw)) : 0;
  return { hour, minute };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    if (!isAuthorizedRequest(req)) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const chatIds = getTelegramChatIds();
    const botToken = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!botToken || !chatIds.length) {
      return res.status(503).json({ ok: false, message: "Telegram env vars are not configured" });
    }

    const timezone = getTimezone();
    const targetTime = getTargetReportTime();
    const requestedDay = String(req.query?.day || "").trim();
    const isCron = isCronInvocation(req);
    const dayKey = requestedDay || getPreviousDateKey(new Date(), timezone);
    const force = String(req.query?.force || "").trim() === "1";

    if (isCron && !force) {
      const localNow = getLocalHourMinute(new Date(), timezone);
      if (localNow.hour !== targetTime.hour || localNow.minute !== targetTime.minute) {
        return res.status(200).json({
          ok: true,
          message: "Skipped: outside configured local report time window",
          timezone,
          now: `${String(localNow.hour).padStart(2, "0")}:${String(localNow.minute).padStart(2, "0")}`,
          target: `${String(targetTime.hour).padStart(2, "0")}:${String(targetTime.minute).padStart(2, "0")}`,
        });
      }
    }

    const alreadyReported = await readLastReportedDayKey();
    if (!force && alreadyReported === dayKey) {
      return res.status(200).json({ ok: true, message: "Already reported for this day", dayKey });
    }

    const records = (await readWalletConnectRecords(dayKey)).filter((record) => record.dayKey === dayKey);
    const fullMode = String(req.query?.full || "").trim() === "1";
    const baseUrl = getRequestBaseUrl(req);
    const moreLink = baseUrl
      ? `${baseUrl}/api/wallet-connect/daily-report?day=${encodeURIComponent(dayKey)}&force=1&full=1`
      : undefined;
    const text = buildSummaryText(dayKey, timezone, records, moreLink, fullMode);
    const result = await sendTelegramHtmlMessage(text);

    if (result.ok) {
      await writeLastReportedDayKey(dayKey);
      return res.status(200).json({
        ok: true,
        message: "Daily wallet connect report sent",
        dayKey,
        sentChats: result.count,
        records: records.length,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Daily report built, Telegram send failed",
      dayKey,
      records: records.length,
    });
  } catch (error) {
    console.error("wallet-connect daily fatal error:", error);
    return res.status(200).json({ ok: true, message: "Daily report endpoint recovered from fatal error" });
  }
}
