import AuditCertificatePreview from "@/components/AuditCertificatePreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  openFullAuditReport,
} from "@/utils/auditReport";

type AuditCertificateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuditCertificateModal({
  open,
  onOpenChange,
}: AuditCertificateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-0.75rem)] max-w-[min(97vw,72rem)] max-h-[calc(100dvh-0.75rem)] overflow-hidden rounded-[20px] border border-white/15 bg-[#07100D] p-0 text-white sm:w-[min(95vw,72rem)] sm:rounded-[28px]">
        <div className="flex max-h-[calc(100dvh-0.75rem)] min-h-[calc(100dvh-0.75rem)] flex-col px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-4">
          <DialogHeader className="space-y-2 pr-9 text-left sm:pr-12">
            <DialogTitle className="text-lg font-bold leading-tight text-white sm:text-2xl">
              WStaking Audit Certificate
            </DialogTitle>
            <DialogDescription className="max-w-[56ch] text-xs leading-relaxed text-white/65 sm:text-sm">
              Review the official audit certificate here, or open the full audit
              report for the detailed findings and resolution notes.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-[18px] border border-[#22543E] bg-[#091612] shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:mt-4 sm:rounded-[20px]">
            <div className="flex h-full min-h-0 items-center justify-center bg-[#091612] p-2 sm:p-3">
              <AuditCertificatePreview fitViewport />
            </div>
          </div>

          <DialogFooter className="mt-3 gap-2 sm:mt-4 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={openFullAuditReport}
              className="h-10 w-full bg-[#48DC84] text-black hover:bg-[#3cc776] sm:w-auto"
            >
              View Full Report
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuditCertificateModal;
