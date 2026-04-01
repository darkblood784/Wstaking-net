import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Gift, ShieldCheck, Wallet } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ReferralCodeCard from "@/components/referral/ReferralCodeCard";
import RewardSummary from "@/components/referral/RewardSummary";
import InviteeList from "@/components/referral/InviteeList";
import ClaimHistory from "@/components/referral/ClaimHistory";
import type { ReferralDashboardData, ReferralDashboardResponse } from "@shared/referral";

export default function Referral() {
  const { address, isConnected } = useAccount();
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [dashboard, setDashboard] = useState<ReferralDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      if (!isConnected || !address) return;
      setCodeLoading(true);
      setDashboardLoading(true);
      setPageError("");

      try {
        const walletAddress = address.toLowerCase();
        const [codeRes, dashboardRes] = await Promise.all([
          fetch("/api/referral/get-or-create-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress }),
          }),
          fetch(`/api/referral/dashboard?wallet=${encodeURIComponent(walletAddress)}`),
        ]);

        const codeData = await codeRes.json().catch(() => ({}));
        const dashboardData = (await dashboardRes.json().catch(() => ({}))) as ReferralDashboardResponse;

        if (!codeRes.ok || !codeData.ok) {
          throw new Error(codeData.error || "Unable to load referral code.");
        }
        if (!dashboardRes.ok || !dashboardData.ok || !dashboardData.dashboard) {
          throw new Error(dashboardData.error || "Unable to load referral dashboard.");
        }
        if (active) {
          setReferralCode(codeData.code ?? null);
          setDashboard(dashboardData.dashboard);
        }
      } catch (error: any) {
        if (active) {
          setReferralCode(null);
          setDashboard(null);
          setPageError(error?.message || "Unable to load referral code.");
        }
      } finally {
        if (active) {
          setCodeLoading(false);
          setDashboardLoading(false);
        }
      }
    }

    void loadPageData();
    return () => {
      active = false;
    };
  }, [address, isConnected]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("referral.page.backToHome")}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ws-green/10 border border-ws-green/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-ws-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-grotesk text-white">
              {t("referral.page.title")}
            </h1>
            <p className="text-sm text-white/45">
              {t("referral.page.subtitle")}
            </p>
          </div>
        </div>

        {!isConnected && (
          <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-10 text-center">
            <Wallet className="w-10 h-10 text-white/25 mx-auto mb-3" />
            <p className="text-white/60 mb-1">
              {t("referral.page.connectWalletPrompt")}
            </p>
            <p className="text-xs text-white/35">
              {t("referral.page.connectWalletHint")}
            </p>
          </div>
        )}

        {isConnected && address && (
          <div className="space-y-4">
            <ReferralCodeCard
              code={referralCode}
              walletAddress={address}
              isLoading={codeLoading}
              onCodeConfirmed={(code) => {
                setReferralCode(code);
                setPageError("");
              }}
              onSubmitCode={async (code, signature, challengeToken) => {
                const res = await fetch("/api/referral/set-custom-code", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    walletAddress: address.toLowerCase(),
                    code,
                    signature,
                    challengeToken,
                  }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) {
                  throw new Error(data.error || "Failed to save referral code.");
                }
                setReferralCode(data.code ?? code);
              }}
            />

            <RewardSummary
              inviterWallet={address.toLowerCase()}
              totalEarnedUSD={dashboard?.totalEarnedUSD ?? 0}
              totalPaidUSD={dashboard?.totalPaidUSD ?? 0}
              claimableAmountUSD={dashboard?.claimableAmountUSD ?? 0}
              claimBuckets={dashboard?.claimBuckets ?? []}
              pendingClaimRequests={dashboard?.pendingClaimRequests ?? []}
              isLoading={dashboardLoading}
              onClaimSubmitted={async () => {
                if (!address) return;
                setDashboardLoading(true);
                try {
                  const res = await fetch(
                    `/api/referral/dashboard?wallet=${encodeURIComponent(address.toLowerCase())}`,
                  );
                  const data = (await res.json().catch(() => ({}))) as ReferralDashboardResponse;
                  if (!res.ok || !data.ok || !data.dashboard) {
                    throw new Error(data.error || "Unable to refresh referral dashboard.");
                  }
                  setDashboard(data.dashboard);
                  setPageError("");
                } catch (error: any) {
                  setPageError(error?.message || "Unable to refresh referral dashboard.");
                } finally {
                  setDashboardLoading(false);
                }
              }}
            />

            <InviteeList
              invitees={dashboard?.invitees ?? []}
              isLoading={dashboardLoading}
            />

            <ClaimHistory
              claimRequests={dashboard?.pendingClaimRequests ?? []}
              payoutHistory={dashboard?.payoutHistory ?? []}
              isLoading={dashboardLoading}
            />

            {pageError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200/80">
                {pageError}
              </div>
            )}

            <div className="rounded-2xl border border-ws-card-border bg-white/[0.03] p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-ws-green" />
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Secure Migration
                </p>
              </div>
              <p className="text-sm text-white/65 leading-6">
                Referral reward dashboards, invitee analytics, and claim history are being moved
                behind backend-owned APIs so client bundles no longer expose referral calculation
                logic or load blocked Firestore paths.
              </p>
              <p className="text-xs text-white/40 mt-3">
                Your referral code management remains available here through signed backend routes.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
