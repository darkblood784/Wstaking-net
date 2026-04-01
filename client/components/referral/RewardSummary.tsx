/**
 * RewardSummary
 * Shows the inviter's total earned / total paid / claimable amounts and provides
 * the claim request form.
 *
 * Security model:
 *   Claim submission goes through the server API:
 *     1. GET /api/referral/claim-nonce?wallet=... → challengeToken + message
 *     2. User signs `message` with their wallet (EIP-191)
 *     3. POST /api/referral/submit-claim with signature + challengeToken
 *   The server verifies the signature, recalculates the claimable amount from
 *   Firestore snapshots, and writes the claim request — no client-supplied
 *   amounts are trusted.
 */

import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useTranslation } from "react-i18next";
import { TrendingUp, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/formatNumber";
import type { ReferralClaimBucketSummary, ReferralClaimRequest } from "@shared/referral";

interface RewardSummaryProps {
  inviterWallet: string;
  totalEarnedUSD: number;
  totalPaidUSD: number;
  claimableAmountUSD: number;
  claimBuckets: ReferralClaimBucketSummary[];
  pendingClaimRequests: ReferralClaimRequest[];
  isLoading?: boolean;
  onClaimSubmitted?: () => void;
}

export default function RewardSummary({
  inviterWallet,
  totalEarnedUSD,
  totalPaidUSD,
  claimableAmountUSD,
  claimBuckets,
  pendingClaimRequests,
  isLoading = false,
  onClaimSubmitted,
}: RewardSummaryProps) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [showForm, setShowForm] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState("");
  const availableBuckets = claimBuckets.filter((bucket) => bucket.claimableAmountUSD > 0);
  const [selectedBucketKey, setSelectedBucketKey] = useState(
    availableBuckets[0]?.key ?? claimBuckets[0]?.key ?? ""
  );
  const [receivingWallet, setReceivingWallet] = useState(inviterWallet);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const selectedBucket =
    claimBuckets.find((bucket) => bucket.key === selectedBucketKey) ??
    availableBuckets[0] ??
    null;

  useEffect(() => {
    if (!selectedBucketKey && claimBuckets.length > 0) {
      setSelectedBucketKey(availableBuckets[0]?.key ?? claimBuckets[0].key);
    }
  }, [selectedBucketKey, claimBuckets, availableBuckets]);

  const hasPendingRequest = pendingClaimRequests.some(
    (r) => r.status === "pending"
  );

  async function handleSubmitClaim() {
    const amount = parseFloat(requestedAmount);
    if (!selectedBucket) return;
    if (!amount || amount <= 0) return;
    if (amount > selectedBucket.claimableAmountUSD + 0.01) return;

    if (!receivingWallet.match(/^0x[0-9a-fA-F]{40}$/)) {
      setSubmitError(t("referral.summary.invalidWallet"));
      return;
    }

    setSubmitting(true);
    setSubmitResult("idle");
    setSubmitError("");

    try {
      // 1. Get a signed nonce challenge from the server
      const nonceRes = await fetch(
        `/api/referral/claim-nonce?wallet=${encodeURIComponent(inviterWallet)}`
      );
      if (!nonceRes.ok) {
        const err = await nonceRes.json().catch(() => ({}));
        throw new Error(err.error || t("referral.summary.failedNonce"));
      }
      const { challengeToken, message } = await nonceRes.json();

      // 2. Ask the user to sign the message (EIP-191) via their wallet
      const signature = await signMessageAsync({
        account: (address ?? inviterWallet) as `0x${string}`,
        message,
      });

      // 3. Submit the signed claim to the server
      const submitRes = await fetch("/api/referral/submit-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: inviterWallet,
          signature,
          challengeToken,
          requestedAmountUSD: amount,
          receivingNetwork: selectedBucket.network,
          receivingWallet: receivingWallet.toLowerCase(),
          tokenAddress: selectedBucket.tokenAddress,
        }),
      });

      const result = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(result.error || "Submission failed.");
      }

      setSubmitResult("success");
      setShowForm(false);
      setRequestedAmount("");
      onClaimSubmitted?.();
    } catch (err: any) {
      // User rejected the signature — don't show as error
      if (err?.name === "UserRejectedRequestError" || err?.code === 4001) {
        setSubmitResult("idle");
      } else {
        setSubmitResult("error");
        setSubmitError(err?.message || t("referral.summary.submitFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6 animate-pulse space-y-3">
        <div className="h-4 w-28 bg-white/10 rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-ws-green" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {t("referral.summary.title")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard
          label={t("referral.summary.totalEarned")}
          value={`$${formatNumber(totalEarnedUSD, 2)}`}
          sub={t("referral.summary.totalEarnedSub")}
          accent={false}
        />
        <StatCard
          label={t("referral.summary.totalPaid")}
          value={`$${formatNumber(totalPaidUSD, 2)}`}
          sub={t("referral.summary.totalPaidSub")}
          accent={false}
        />
        <StatCard
          label={t("referral.summary.claimableNow")}
          value={`$${formatNumber(claimableAmountUSD, 2)}`}
          sub={t("referral.summary.claimableNowSub")}
          accent={claimableAmountUSD > 0}
        />
      </div>

      {/* Rate info */}
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-ws-green/5 border border-ws-green/15">
        <DollarSign className="w-3.5 h-3.5 text-ws-green shrink-0" />
        <p className="text-xs text-white/60">
          {t("referral.summary.rateInfoPrefix")}{" "}
          <span className="text-ws-green font-semibold">0.5%/month</span>{" "}
          {t("referral.summary.rateInfoSuffix")}
        </p>
      </div>

      {/* Pending notice */}
      {hasPendingRequest && (
        <div className="flex items-start gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/80">
            {t("referral.summary.pendingNotice")}
          </p>
        </div>
      )}

      {/* Success notice */}
      {submitResult === "success" && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-ws-green/10 border border-ws-green/20">
          <CheckCircle2 className="w-4 h-4 text-ws-green shrink-0" />
          <p className="text-xs text-ws-green">
            {t("referral.summary.successNotice")}
          </p>
        </div>
      )}

      {/* Error notice */}
      {submitResult === "error" && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">
            {submitError || t("referral.summary.submitFailed")}
          </p>
        </div>
      )}

      {/* Claim button / form */}
      {!hasPendingRequest && claimableAmountUSD > 0 && !showForm && (
        <button
          type="button"
          onClick={() => {
            if (selectedBucket) {
              setRequestedAmount(selectedBucket.claimableAmountUSD.toFixed(2));
            }
            setReceivingWallet(inviterWallet);
            setSubmitResult("idle");
            setShowForm(true);
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t("referral.summary.requestRewardClaim")}
        </button>
      )}

      {/* Claim form */}
      {showForm && (
        <div className="rounded-xl border border-ws-green/20 bg-ws-green/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-ws-green/80 uppercase tracking-wider">
            {t("referral.summary.claimRequest")}
          </p>

          {/* Amount */}
          {claimBuckets.length > 0 && (
            <div>
              <label className="block text-xs text-white/50 mb-1">
                Claim bucket
              </label>
              <select
                value={selectedBucketKey}
                onChange={(e) => {
                  setSelectedBucketKey(e.target.value);
                  const nextBucket = claimBuckets.find((bucket) => bucket.key === e.target.value);
                  if (nextBucket) {
                    setRequestedAmount(nextBucket.claimableAmountUSD.toFixed(2));
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white text-sm focus:border-ws-green focus:outline-none"
              >
                {claimBuckets.map((bucket) => (
                  <option key={bucket.key} value={bucket.key}>
                    {bucket.network} · {bucket.tokenSymbol ?? "Token"} · ${formatNumber(bucket.claimableAmountUSD, 2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-white/50 mb-1">
              {t("referral.summary.amountLabel", {
                max: `$${formatNumber(selectedBucket?.claimableAmountUSD ?? 0, 2)}`,
              })}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedBucket?.claimableAmountUSD ?? 0}
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white text-sm focus:border-ws-green focus:outline-none"
                placeholder={t("referral.summary.amountPlaceholder")}
              />
              <button
                type="button"
                onClick={() =>
                  setRequestedAmount((selectedBucket?.claimableAmountUSD ?? 0).toFixed(2))
                }
                className="px-3 py-2 rounded-lg border border-white/20 text-xs text-white/60 hover:border-ws-green hover:text-ws-green transition-colors"
              >
                {t("unstakeDialog.max")}
              </button>
            </div>
          </div>

          {/* Receiving network */}
          <div>
            <label className="block text-xs text-white/50 mb-1">
              {t("referral.summary.receivingNetwork")}
            </label>
            <div className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white/80 text-sm">
              {selectedBucket?.network ?? "—"} · {selectedBucket?.tokenSymbol ?? "—"}
            </div>
          </div>

          {/* Receiving wallet */}
          <div>
            <label className="block text-xs text-white/50 mb-1">
              {t("referral.summary.receivingWallet")}
            </label>
            <input
              type="text"
              value={receivingWallet}
              onChange={(e) => setReceivingWallet(e.target.value.trim())}
              placeholder={t("referral.summary.walletPlaceholder")}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white text-sm font-mono focus:border-ws-green focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-white/20 text-sm text-white/60 hover:border-white/40 transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmitClaim}
              disabled={
                submitting ||
                !requestedAmount ||
                parseFloat(requestedAmount) <= 0
              }
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                submitting
                  ? "bg-ws-green/40 text-white/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black hover:opacity-90"
              )}
            >
              {submitting ? t("referral.summary.submitting") : t("referral.summary.submitRequest")}
            </button>
          </div>
        </div>
      )}

      {claimableAmountUSD === 0 && totalEarnedUSD === 0 && (
        <p className="text-center text-sm text-white/35 py-2">
          {t("referral.summary.noRewardsYet")}
        </p>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  accent: boolean;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent
          ? "border-ws-green/30 bg-ws-green/8"
          : "border-white/10 bg-white/[0.03]"
      )}
    >
      <p className="text-xs text-white/45 mb-1">{label}</p>
      <p
        className={cn(
          "text-xl font-bold font-grotesk",
          accent ? "text-ws-green" : "text-white"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>
    </div>
  );
}
