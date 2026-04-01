import { useTranslation } from "react-i18next";
import { useSystemDetails } from "@/contexts/SystemDetailsContext";
import { cn } from "@/lib/utils";

type TotalStakedBadgeProps = {
  variant?: "hero" | "compact" | "nav";
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

const formatUsd = (value: string) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(numeric);
};

export function TotalStakedBadge({
  variant = "hero",
  className,
  labelClassName,
  valueClassName,
}: TotalStakedBadgeProps) {
  const { totalStaked } = useSystemDetails();
  const { t } = useTranslation();
  const isCompact = variant === "compact";
  const isNav = variant === "nav";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 border-[#0D3626] bg-[#06130E] backdrop-blur-sm",
        isCompact ? "px-4 py-1.5" : "px-6 py-2",
        isNav && "px-5 py-2.5 gap-3",
        className,
      )}
    >
      <svg
        width={isCompact ? 18 : isNav ? 22 : 23}
        height={isCompact ? 26 : isNav ? 30 : 33}
        viewBox="0 0 23 33"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.38892 15.6665L6.38892 23.3332"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.5 18.2222V23.3333"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.6111 13.1111V23.3333"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect y="8" width="23" height="20.4444" rx="2" stroke="#34D399" strokeWidth="2" />
      </svg>
      <span
        className={cn(
          "text-ws-green font-inter tracking-tight",
          isCompact
            ? "text-xs"
            : isNav
              ? "text-sm md:text-sm md:font-semibold"
              : "text-sm md:text-xl",
          labelClassName,
        )}
      >
        {t("hero.totalStaked")}
      </span>
      <span
        className={cn(
          "text-white font-inter font-bold italic",
          isCompact
            ? "text-sm"
            : isNav
              ? "text-lg md:text-base md:font-semibold md:not-italic"
              : "text-lg md:text-3xl",
          valueClassName,
        )}
      >
        {totalStaked ? `${formatUsd(totalStaked)} USD` : t("common.placeholder")}
      </span>
    </div>
  );
}
