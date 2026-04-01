import credShieldsBlack from "@/assets/images/CredShields-black.svg";
import credShieldsWhite from "@/assets/images/CredShields-White.svg";
import AuditCertificateModal from "@/components/AuditCertificateModal";
import AuditCertificatePreview from "@/components/AuditCertificatePreview";
import { cn } from "@/lib/utils";
import { canUseHoverPreview } from "@/utils/auditReport";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

type CredShieldsAuditBadgeProps = {
  href: string;
  mobileHref?: string;
  theme?: "dark" | "light";
  variant?: "default" | "compact";
  className?: string;
};

export function CredShieldsAuditBadge({
  href,
  mobileHref,
  theme = "dark",
  variant = "default",
  className,
}: CredShieldsAuditBadgeProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark ? credShieldsWhite : credShieldsBlack;
  const isCompact = variant === "compact";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const hoverPreviewEnabled = useMemo(() => canUseHoverPreview(), []);

  useEffect(() => {
    if (!isModalOpen) return;
    setIsPreviewVisible(false);
  }, [isModalOpen]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsModalOpen(true);
  };

  const handleMouseEnter = () => {
    if (!hoverPreviewEnabled) return;
    setIsPreviewVisible(true);
  };

  const handleMouseLeave = () => {
    if (!hoverPreviewEnabled) return;
    setIsPreviewVisible(false);
  };

  if (isCompact) {
    return (
      <>
      <div
        className={cn("relative inline-flex", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute -inset-x-2 -inset-y-1 rounded-[22px] bg-[radial-gradient(circle,rgba(88,255,147,0.5)_0%,rgba(88,255,147,0.18)_48%,rgba(88,255,147,0)_80%)] blur-lg" />
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={handleClick}
          aria-label="Open CredShields audit"
          className={cn(
            "relative inline-flex items-center justify-center overflow-hidden rounded-[18px] border px-3.5 py-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.28),0_0_20px_rgba(88,255,147,0.14)] transition-all duration-300 hover:-translate-y-0.5",
            isDark
              ? "border-[#2A7551] bg-[linear-gradient(135deg,rgba(5,16,12,0.98),rgba(10,41,27,0.98)_52%,rgba(7,26,18,0.98))] backdrop-blur-md"
              : "border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,255,244,0.92))] backdrop-blur-md",
          )}
        >
          <div className="absolute inset-[1px] rounded-[17px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
          <img
            src={logoSrc}
            alt=""
            aria-hidden="true"
            className="relative h-5 w-auto object-contain"
          />
        </a>
        {hoverPreviewEnabled && isPreviewVisible && (
          <div className="absolute right-0 top-full z-[190] mt-4 hidden w-[min(70vw,320px)] overflow-hidden rounded-[22px] border border-[#2A7551] bg-[#07100D] shadow-[0_26px_70px_rgba(0,0,0,0.55)] md:block">
            <div className="border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
              Audit Certificate Preview
            </div>
            <div className="bg-[#07100D] p-2">
              <AuditCertificatePreview compact />
            </div>
          </div>
        )}
      </div>
      <AuditCertificateModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </>
    );
  }

  const badgeContent = (
    <>
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-2xl border px-3 py-2 sm:px-4 sm:py-2.5",
          isDark
            ? "border-[#56E88D]/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "border-black/10 bg-black/[0.04]",
        )}
      >
        <div className="absolute inset-[1px] rounded-[15px] bg-[linear-gradient(180deg,rgba(88,255,147,0.08),rgba(88,255,147,0))]" />
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="relative h-5 w-auto object-contain sm:h-6"
        />
      </span>
      <span className="flex min-w-0 flex-col justify-center">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "text-[9px] font-semibold uppercase tracking-[0.28em] sm:text-[10px]",
              isDark ? "text-[#A6D4BA]" : "text-black/55",
            )}
          >
            Smart Contract
          </span>
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              isDark
                ? "bg-[#6CFFA3] shadow-[0_0_18px_rgba(108,255,163,0.95)]"
                : "bg-[#14BA81] shadow-[0_0_14px_rgba(20,186,129,0.55)]",
            )}
          />
        </span>
        <span
          className={cn(
            "mt-1 text-[13px] font-bold uppercase tracking-[0.05em] sm:text-[15px]",
            isDark ? "text-white" : "text-black",
          )}
        >
          Audited by CredShields
        </span>
      </span>
    </>
  );

  return (
    <>
    <div
      className={cn(
        "relative inline-flex w-max max-w-full",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute -inset-x-2 inset-y-0 rounded-full bg-[radial-gradient(circle,rgba(88,255,147,0.88)_0%,rgba(88,255,147,0.3)_32%,rgba(88,255,147,0.1)_55%,rgba(88,255,147,0)_78%)] blur-[20px]" />
      <div className="absolute inset-x-8 -top-1 h-7 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_78%)] blur-xl" />
      <div className="absolute -inset-x-1 -inset-y-1 rounded-full border border-[#58FF93]/20 opacity-80 blur-sm" />
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        aria-label="Open CredShields audit"
        className={cn(
          "relative flex items-center gap-3 overflow-hidden rounded-[26px] border px-3.5 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.34),0_0_28px_rgba(88,255,147,0.18)] transition-all duration-300 sm:gap-4 sm:px-4.5",
          "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.4),0_0_38px_rgba(88,255,147,0.24)]",
          isDark
            ? "border-[#2A7551] bg-[linear-gradient(135deg,rgba(5,16,12,0.98),rgba(10,41,27,0.98)_52%,rgba(7,26,18,0.98))] backdrop-blur-md"
            : "border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,255,244,0.92))] backdrop-blur-md",
        )}
      >
        <div className="absolute inset-[1px] rounded-[25px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
        <div className="absolute right-0 top-0 h-full w-20 bg-[linear-gradient(120deg,rgba(88,255,147,0)_0%,rgba(88,255,147,0.06)_55%,rgba(255,255,255,0.1)_100%)]" />
        {badgeContent}
      </a>
      {hoverPreviewEnabled && isPreviewVisible && (
        <div className="absolute left-1/2 top-full z-[190] mt-4 hidden w-[min(70vw,360px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#2A7551] bg-[#07100D] shadow-[0_28px_80px_rgba(0,0,0,0.56)] md:block">
          <div className="border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
            Audit Certificate Preview
          </div>
          <div className="bg-[#07100D] p-2">
            <AuditCertificatePreview compact />
          </div>
        </div>
      )}
    </div>
    <AuditCertificateModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

export default CredShieldsAuditBadge;
