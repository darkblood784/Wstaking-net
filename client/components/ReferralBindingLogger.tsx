/**
 * ReferralBindingLogger
 *
 * UX safety layer for referral binding:
 *  1. Detects a pending captured referral code from the server-owned capture flow.
 *  2. Shows an explicit confirmation modal before asking for a wallet signature.
 *  3. Executes the secure backend bind flow only after user confirmation.
 *  4. Surfaces clear success/error notifications for invalid code, already-bound wallet,
 *     cancelled signature, and successful binding.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { AlertTriangle, CheckCircle2, Link2, ShieldCheck, X } from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";
import {
  clearStoredReferral,
  getPendingReferralCaptureCode,
  hasPendingReferralCaptureHint,
} from "@/utils/referralCapture";
import { getNetworkName } from "@/utils/networkUtils";
import { loadEnvConfig } from "@/utils/envLoader";

const SESSION_BINDING_KEY = "wstaking:referral:binding-attempted";
const SESSION_DISMISS_KEY = "wstaking:referral:binding-dismissed";

function getFriendlyBindError(message: string): string {
  const normalized = String(message || "").toLowerCase();
  if (normalized.includes("already bound")) {
    return "This wallet is already linked to a referral code.";
  }
  if (normalized.includes("invalid referral code") || normalized.includes("referral code not found")) {
    return "This referral code is no longer valid. Please use a valid referral link.";
  }
  if (normalized.includes("inactive")) {
    return "This referral code is inactive and cannot be used.";
  }
  if (normalized.includes("no captured referral code")) {
    return "No referral code is waiting to be linked for this wallet session.";
  }
  return message || "Unable to complete referral binding right now.";
}

export default function ReferralBindingLogger() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { showNotification } = useNotification();
  const hasAttemptedRef = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const capturedCode = useMemo(() => getPendingReferralCaptureCode(), [modalOpen, isConnected, address]);

  useEffect(() => {
    if (!isConnected || !address) {
      hasAttemptedRef.current = false;
      setModalOpen(false);
      return;
    }

    const envConfig = loadEnvConfig();
    const env = envConfig.executionEnv;
    const isLocalDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    if (!isLocalDev && env !== "prod" && env !== "preprod") return;

    const sessionKey = `${SESSION_BINDING_KEY}:${address.toLowerCase()}`;
    const dismissedKey = `${SESSION_DISMISS_KEY}:${address.toLowerCase()}`;

    try {
      if (sessionStorage.getItem(sessionKey)) return;
      if (sessionStorage.getItem(dismissedKey)) return;
    } catch {
      // ignore storage errors
    }

    if (hasAttemptedRef.current) return;
    if (!hasPendingReferralCaptureHint()) return;

    hasAttemptedRef.current = true;
    setModalOpen(true);
  }, [isConnected, address]);

  async function handleConfirmBind() {
    if (!address) return;

    setSubmitting(true);
    const sessionKey = `${SESSION_BINDING_KEY}:${address.toLowerCase()}`;
    const dismissedKey = `${SESSION_DISMISS_KEY}:${address.toLowerCase()}`;

    try {
      const nonceRes = await fetch(`/api/referral/bind-nonce?wallet=${encodeURIComponent(address)}`);
      const nonceData = await nonceRes.json().catch(() => ({}));
      if (!nonceRes.ok || !nonceData?.challengeToken || !nonceData?.message) {
        throw new Error(nonceData?.error || "Unable to start referral confirmation.");
      }

      let signature: string;
      try {
        signature = await signMessageAsync({ account: address, message: nonceData.message });
      } catch (error: any) {
        showNotification("Referral confirmation was cancelled before signature.", "info");
        setSubmitting(false);
        return;
      }

      const bindRes = await fetch("/api/referral/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          walletAddress: address,
          signature,
          challengeToken: nonceData.challengeToken,
          network: getNetworkName(),
          isNewUser: false,
        }),
      });

      const bindData = await bindRes.json().catch(() => ({}));
      if (bindRes.ok && bindData?.ok) {
        clearStoredReferral();
        try {
          sessionStorage.removeItem(dismissedKey);
          sessionStorage.setItem(sessionKey, "1");
        } catch {
          // ignore
        }
        setModalOpen(false);
        showNotification(`Referral code ${capturedCode || ""} linked successfully.`, "success");
        return;
      }

      if (bindRes.status !== 500) {
        clearStoredReferral();
        try {
          sessionStorage.setItem(sessionKey, "1");
          sessionStorage.removeItem(dismissedKey);
        } catch {
          // ignore
        }
      }

      setModalOpen(false);
      showNotification(getFriendlyBindError(bindData?.error), bindRes.status >= 500 ? "error" : "warning");
    } catch (error: any) {
      showNotification(getFriendlyBindError(error?.message), "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDismiss() {
    if (!address) {
      setModalOpen(false);
      return;
    }
    try {
      sessionStorage.setItem(`${SESSION_DISMISS_KEY}:${address.toLowerCase()}`, "1");
    } catch {
      // ignore
    }
    setModalOpen(false);
    showNotification("Referral code saved for now. Reconnect this wallet later if you want to complete the link.", "info");
  }

  if (!modalOpen || !isConnected || !address || !hasPendingReferralCaptureHint()) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B0F0D] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-ws-green/30 bg-ws-green/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ws-green">
              <ShieldCheck className="h-3.5 w-3.5" />
              Referral Confirmation
            </div>
            <h3 className="text-2xl font-bold text-white">Confirm wallet referral link</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              This wallet will be linked to the referral code below. Once a wallet is linked, it cannot be rebound to a different code later.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl border border-white/10 p-2 text-white/40 transition hover:border-white/20 hover:text-white/70"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-ws-green/25 bg-ws-green/10 p-4">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-5 w-5 text-ws-green" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Captured Referral Code</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.22em] text-ws-green">
                {capturedCode || "UNKNOWN"}
              </p>
              <p className="mt-2 text-xs text-white/45">
                Connected wallet: <span className="font-mono text-white/70">{address}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/80">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            <p>
              Use <span className="font-semibold text-amber-200">Confirm & Sign</span> only if this is the referral code you intend to keep for this wallet.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={submitting}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white/65 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleConfirmBind}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ws-green px-5 py-3 text-sm font-semibold text-black transition hover:bg-ws-green/90 disabled:cursor-not-allowed disabled:bg-ws-green/50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Waiting for signature..." : "Confirm & Sign"}
          </button>
        </div>
      </div>
    </div>
  );
}
