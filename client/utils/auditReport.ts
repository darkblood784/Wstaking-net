export const AUDIT_REPORT_GITHUB_URL =
  "https://github.com/Credshields/audit-reports/blob/master/Whale_Venture_-_WStaking_Final_Audit_Report.pdf";

export const AUDIT_REPORT_PHONE_URL = "/WStaking_Final_Audit_Report.pdf";
export const AUDIT_REPORT_PDF_URL = "/WStaking_Final_Audit_Report.pdf";
export const AUDIT_CERTIFICATE_PDF_URL = "/Wstaking_Audit_Certificate.pdf";

export function isPhoneDevice() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent || "";
  const isTabletDevice =
    /iPad|Tablet|PlayBook|Silk/i.test(userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);
  const isPhoneUserAgent = /iPhone|Android.+Mobile|Windows Phone|Mobile/i.test(
    userAgent,
  );
  const isNarrowTouchScreen =
    window.matchMedia("(max-width: 767px)").matches &&
    window.matchMedia("(pointer: coarse)").matches;

  return !isTabletDevice && (isPhoneUserAgent || isNarrowTouchScreen);
}

export function canUseHoverPreview() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function getAuditReportUrl(
  desktopHref: string,
  mobileHref?: string,
) {
  if (mobileHref && isPhoneDevice()) {
    return mobileHref;
  }

  return desktopHref;
}

export function openAuditReport(
  desktopHref: string,
  mobileHref?: string,
) {
  if (typeof window === "undefined") return;

  const targetHref = getAuditReportUrl(desktopHref, mobileHref);
  window.open(targetHref, "_blank", "noopener,noreferrer");
}

export function openFullAuditReport() {
  if (typeof window === "undefined") return;
  window.open(AUDIT_REPORT_GITHUB_URL, "_blank", "noopener,noreferrer");
}
