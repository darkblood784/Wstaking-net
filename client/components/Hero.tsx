import { Trans, useTranslation } from "react-i18next";
import { TotalStakedBadge } from "@/components/TotalStakedBadge";
import { cn } from "@/lib/utils";

type HeroProps = {
  showTotalStaked?: boolean;
  isCompact?: boolean;
};

export function Hero({ showTotalStaked = true, isCompact = false }: HeroProps) {
  const { t } = useTranslation();
  return (
    <section className="relative pt-24 sm:pt-28 md:pt-[8.5rem] lg:pt-[8.75rem] pb-10 md:pb-20 px-4 overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute left-[10%] top-[20%] w-[300px] h-[300px] md:w-[625px] md:h-[625px] opacity-15 pointer-events-none">
        <svg
          viewBox="0 0 1913 1677"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_hero)">
            <ellipse
              cx="1074.19"
              cy="838.089"
              rx="594.577"
              ry="591.984"
              transform="rotate(-47.8358 1074.19 838.089)"
              fill="#48DC84"
            />
          </g>
          <g filter="url(#filter1_f_hero)">
            <ellipse
              cx="711.981"
              cy="860.349"
              rx="503.382"
              ry="566.922"
              transform="rotate(-28.2987 711.981 860.349)"
              fill="#27C681"
            />
          </g>
          <g
            filter="url(#filter2_f_hero)"
            style={{ mixBlendMode: "color-dodge" }}
          >
            <ellipse
              cx="1074.08"
              cy="597.279"
              rx="480.212"
              ry="538.433"
              transform="rotate(-77.9924 1074.08 597.279)"
              fill="#15BA81"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_hero"
              x="118.068"
              y="-118.295"
              width="1912.25"
              height="1912.77"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="181.484"
                result="effect1_foregroundBlur_hero"
              />
            </filter>
            <filter
              id="filter1_f_hero"
              x="-324.962"
              y="-211.584"
              width="2073.89"
              height="2143.87"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="259.263"
                result="effect1_foregroundBlur_hero"
              />
            </filter>
            <filter
              id="filter2_f_hero"
              x="19.4099"
              y="-404.235"
              width="2109.34"
              height="2003.03"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"
              />
              <feGaussianBlur
                stdDeviation="259.263"
                result="effect1_foregroundBlur_hero"
              />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="mb-4 h-[40px] sm:mb-5 sm:h-[72px] md:mb-4 md:h-[16px] lg:mb-4 lg:h-[18px]" />


        {/* Total Staked Badge */}
        {showTotalStaked && (
          <div
            className={cn(
              "mb-8 transition-all duration-300 ease-out",
              isCompact ? "opacity-0 -translate-y-3" : "opacity-100 translate-y-0",
            )}
          >
            <TotalStakedBadge />
          </div>
        )}

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[110px] font-bold leading-none mb-4 sm:mb-6 md:mb-8">
          <span className="text-white">W</span>
          <span className="bg-gradient-to-r from-[#36D498] via-[#4ADD81] to-[#14BA81] bg-clip-text text-transparent">
            {t("hero.brand")}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-ws-gray text-sm sm:text-base md:text-2xl lg:text-3xl font-normal max-w-5xl mx-auto mb-6 sm:mb-8 md:mb-12 leading-relaxed">
          <Trans
            i18nKey="hero.subtitle"
            components={{
              1: <span className="text-ws-green" />,
              3: <span className="text-ws-green" />,
              5: <span className="text-ws-green" />,
            }}
          />
        </p>

        {/* CTA Button and Stats */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-8 mb-8 md:mb-10">
          <button
            className="w-auto min-w-[220px] sm:min-w-[240px] px-6 sm:px-8 md:px-12 py-2.5 sm:py-3 md:py-4 rounded-full bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black text-base sm:text-lg md:text-2xl font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
            onClick={() => {
              const el = document.getElementById("start-staking");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            {t("hero.startNow")}
          </button>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm md:text-xl text-ws-gray">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-ws-green" />
              {t("hero.apyRange")}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-ws-green" />
              {t("hero.supportedTokens")}
            </span>
          </div>
        </div>

        {/* Network Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
          <span className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-2xl bg-[#0F1110] border border-ws-card-border md:border-2 text-white font-inter text-xs sm:text-sm md:text-base font-medium">
            Base
          </span>
          <span className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-2xl bg-[#0F1110] border border-ws-card-border md:border-2 text-white font-inter text-xs sm:text-sm md:text-base font-medium">
            Xlayer
          </span>
          <span className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-2xl bg-[#0F1110] border border-ws-card-border md:border-2 text-white font-inter text-xs sm:text-sm md:text-base font-medium">
            BSC
          </span>
        </div>
      </div>
    </section>
  );
}
