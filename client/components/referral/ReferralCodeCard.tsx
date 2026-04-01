/**
 * ReferralCodeCard
 *
 * Three modes:
 *   1. No code yet   → user picks/types a code, sees warning, ticks checkbox, submits.
 *   2. Code locked   → display code + copy / share link + "Change Code" button.
 *   3. Editing code  → same form as (1) but pre-filled with current code, stronger
 *                      warning that the old code AND its rewards will be wiped.
 */

import { useState, useEffect, useRef } from "react";
import { Copy, Check, Share2, AlertTriangle, Shuffle, Pencil, X, Loader2, Mail, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useSignMessage, useAccount } from "wagmi";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// Referral code: letters A-Z and digits 0-9, 4-12 characters
const ALLOWED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_RE = /^[A-Z0-9]{4,12}$/;

interface ReferralCodeCardProps {
  /** Locked code — if null the "choose your code" UI is shown. */
  code: string | null;
  /** Wallet address of the current user, used to generate the default code. */
  walletAddress: string;
  isLoading?: boolean;
  /** Called once after the user confirms their chosen code. */
  onCodeConfirmed: (code: string) => void;
  /** Called when the user submits their chosen custom / auto code via the API. */
  onSubmitCode: (code: string, signature: string, challengeToken: string) => Promise<void>;
}

function buildDefaultCode(wallet: string): string {
  const hex = wallet.toLowerCase().replace("0x", "");
  let code = "";
  for (let i = 0; i < 8; i++) {
    const byte = parseInt(hex[i * 2] + hex[i * 2 + 1], 16);
    code += ALLOWED_CHARS[byte % 32];
  }
  return code;
}

