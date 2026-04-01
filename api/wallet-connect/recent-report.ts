type WalletConnectRecord = {
  walletAddress?: string;
  chainName?: string;
  city?: string;
  country?: string;
  connectedAt?: string;
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

function getTimezone(): string {
  return String(process.env.WALLET_CONNECT_REPORT_TIMEZONE || "Asia/Taipei");
}

function getRecentReportWindowMinutes(): number {
  const raw = Number.parseInt(
    String(process.env.WALLET_CONNECT_RECENT_REPORT_WINDOW_MINUTES || "").trim(),
    10
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

function formatTime(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString();
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
    console.error("wallet-connect recent-report telegram failed:", error);
    return { ok: false, count: 0 };
  }
}

async function readRecentRecords(minutes = 5): Promise<WalletConnectRecord[]> {
  const cutoff = Date.now() - minutes * 60 * 1000;
  try {
    const kv = getKvConfig();
    if (kv) {
      const rows = (await kvExec([
        "ZRANGEBYSCORE",
        "wstaking:wallet:recent",
        String(cutoff),
        "+inf",
      ])) as string[] | null;
      if (Array.isArray(rows)) {
        return rows
          .map((item) => {
            try {
              return JSON.parse(item) as WalletConnectRecord;
            } catch {
              return null;
            }
          })
          .filter((item): item is WalletConnectRecord => Boolean(item))
          .sort((a, b) => Date.parse(String(a.connectedAt || "")) - Date.parse(String(b.connectedAt || "")));
      }
    }
  } catch (error) {
    console.error("wallet-connect recent-report KV read failed, fallback to file:", error);
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
      .filter((item): item is WalletConnectRecord => Boolean(item))
      .filter((record) => {
        const ts = Date.parse(String(record.connectedAt || ""));
        return Number.isFinite(ts) && ts > cutoff;
      })
      .sort((a, b) => Date.parse(String(a.connectedAt || "")) - Date.parse(String(b.connectedAt || "")));
  } catch (error) {
    console.error("wallet-connect recent-report read failed:", error);
    return [];
  }
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
    const windowMinutes = getRecentReportWindowMinutes();
    const records = await readRecentRecords(windowMinutes);

    if (!records.length) {
      return res
        .status(200)
        .json({ ok: true, message: `No wallet connects in last ${windowMinutes} minutes` });
    }

    const lines = records.slice(0, 40).map((record, idx) => {
      const wallet = String(record.walletAddress || "unknown");
      const chain = String(record.chainName || "unknown");
      const place = `${String(record.city || "unknown")}, ${getCountryLabel(String(record.country || "unknown"))}`;
      const time = formatTime(new Date(String(record.connectedAt || Date.now())), timezone);
      return `${idx + 1}. <code>${escapeHtml(wallet)}</code> | ${escapeHtml(chain)} | ${escapeHtml(
        place
      )} | ${escapeHtml(time)}`;
    });

    const text = [
      `<b>Wallet Connects (Last ${windowMinutes}m)</b>`,
      `Count: <b>${records.length}</b>`,
      `TZ: <code>${escapeHtml(timezone)}</code>`,
      "",
      lines.join("\n"),
    ].join("\n");

    const result = await sendTelegramHtmlMessage(text);
    if (!result.ok) {
      return res.status(200).json({
        ok: true,
        message: "Recent report built, Telegram send failed",
        count: records.length,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "5-minute wallet connect report sent",
      count: records.length,
      sentChats: result.count,
    });
  } catch (error) {
    console.error("wallet-connect recent report fatal error:", error);
    return res.status(200).json({ ok: true, message: "Recent report endpoint recovered from fatal error" });
  }
}
