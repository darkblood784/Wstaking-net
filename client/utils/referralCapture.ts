import { loadEnvConfig } from "./envLoader";

const LEGACY_LS_KEY = "wstaking:referral";
const SESSION_CAPTURE_HINT_KEY = "wstaking:referral:capture-pending";
const SESSION_CAPTURE_CODE_KEY = "wstaking:referral:capture-code";

export function getReferralCodeFromUrl(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("r");
    if (!raw) return null;
    if (!/^[A-Za-z0-9]{4,12}$/.test(raw)) return null;
    return raw.toUpperCase();
  } catch {
    return null;
  }
}

export async function captureReferralCode(): Promise<void> {
  const envConfig = loadEnvConfig();
  const env = envConfig.executionEnv;
  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (!isLocalDev && env !== "prod" && env !== "preprod") return;

  const code = getReferralCodeFromUrl();
  if (!code) return;

  try {
    const res = await fetch("/api/referral/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      return;
    }

    try {
      sessionStorage.setItem(SESSION_CAPTURE_HINT_KEY, "1");
      sessionStorage.setItem(SESSION_CAPTURE_CODE_KEY, code);
    } catch {
      // ignore
    }

    try {
      localStorage.removeItem(LEGACY_LS_KEY);
    } catch {
      // ignore
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("r");
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // ignore capture failures; bind flow will simply have no captured code
  }
}

export function clearStoredReferral(): void {
  try {
    localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(SESSION_CAPTURE_HINT_KEY);
    sessionStorage.removeItem(SESSION_CAPTURE_CODE_KEY);
  } catch {
    // ignore
  }
}

export function hasPendingReferralCaptureHint(): boolean {
  try {
    return sessionStorage.getItem(SESSION_CAPTURE_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function getPendingReferralCaptureCode(): string | null {
  try {
    const value = sessionStorage.getItem(SESSION_CAPTURE_CODE_KEY);
    return value && /^[A-Z0-9]{4,12}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}