export default function ReferralCodeCard({
  code,
  walletAddress,
  isLoading = false,
  onCodeConfirmed,
  onSubmitCode,
}: ReferralCodeCardProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const defaultCode = buildDefaultCode(walletAddress);

  // When editing an existing code, pre-fill with the current one
  const [inputCode, setInputCode] = useState(code ?? defaultCode);
  const [inputError, setInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Live availability check
  type AvailState = "idle" | "checking" | "available" | "taken" | "error";
  const [avail, setAvail] = useState<AvailState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); // change-code mode for existing holders
  const shareMenuRef = useRef<HTMLDivElement>(null);

  function enterEditMode() {
    setInputCode(code ?? defaultCode);
    setConfirmed(false);
    setInputError(null);
    setAvail("idle");
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setConfirmed(false);
    setInputError(null);
    setAvail("idle");
  }

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = code ? `${window.location.origin}/?r=${code}` : "";

  function copyToClipboard(text: string, type: "code" | "link") {
    const onSuccess = () => {
      if (type === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        fallbackCopy(text, onSuccess);
      });
    } else {
      fallbackCopy(text, onSuccess);
    }
  }

  function fallbackCopy(text: string, onSuccess: () => void) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onSuccess();
    } catch {
      // silently fail
    }
  }

  function handleInput(val: string) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    setInputCode(upper);
    setInputError(null);
    setConfirmed(false);

    // Don't check if it's the same as the current code (editing mode no-op)
    if (isChangingExisting && upper === code) {
      setAvail("idle");
      return;
    }

    if (!CODE_RE.test(upper)) {
      setAvail("idle");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    setAvail("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/referral/check-code?code=${encodeURIComponent(upper)}`);
        const data = await res.json();
        setAvail(data.ok && data.available ? "available" : "taken");
      } catch {
        setAvail("error");
      }
    }, 500);
  }

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Close share menu on outside click
  useEffect(() => {
    if (!showShareMenu) return;
    function handler(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showShareMenu]);

  async function handleSubmit() {
    const trimmed = inputCode.trim();
    if (!CODE_RE.test(trimmed)) {
      setInputError(t("referral.code.rules"));
      return;
    }
    if (avail === "taken") {
      setInputError(t("referral.code.taken"));
      return;
    }
    setSubmitting(true);
    setInputError(null);
    try {
      // 1. Get a one-time nonce challenge from the server (10-min TTL)
      const nonceRes = await fetch(
        `/api/referral/setup-nonce?wallet=${encodeURIComponent(walletAddress)}`
      );
      const nonceText = await nonceRes.text();
      let nonceData: any = {};
      try { nonceData = JSON.parse(nonceText); } catch {}
      if (!nonceRes.ok) {
        throw new Error(nonceData.error || t("referral.code.serverError", { status: nonceRes.status }));
      }
      const { challengeToken, message } = nonceData;

      // 2. Ask the wallet to sign the message (proves ownership — EIP-191)
      const signature = await signMessageAsync({
        account: (address ?? walletAddress) as `0x${string}`,
        message,
      });

      // 3. Submit code + signature to the server
      await onSubmitCode(trimmed, signature, challengeToken);
      onCodeConfirmed(trimmed);
    } catch (err: any) {
      // User cancelled the signature prompt — treat silently
      if (err?.name === "UserRejectedRequestError" || err?.code === 4001) {
        // do nothing
      } else {
        setInputError(err?.message || t("referral.code.saveFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Derived: is the current input a known-available new code?
  const isChangingExisting = !!code && isEditing;
  const isSameAsCurrent = isChangingExisting && inputCode === code;

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="h-10 w-48 bg-white/10 rounded-xl mb-3" />
        <div className="h-10 w-full bg-white/10 rounded-xl" />
      </div>
    );
  }

  // ── Shared edit form (used for both first-time setup and code change) ────────
  if (!code || isEditing) {
    return (
      <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-ws-green" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              {isChangingExisting ? t("referral.code.changeTitle") : t("referral.code.chooseTitle")}
            </p>
          </div>
          {isChangingExisting && (
            <button
              type="button"
              onClick={cancelEdit}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-all"
              title={t("cancel")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-white/40 mb-5">
          {isChangingExisting ? (
            <>
              {t("referral.code.currentCodeIntro")} {" "}
              <span className="font-mono font-bold text-white/70">{code}</span>
              . {t("referral.code.enterNewCode")}
            </>
          ) : (
            <>{t("referral.code.chooseIntro")}</>
          )}
        </p>

        {/* Input row */}
        <label className="block text-[11px] text-white/35 mb-1.5 font-medium uppercase tracking-wider">
          {t("referral.code.yourCode")}
        </label>
        <div className="flex items-center gap-3 mb-1">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={t("referral.code.placeholder")}
            maxLength={12}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border font-mono text-lg font-bold tracking-[0.15em] text-white uppercase text-center outline-none transition-all",
              inputError || avail === "taken"
                ? "border-red-500/60 focus:border-red-500"
                : avail === "available"
                ? "border-ws-green/50 focus:border-ws-green"
                : "border-ws-card-border focus:border-ws-green/60"
            )}
          />
          {/* Reset to wallet-derived default (only for first-time) */}
          {!isChangingExisting && (
            <button
              type="button"
              title={t("referral.code.resetSuggestion")}
              onClick={() => { setInputCode(defaultCode); setInputError(null); }}
              className="p-3 rounded-xl border border-ws-card-border text-white/40 hover:border-ws-green/50 hover:text-ws-green transition-all"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Availability badge */}
        <div className="h-5 mb-3">
          {avail === "checking" && (
            <span className="flex items-center gap-1.5 text-xs text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" /> {t("referral.code.checking")}
            </span>
          )}
          {avail === "available" && !isSameAsCurrent && (
            <span className="flex items-center gap-1.5 text-xs text-ws-green">
              <Check className="w-3 h-3" /> {t("referral.code.available")}
            </span>
          )}
          {avail === "taken" && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <X className="w-3 h-3" /> {t("referral.code.taken")}
            </span>
          )}
          {avail === "error" && (
            <span className="text-xs text-white/30">{t("referral.code.checkFailed")}</span>
          )}
        </div>
        <p className="text-[11px] text-white/30 mb-4">
          {t("referral.code.rules")}
        </p>
        {inputError && (
          <p className="text-xs text-red-400 mb-4">{inputError}</p>
        )}

        {/* Warning — different text for first-time vs. change */}
        <div className={cn(
          "rounded-xl border p-4 mb-4",
          isChangingExisting
            ? "border-red-500/30 bg-red-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        )}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", isChangingExisting ? "text-red-400" : "text-amber-400")} />
            <div className={cn("text-xs space-y-1", isChangingExisting ? "text-red-200/70" : "text-amber-200/70")}>
              {isChangingExisting ? (
                <>
                  <p className="font-semibold text-red-300">
                    {t("referral.code.changeWarningTitle")}
                  </p>
                  <p>
                    {t("referral.code.changeWarningCurrent")} <span className="font-mono font-bold text-red-200">{code}</span> {t("referral.code.changeWarningRemoved")}
                  </p>
                  <p>
                    {t("referral.code.changeWarningReferrals")}
                  </p>
                  <p>
                    {t("referral.code.changeWarningWalletOnly")}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-300">
                    {t("referral.code.firstWarningTitle")}
                  </p>
                  <p>
                    {t("referral.code.firstWarningWalletOnly")}
                  </p>
                  <p>
                    {t("referral.code.firstWarningShare")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Checkbox confirmation */}
        <label className="flex items-start gap-3 cursor-pointer mb-4 group">
          <div className="mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                confirmed
                  ? "border-ws-green bg-ws-green"
                  : "border-white/30 group-hover:border-white/50"
              )}
            >
              {confirmed && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
            </div>
          </div>
          <span className="text-xs text-white/55 leading-relaxed">
            {isChangingExisting ? (
              <>{t("referral.code.changeConfirmStart")} <span className="font-mono font-semibold text-white/80">{code}</span> {t("referral.code.changeConfirmEnd")}</>
            ) : (
              <>{t("referral.code.firstConfirm")}</>
            )}
          </span>
        </label>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!confirmed || submitting || avail === "taken" || avail === "checking"}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-all",
            !confirmed || submitting || avail === "taken" || avail === "checking"
              ? "bg-white/[0.06] text-white/25 cursor-not-allowed"
              : "bg-ws-green text-black hover:bg-ws-green/90"
          )}
        >
          {submitting
            ? t("referral.code.waitingSignature")
            : confirmed
            ? isChangingExisting
              ? t("referral.code.replaceButton", { from: code, to: inputCode })
              : t("referral.code.confirmSave", { code: inputCode })
            : t("referral.code.tickToConfirm")}
        </button>
        {confirmed && !submitting && (
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/30 mt-2">
            <ShieldCheck className="w-3 h-3 text-ws-green/50" />
            {t("referral.code.signatureHint")}
          </p>
        )}
      </div>
    );
  }

  // ── Locked code display ────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-ws-green" />
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            {t("referral.code.yourReferralCode")}
          </p>
        </div>
        <button
          type="button"
          onClick={enterEditMode}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-all px-2 py-1 rounded-lg hover:bg-white/[0.05]"
        >
          <Pencil className="w-3 h-3" />
          {t("referral.code.changeCode")}
        </button>
      </div>
      <p className="text-xs text-white/40 mb-4">
        {t("referral.code.shareDescription")}
      </p>

      {/* Code display */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 px-5 py-3 rounded-xl bg-ws-green/10 border border-ws-green/30 text-center">
          <span className="font-mono text-2xl font-bold tracking-[0.2em] text-ws-green">
            {code}
          </span>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(code, "code")}
          className={cn(
            "p-3 rounded-xl border transition-all",
            copiedCode
              ? "border-ws-green bg-ws-green/10 text-ws-green"
              : "border-ws-card-border text-white/60 hover:border-ws-green hover:text-ws-green"
          )}
          title={t("referral.code.copyCode")}
        >
          {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Share link */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden">
          <p className="text-xs text-white/50 truncate font-mono">{shareUrl}</p>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(shareUrl, "link")}
          className={cn(
            "px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap",
            copiedLink
              ? "border-ws-green bg-ws-green/10 text-ws-green"
              : "border-ws-card-border text-white/60 hover:border-ws-green hover:text-ws-green"
          )}
        >
          {copiedLink ? t("referral.code.copied") : t("referral.code.copyLink")}
        </button>

        {/* Share dropdown */}
        <div className="relative" ref={shareMenuRef}>
          <button
            type="button"
            onClick={() => setShowShareMenu((v) => !v)}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              showShareMenu
                ? "border-ws-green bg-ws-green/10 text-ws-green"
                : "border-ws-card-border text-white/60 hover:border-ws-green hover:text-ws-green"
            )}
            title={t("referral.code.share")}
          >
            <Share2 className="w-4 h-4" />
          </button>

          {showShareMenu && (
            <div className="absolute bottom-full right-0 mb-2 z-50 w-60 rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 px-1">{t("referral.code.shareVia")}</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("🚀 Stake crypto & earn rewards on WStaking! Use my referral link:")}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-black hover:bg-black/70 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-[9px] text-white/70 leading-none">X / Twitter</span>
                </a>
                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("🚀 Stake crypto & earn rewards on WStaking! Use my referral link:")}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1a8bbf] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="text-[9px] text-white/70 leading-none">Telegram</span>
                </a>
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("🚀 Stake crypto & earn rewards on WStaking! Use my referral link: " + shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#25D366] hover:bg-[#1db855] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  <span className="text-[9px] text-white/70 leading-none">WhatsApp</span>
                </a>
                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#1877F2] hover:bg-[#1464d8] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-[9px] text-white/70 leading-none">Facebook</span>
                </a>
                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#0855a3] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-[9px] text-white/70 leading-none">LinkedIn</span>
                </a>
                {/* Reddit */}
                <a
                  href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("Earn rewards staking crypto on WStaking!")}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#FF4500] hover:bg-[#e03d00] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  <span className="text-[9px] text-white/70 leading-none">Reddit</span>
                </a>
              </div>
              {/* Email + native share */}
              <div className="flex gap-2">
                <a
                  href={`mailto:?subject=${encodeURIComponent("Join me on WStaking!")}&body=${encodeURIComponent("Hey! Use my referral link to start staking and earning rewards:\n\n" + shareUrl)}`}
                  onClick={() => setShowShareMenu(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-colors"
                >
                  <Mail className="w-4 h-4 text-white/60" />
                  <span className="text-xs text-white/60">{t("referral.code.email")}</span>
                </a>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareMenu(false);
                      navigator.share({ title: "WStaking Referral", text: "🚀 Stake crypto & earn rewards using my referral link!", url: shareUrl });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">{t("referral.code.more")}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
