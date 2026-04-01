import { useState } from "react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import binanceLogo from "@/assets/partner-exchanges/Binance.png";
import bingxLogo from "@/assets/partner-exchanges/BingX.png";
import bitmartLogo from "@/assets/partner-exchanges/Bitmart.png";
import btccLogo from "@/assets/partner-exchanges/Btcc.png";
import lbankLogo from "@/assets/partner-exchanges/Lbank.png";
import mexcLogo from "@/assets/partner-exchanges/MEXC.png";
import okxLogo from "@/assets/partner-exchanges/OKX.png";
import ourbitLogo from "@/assets/partner-exchanges/Ourbit.png";
import pionexLogo from "@/assets/partner-exchanges/Pionex.png";

export function PartnerExchanges() {
  const { t } = useTranslation();
  const tutorialUrl =
    import.meta.env.VITE_TUTORIAL_URL ||
    "https://www.instagram.com/reel/DUp-UkMiDft/?utm_source=ig_web_button_share_sheet";
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; label: string } | null>(
    null
  );
  const partners = [
    {
      name: "OKX",
      logo: okxLogo,
      href: "https://okx.com/join/WSTAKING",
      rebate: "20%",
    },
    {
      name: "Pionex",
      logo: pionexLogo,
      href: "https://partner.pionex.com/p/WSTAKING",
      rebate: "20%",
    },
    {
      name: "Binance",
      logo: binanceLogo,
      href: "https://accounts.binance.com/register?ref=WSTAKING",
      rebate: "20%",
    },
    {
      name: "BingX",
      logo: bingxLogo,
      href: "https://bingxdao.com/invite/DTAPTFEK/",
      rebate: "25%",
    },
    {
      name: "MEXC",
      logo: mexcLogo,
      href: "https://www.mexc.com/zh-TW/acquisition/custom-sign-up?shareCode=mexc-WSTAKING",
      rebate: "20%",
    },
    {
      name: "Ourbit",
      logo: ourbitLogo,
      href: "https://www.ourbit.com/zh-TW/register?inviteCode=WSTAKING",
      rebate: "40%",
    },
    {
      name: "BTCC",
      logo: btccLogo,
      href: "https://www.btcc.com/zh-TW/register?inviteCode=WSTAKING&utm_source=kol",
      rebate: "40%",
    },
    {
      name: "BitMart",
      logo: bitmartLogo,
      href: "https://www.bitmart.com/invite/WSTAKING",
      rebate: "30%",
    },
    {
      name: "LBANK",
      logo: lbankLogo,
      href: "https://lbank.com/ref/WSTAKING",
      rebate: "30%",
    },
  ];
  const flowItems = [
    { label: t("partners.flow.exchange"), highlight: true },
    { label: t("partners.flow.transfer") },
    { label: t("partners.flow.wallet"), highlight: true },
    { label: t("partners.flow.link") },
    { label: t("partners.flow.dapp"), highlight: true },
  ];

  return (
    <section className="pt-4 sm:pt-5 md:pt-6 pb-0 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8 md:mb-12">
          <div className="flex justify-center">
            <h2 className="text-white text-center text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-inter font-bold">
              {t("partners.title")}
            </h2>
          </div>
          <p className="mt-2 text-center text-white/70 text-base sm:text-lg md:text-xl lg:text-2xl font-inter max-w-5xl mx-auto">
            {t("partners.subtitle")}
          </p>
        </div>

        <div className="mx-auto max-w-6xl grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-y-6 gap-x-6 sm:gap-x-8 place-items-center justify-items-center lg:hidden">
          {partners.map((partner) => {
            const content = (
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-8 sm:h-9 md:h-12 w-auto opacity-95 hover:opacity-100 transition-opacity"
              />
            );

            const commonProps = {
              onMouseMove: (event: MouseEvent) =>
                  setHoverInfo({
                    x: event.clientX,
                    y: event.clientY + 16,
                    label: t("partners.tradingFeeRebate", { rebate: partner.rebate }),
                  }),
              onMouseLeave: () => setHoverInfo(null),
              className: "w-full flex items-center justify-center",
              "aria-label": `${partner.name} ${partner.rebate}`,
            };

            return partner.href ? (
              <a
                key={partner.name}
                href={partner.href}
                target="_blank"
                rel="noreferrer"
                {...commonProps}
              >
                {content}
              </a>
            ) : (
              <div key={partner.name} {...commonProps}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-8">
          {[partners.slice(0, 5), partners.slice(5)].map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex items-center justify-center gap-10">
              {row.map((partner) => {
                const content = (
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    className="h-16 w-auto opacity-95 hover:opacity-100 transition-opacity"
                  />
                );

                const commonProps = {
                  onMouseMove: (event: MouseEvent) =>
                    setHoverInfo({
                      x: event.clientX,
                      y: event.clientY + 16,
                      label: t("partners.tradingFeeRebate", { rebate: partner.rebate }),
                    }),
                  onMouseLeave: () => setHoverInfo(null),
                  className: "flex items-center justify-center",
                  "aria-label": `${partner.name} ${partner.rebate}`,
                };

                return partner.href ? (
                  <a
                    key={partner.name}
                    href={partner.href}
                    target="_blank"
                    rel="noreferrer"
                    {...commonProps}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={partner.name} {...commonProps}>
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-12 rounded-[24px] md:rounded-[32px] border border-ws-card-border md:border-2 bg-transparent px-4 sm:px-6 md:px-12 lg:px-16 py-5 sm:py-7 md:py-10">
          <h3 className="text-white text-center text-xl sm:text-2xl md:text-[33px] font-inter font-semibold mb-4 sm:mb-5 md:mb-6">
            {t("partners.flow.title")}
          </h3>
          <div className="flex flex-nowrap sm:flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 mt-3 sm:mt-5 md:mt-12">
            {flowItems.map((item, index) => (
              <div key={item.label} className="flex items-center gap-2 sm:gap-4">
                {item.highlight ? (
                  <span className="px-3 sm:px-5 md:px-7 lg:px-9 py-1 sm:py-2 md:py-2.5 rounded-2xl border border-[#1EDC83]/70 bg-gradient-to-b from-[#0F2A20] via-[#0B1B16] to-[#08110E] text-[10px] sm:text-sm md:text-xl lg:text-2xl font-inter text-white shadow-[0_10px_24px_rgba(0,0,0,0.45)] ring-1 ring-[#16C97A]/25 whitespace-nowrap">
                    {item.label}
                  </span>
                ) : (
                  <span className="text-white/70 text-[10px] sm:text-sm md:text-xl lg:text-2xl font-inter whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {index < flowItems.length - 1 && (
                  <span className="text-white/50 text-[10px] sm:text-base md:text-lg whitespace-nowrap">-&gt;</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 sm:mt-7 md:mt-8 text-center">
          <p className="text-white/70 text-sm sm:text-base md:text-lg font-inter">
            <span>{t("partners.tutorialPrompt")} </span>
            <a
              href={tutorialUrl}
              target="_blank"
              rel="noreferrer"
              className="text-ws-green font-medium hover:underline"
            >
              {t("partners.tutorialLink")}
            </a>
          </p>
        </div>

        {hoverInfo && (
          <div
            className="pointer-events-none fixed z-50 rounded-md border border-[#1f2a25] bg-black/90 px-2 py-1 text-xs text-white shadow-lg"
            style={{ left: hoverInfo.x, top: hoverInfo.y, transform: "translateX(-50%)" }}
          >
            {hoverInfo.label}
          </div>
        )}
      </div>
    </section>
  );
}
