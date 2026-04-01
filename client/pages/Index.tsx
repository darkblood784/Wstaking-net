import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PromoCard } from "@/components/PromoCard";
import { SecurityAuditShowcase } from "@/components/SecurityAuditShowcase";
import { HowWeEarn } from "@/components/HowWeEarn";
import { PartnerExchanges } from "@/components/PartnerExchanges";
import { StartStaking } from "@/components/StartStaking";
import ActiveStakes from "@/components/ActiveStakes/ActiveStakes";
import { Community } from "@/components/Community";
import { CredShieldsAuditBadge } from "@/components/CredShieldsAuditBadge";
import { Footer } from "@/components/Footer";
import { MilestoneSuccessPopup } from "@/components/MilestoneSuccessPopup";
import { Seo } from "@/components/Seo";
import { VersionUpgradePopup } from "@/components/VersionUpgradePopup";
import {
  AUDIT_REPORT_GITHUB_URL,
  AUDIT_REPORT_PHONE_URL,
} from "@/utils/auditReport";
import { useEffect, useRef, useState } from "react";

export default function Index() {
  const [isCompactHeader, setIsCompactHeader] = useState(false);
  const [isMilestonePopupOpen, setIsMilestonePopupOpen] = useState(false);
  const rafRef = useRef<number | null>(null);
  const isCompactRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const nextCompact = isCompactRef.current ? y > 80 : y > 140;
        if (nextCompact !== isCompactRef.current) {
          isCompactRef.current = nextCompact;
          setIsCompactHeader(nextCompact);
        }
        rafRef.current = null;
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Seo
        title="WStaking - Maximize Your Crypto Earnings"
        description="Maximize your crypto earnings with AI-powered trading strategies across Base, XLayer, and BSC."
        path="/"
      />
      <Header
        compactNav={isCompactHeader}
        showTotalStaked
      />
      <CredShieldsAuditBadge
        href={AUDIT_REPORT_GITHUB_URL}
        mobileHref={AUDIT_REPORT_PHONE_URL}
        theme="dark"
        className={
          isMilestonePopupOpen || isCompactHeader
            ? "fixed left-1/2 top-[calc(env(safe-area-inset-top)+5rem)] z-[120] hidden max-w-[calc(100vw-2rem)] -translate-x-1/2 md:top-[5.1rem] md:inline-flex"
            : "fixed left-1/2 top-[calc(env(safe-area-inset-top)+5rem)] z-[120] max-w-[calc(100vw-2rem)] -translate-x-1/2 md:top-[5.1rem]"
        }
      />
      <CredShieldsAuditBadge
        href={AUDIT_REPORT_GITHUB_URL}
        mobileHref={AUDIT_REPORT_PHONE_URL}
        theme="dark"
        variant="compact"
        className={
          isMilestonePopupOpen || !isCompactHeader
            ? "fixed right-4 top-[calc(env(safe-area-inset-top)+5.15rem)] z-[176] pointer-events-none opacity-0 translate-x-3 transition-[opacity,transform] duration-300 ease-out md:hidden"
            : "fixed right-4 top-[calc(env(safe-area-inset-top)+5.15rem)] z-[176] opacity-100 translate-x-0 transition-[opacity,transform] duration-300 ease-out md:hidden"
        }
      />
      <MilestoneSuccessPopup onOpenStateChange={setIsMilestonePopupOpen} />
      <VersionUpgradePopup />
      <main>
        <Hero showTotalStaked isCompact={isCompactHeader} />
        <PromoCard />
        <SecurityAuditShowcase />
        <HowWeEarn />
        <PartnerExchanges />
        <StartStaking />
        <ActiveStakes />
        <Community />
      </main>
      <Footer />
    </div>
  );
}
