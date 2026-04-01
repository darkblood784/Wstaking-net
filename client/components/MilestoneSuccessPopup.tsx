import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import credShieldsWhite from "@/assets/images/CredShields-White.svg";
import AuditCertificateModal from "@/components/AuditCertificateModal";
import AuditCertificatePreview from "@/components/AuditCertificatePreview";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  canUseHoverPreview,
} from "@/utils/auditReport";

const ANNOUNCEMENT_ID = "1m-staked-credshields-audit";
const POPUP_CUTOFF_DATE = "2026-07-31T23:59:59Z";
const DISMISS_KEY_REV = "2026-03-20-launch";

type MilestoneSuccessPopupProps = {
  onOpenStateChange?: (open: boolean) => void;
};

export function MilestoneSuccessPopup({
  onOpenStateChange,
}: MilestoneSuccessPopupProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCertificatePreviewVisible, setIsCertificatePreviewVisible] = useState(false);

  const dismissKey = useMemo(
    () => `wstaking:milestone-popup-dismissed:${ANNOUNCEMENT_ID}:${DISMISS_KEY_REV}`,
    [],
  );
  const hoverPreviewEnabled = useMemo(() => canUseHoverPreview(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cutoff = new Date(POPUP_CUTOFF_DATE).getTime();
    if (Date.now() > cutoff) {
      setOpen(false);
      return;
    }
    const dismissed = window.localStorage.getItem(dismissKey) === "1";
    setOpen(!dismissed);
  }, [dismissKey]);

  useEffect(() => {
    onOpenStateChange?.(open);
  }, [onOpenStateChange, open]);

  const persistDismissIfNeeded = () => {
    if (typeof window === "undefined") return;
    if (dontShowAgain) {
      window.localStorage.setItem(dismissKey, "1");
    }
  };

  const handleClose = () => {
    persistDismissIfNeeded();
    setOpen(false);
  };

  const handleStartStaking = () => {
    persistDismissIfNeeded();
    setOpen(false);
    if (typeof window === "undefined") return;
    const el = document.getElementById("start-staking");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleOpenAuditReport = () => {
    setIsCertificateModalOpen(true);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[calc(env(safe-area-inset-top)+5rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5.5rem)] w-[calc(100vw-1rem)] max-w-[560px] translate-y-0 overflow-y-auto rounded-[24px] border border-white/20 bg-[#09110E] p-0 text-white [&>button]:z-10 sm:top-[50%] sm:max-h-[85vh] sm:w-[92vw] sm:translate-y-[-50%] sm:overflow-visible sm:rounded-2xl">
        <div className="relative px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="pointer-events-none absolute inset-x-8 top-4 h-24 rounded-full bg-[radial-gradient(circle,rgba(72,220,132,0.26)_0%,rgba(72,220,132,0.12)_42%,rgba(72,220,132,0)_78%)] blur-2xl" />

          <DialogHeader className="relative space-y-3 text-left">
            <div className="inline-flex w-fit items-center rounded-full border border-[#2D7A5A] bg-[#0F2B21] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#48DC84]">
              {t("milestonePopup.badge")}
            </div>

            <div
              className="relative inline-flex w-fit"
              onMouseEnter={() => {
                if (!hoverPreviewEnabled) return;
                setIsCertificatePreviewVisible(true);
              }}
              onMouseLeave={() => {
                if (!hoverPreviewEnabled) return;
                setIsCertificatePreviewVisible(false);
              }}
            >
              <button
                type="button"
                onClick={handleOpenAuditReport}
                aria-label={t("milestonePopup.auditReportCta", {
                  defaultValue: "View audit report",
                })}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#215340] bg-[#0B1E17] px-3 py-2 transition-colors hover:border-[#2E7358] hover:bg-[#11261d]"
              >
                <img
                  src={credShieldsWhite}
                  alt="CredShields"
                  className="h-4 w-auto object-contain sm:h-5"
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-[11px]">
                  {t("milestonePopup.auditPill")}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-white/55" />
              </button>
              {hoverPreviewEnabled && isCertificatePreviewVisible && (
                <div className="absolute left-0 top-full z-[220] mt-4 hidden w-[min(70vw,340px)] overflow-hidden rounded-[22px] border border-[#2A7551] bg-[#07100D] shadow-[0_28px_80px_rgba(0,0,0,0.56)] md:block">
                  <div className="border-b border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                    Audit Certificate Preview
                  </div>
                  <div className="bg-[#07100D] p-2">
                    <AuditCertificatePreview compact />
                  </div>
                </div>
              )}
            </div>

            <DialogTitle className="max-w-[18ch] text-xl font-bold leading-tight sm:text-3xl">
              {t("milestonePopup.title")}
            </DialogTitle>
            <DialogDescription className="max-w-[48ch] text-sm leading-relaxed text-white/75 sm:text-base">
              {t("milestonePopup.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-5 grid gap-2.5 text-sm text-white/90 sm:text-[15px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="font-semibold text-[#48DC84]">1M+ </span>
              {t("milestonePopup.point1")}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              {t("milestonePopup.point2")}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              {t("milestonePopup.point3")}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              {t("milestonePopup.point4")}
            </div>
          </div>

          <div className="relative mt-4 flex items-center gap-2 pt-1">
            <Checkbox
              id="milestone-dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label htmlFor="milestone-dont-show" className="text-sm text-white/90">
              {t("milestonePopup.dontShowAgain")}
            </Label>
          </div>

          <DialogFooter className="relative mt-5 gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-10 w-full border-white/25 bg-transparent text-white hover:bg-white/10 sm:w-auto"
            >
              {t("milestonePopup.close")}
            </Button>
            <Button
              type="button"
              onClick={handleStartStaking}
              className="h-10 w-full bg-[#48DC84] text-black hover:bg-[#3cc776] sm:w-auto"
            >
              {t("milestonePopup.primaryCta")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    <AuditCertificateModal
      open={isCertificateModalOpen}
      onOpenChange={setIsCertificateModalOpen}
    />
    </>
  );
}

export default MilestoneSuccessPopup;
