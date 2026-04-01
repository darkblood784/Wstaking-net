import { cn } from "@/lib/utils";

type AuditCertificatePreviewProps = {
  className?: string;
  compact?: boolean;
  fitViewport?: boolean;
};

const certificatePreviewImage = "/Wstaking_Audit_Certificate_page-0001.jpg";

export function AuditCertificatePreview({
  className,
  compact = false,
  fitViewport = false,
}: AuditCertificatePreviewProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[18px] border border-[#2C7A54] bg-[#07100D] shadow-[0_26px_70px_rgba(0,0,0,0.4)]",
        fitViewport ? "h-full" : "aspect-[0.707/1]",
        className,
      )}
    >
      <img
        src={certificatePreviewImage}
        alt="WStaking audit certificate"
        className={cn(
          "h-full w-full object-contain",
          compact ? "scale-[0.985]" : "scale-100",
          fitViewport && "max-h-full max-w-full",
        )}
      />
    </div>
  );
}

export default AuditCertificatePreview;
