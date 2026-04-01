import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VERSION = "1.5";
const POPUP_CUTOFF_DATE = "2026-03-01T23:59:59Z";
const DISMISS_KEY_REV = "2026-02-25-reset";

export function VersionUpgradePopup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const dismissKey = useMemo(
    () => `wstaking:version-upgrade-dismissed:${VERSION}:${DISMISS_KEY_REV}`,
    [],
  );

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

  const persistDismissIfNeeded = () => {
    if (typeof window === "undefined") return;
    if (dontShowAgain) {
      window.localStorage.setItem(dismissKey, "1");
    }
  };

  const handleCancel = () => {
    persistDismissIfNeeded();
    setOpen(false);
  };

  const handleKnowMore = () => {
    persistDismissIfNeeded();
    setOpen(false);
    navigate(`/version?selected=${VERSION}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[92vw] max-w-[520px] rounded-2xl border border-white/20 bg-[#0A0E13] p-5 text-white sm:p-6">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-flex w-fit items-center rounded-full border border-[#2D7A5A] bg-[#0F2B21] px-3 py-1 text-xs font-semibold text-[#48DC84]">
            {t("upgradePopup.versionBadge", { version: VERSION })}
          </div>
          <DialogTitle className="text-xl font-bold leading-tight sm:text-2xl">
            {t("upgradePopup.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/75 sm:text-base">
            {t("upgradePopup.description", { version: VERSION })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-white/90 sm:text-[15px]">
          <p>- {t("upgradePopup.point1")}</p>
          <p>- {t("upgradePopup.point2")}</p>
          <p>- {t("upgradePopup.point3")}</p>
          <p>- {t("upgradePopup.point4")}</p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="upgrade-dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label htmlFor="upgrade-dont-show" className="text-sm text-white/90">
            {t("upgradePopup.dontShowAgain")}
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-10 w-full border-white/25 bg-transparent text-white hover:bg-white/10 sm:w-auto"
          >
            {t("upgradePopup.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleKnowMore}
            className="h-10 w-full bg-[#48DC84] text-black hover:bg-[#3cc776] sm:w-auto"
          >
            {t("upgradePopup.knowMore")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
