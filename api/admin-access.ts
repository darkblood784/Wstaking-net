const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getClientIp(rawForwardedFor: string | undefined, fallbackIp: string | undefined): string {
  if (rawForwardedFor) {
    const [firstIp] = rawForwardedFor.split(",");
    return firstIp?.trim() || "unknown";
  }
  return fallbackIp || "unknown";
}

function detectDeviceType(userAgent: string): string {
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "Mobile";
  if (/ipad|tablet/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

function detectBrowser(userAgent: string): string {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/safari\//i.test(userAgent)) return "Safari";
  return "Unknown";
}

function detectOs(userAgent: string): string {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, notified: false, message: "Method not allowed" });
  }

  const walletAddress = String(req.body?.walletAddress || "").trim();
  const chainName = String(req.body?.chainName || "").trim();
  const rawChainId = req.body?.chainId;
  const chainId = Number.isFinite(Number(rawChainId)) ? Number(rawChainId) : null;
  if (!walletAddressRegex.test(walletAddress)) {
    return res.status(400).json({ ok: false, notified: false, message: "Invalid wallet address" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();
  if (!botToken || !chatIds.length) {
    return res
      .status(503)
      .json({ ok: false, notified: false, message: "Telegram env vars are not configured" });
  }

  const ip = getClientIp(req.headers?.["x-forwarded-for"], req.socket?.remoteAddress);
  const userAgent = String(req.headers?.["user-agent"] || "unknown");
  const deviceType = detectDeviceType(userAgent);
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);
  const country = String(req.headers?.["x-vercel-ip-country"] || "unknown");
  const region = String(req.headers?.["x-vercel-ip-country-region"] || "unknown");
  const city = String(req.headers?.["x-vercel-ip-city"] || "unknown");
  const timezone = String(req.headers?.["x-vercel-ip-timezone"] || "unknown");
  const timestamp = formatTimestampForTimezone(new Date(), timezone);

  const text = [
    "<b>Admin Page Access</b>",
    `Wallet: <code>${escapeHtml(walletAddress)}</code>`,
    `Chain: <code>${escapeHtml(chainName || (chainId !== null ? String(chainId) : "unknown"))}</code>`,
    `IP: <code>${escapeHtml(ip)}</code>`,
    `Place: <code>${escapeHtml(city)}, ${escapeHtml(region)}, ${escapeHtml(country)}</code>`,
    `Device: <code>${escapeHtml(deviceType)}</code>`,
    `OS: <code>${escapeHtml(os)}</code>`,
    `Browser: <code>${escapeHtml(browser)}</code>`,
    `Time: <code>${escapeHtml(timestamp)}</code>`,
    `UA: <code>${escapeHtml(String(userAgent))}</code>`,
  ].join("\n");

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

    const okCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.ok
    ).length;
    if (okCount === 0) {
      return res.status(502).json({ ok: false, notified: false, message: "Telegram API request failed" });
    }

    return res.status(200).json({ ok: true, notified: true, message: "Admin access logged" });
  } catch (error) {
    console.error("Failed to send Telegram admin access notification:", error);
    return res.status(500).json({ ok: false, notified: false, message: "Failed to reach Telegram API" });
  }
}

