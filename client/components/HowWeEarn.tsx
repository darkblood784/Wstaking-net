import { useTranslation } from "react-i18next";
import profitFlowPreview from "@/assets/images/profit-flow-preview.jpg";

export function HowWeEarn() {
  const { t } = useTranslation();
  return (
    <section id="earn" className="relative pt-8 sm:pt-10 md:pt-16 pb-0 px-4">
      {/* Background gradient orb */}
      <div className="absolute right-[5%] top-[10%] w-[300px] h-[300px] md:w-[625px] md:h-[625px] opacity-15 pointer-events-none">
        <svg
          viewBox="0 0 1913 1677"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_earn)">
            <ellipse
              cx="1074.19"
              cy="838.089"
              rx="594.577"
              ry="591.984"
              transform="rotate(-47.8358 1074.19 838.089)"
              fill="#48DC84"
            />
          </g>
          <g filter="url(#filter1_f_earn)">
            <ellipse
              cx="711.981"
              cy="860.349"
              rx="503.382"
              ry="566.922"
              transform="rotate(-28.2987 711.981 860.349)"
              fill="#27C681"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_earn"
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
              <feGaussianBlur stdDeviation="181.484" />
            </filter>
            <filter
              id="filter1_f_earn"
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
              <feGaussianBlur stdDeviation="259.263" />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[#1f2a25] bg-[#0b1512]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1.5" y="1.5" width="15" height="15" rx="4" stroke="#34D399" strokeWidth="1.5" />
              <path d="M5 11.5V8.5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9 11.5V6.5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 11.5V4.5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-ws-green font-inter text-xl md:text-[25px] font-bold tracking-tight">
              {t("howWeEarn.badge")}
            </span>
          </div>
          <h2 className="text-white text-2xl sm:text-3xl md:text-5xl font-inter font-bold mb-4 sm:mb-6">
            {t("howWeEarn.title")}{" "}
            <span className="text-ws-green">{t("howWeEarn.titleAccent")}</span>
          </h2>
          <p className="text-ws-gray text-sm sm:text-base md:text-2xl lg:text-3xl font-inter font-normal max-w-4xl mx-auto">
            {t("howWeEarn.subtitle")}
          </p>
        </div>

        {/* Profit Flow Card */}
        <div className="rounded-[32px] md:rounded-[43px] border border-ws-card-border md:border-2 bg-[#0F1110] p-4 sm:p-6 md:p-12">
          <h3 className="text-white text-center text-xl sm:text-2xl md:text-[35px] font-inter font-bold mb-6 sm:mb-10 md:mb-12">
            {t("howWeEarn.profitFlow")}
          </h3>

          {/* Flow Diagram */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 max-w-4xl mx-auto">
            {/* Flow arrows (desktop) */}
            <div className="hidden md:block pointer-events-none absolute inset-0">
              <span className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 text-ws-green text-2xl font-bold leading-none">
                →
              </span>
              <span className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ws-green text-2xl font-bold leading-none">
                ↓
              </span>
              <span className="absolute left-1/2 top-3/4 -translate-x-1/2 -translate-y-1/2 text-ws-green text-2xl font-bold leading-none">
                ←
              </span>
              <span className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ws-green text-2xl font-bold leading-none">
                ↑
              </span>
            </div>
            {/* Wallet */}
            <div className="order-1 flex flex-col items-center text-center md:order-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[20px] md:rounded-[28px] border-2 sm:border-4 border-[#20C465] bg-[#0B261E] flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 32 31"
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 4.55882V27C0 28.8856 0 29.8284 0.585787 30.4142C1.17157 31 2.11438 31 4 31H30C30.9428 31 31.4142 31 31.7071 30.7071C32 30.4142 32 29.9428 32 29V23.7059M0 4.55882C0 6.0119 0 6.73844 0.24637 7.30824C0.549447 8.00921 1.10844 8.5682 1.80941 8.87128C2.37921 9.11765 3.10575 9.11765 4.55882 9.11765H30C30.9428 9.11765 31.4142 9.11765 31.7071 9.41054C32 9.70343 32 10.1748 32 11.1176V16.4118M0 4.55882C0 3.10575 0 2.37921 0.24637 1.80941C0.549447 1.10844 1.10844 0.549448 1.80941 0.24637C2.37921 0 3.10575 0 4.55882 0H29.2222C29.6936 0 29.9293 0 30.0758 0.146447C30.2222 0.292894 30.2222 0.528596 30.2222 1V3.11765C30.2222 5.94607 30.2222 7.36029 29.3435 8.23897C28.4649 9.11765 27.0507 9.11765 24.2222 9.11765H21.3333M32 23.7059H23.3333C22.3905 23.7059 21.9191 23.7059 21.6262 23.413C21.3333 23.1201 21.3333 22.6487 21.3333 21.7059V18.4118C21.3333 17.469 21.3333 16.9976 21.6262 16.7047C21.9191 16.4118 22.3905 16.4118 23.3333 16.4118H32M32 23.7059V16.4118"
                    stroke="white"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              <h4 className="text-white text-base sm:text-lg md:text-[25px] font-inter font-bold mb-2">
                {t("howWeEarn.wallet.title")}
              </h4>
              <p className="text-ws-gray-dark text-xs sm:text-sm md:text-base font-inter">
                {t("howWeEarn.wallet.description")}
              </p>
            </div>

            <div className="order-2 flex items-center justify-center md:hidden">
              <span className="text-ws-green text-xl font-bold leading-none">↓</span>
            </div>

            {/* Automated Trading Bot */}
            <div className="order-3 flex flex-col items-center text-center md:order-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[20px] md:rounded-[28px] border-2 sm:border-4 border-[#20C465] bg-[#0B261E] flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 36 22"
                  className="w-7 h-5 sm:w-8 sm:h-6 md:w-9 md:h-6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M26.4 0L35.2 11L26.4 22"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.8 0L0 11L8.8 22"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h4 className="text-white text-base sm:text-lg md:text-[25px] font-inter font-bold mb-2">
                {t("howWeEarn.bot.title")}
              </h4>
              <p className="text-ws-gray-dark text-xs sm:text-sm md:text-base font-inter">
                {t("howWeEarn.bot.description")}
              </p>
            </div>

            <div className="order-4 flex items-center justify-center md:hidden">
              <span className="text-ws-green text-xl font-bold leading-none">↓</span>
            </div>

            {/* Trading Rebates */}
            <div className="order-5 flex flex-col items-center text-center md:order-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[20px] md:rounded-[28px] border-2 sm:border-4 border-[#20C465] bg-[#0B261E] flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 25 29"
                  className="w-6 h-7 sm:w-7 sm:h-8 md:w-7 md:h-8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <ellipse
                    cx="12.5"
                    cy="5.5"
                    rx="12.5"
                    ry="5.5"
                    stroke="white"
                    strokeWidth="3"
                  />
                  <path
                    d="M0 16C0 16 0 20.3516 0 23.4286C0 26.5056 5.59644 29 12.5 29C19.4036 29 25 26.5056 25 23.4286C25 21.8927 25 16 25 16"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="square"
                  />
                  <path
                    d="M0 6C0 6 0 11.8505 0 14.75C0 17.6495 5.59644 20 12.5 20C19.4036 20 25 17.6495 25 14.75C25 13.3027 25 6 25 6"
                    stroke="white"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              <h4 className="text-white text-base sm:text-lg md:text-[25px] font-inter font-bold mb-2">
                {t("howWeEarn.rebates.title")}
              </h4>
              <p className="text-ws-gray-dark text-xs sm:text-sm md:text-base font-inter">
                {t("howWeEarn.rebates.description")}
              </p>
            </div>

            <div className="order-6 flex items-center justify-center md:hidden">
              <span className="text-ws-green text-xl font-bold leading-none">↓</span>
            </div>

            {/* Payout Distribution */}
            <div className="order-7 flex flex-col items-center text-center md:order-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-[20px] md:rounded-[28px] border-2 sm:border-4 border-[#20C465] bg-[#0B261E] flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 28 28"
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M28 5L19.2619 13.3409C18.8755 13.7098 18.2674 13.7098 17.881 13.3409L14.5476 10.1591C14.1612 9.79023 13.5531 9.79023 13.1667 10.1591L6 17"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0 0V24.8C0 25.9201 0 26.4802 0.217987 26.908C0.409734 27.2843 0.715695 27.5903 1.09202 27.782C1.51984 28 2.0799 28 3.2 28H28"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h4 className="text-white text-base sm:text-lg md:text-[25px] font-inter font-bold mb-2">
                {t("howWeEarn.payout.title")}
              </h4>
              <p className="text-ws-gray-dark text-xs sm:text-sm md:text-base font-inter">
                {t("howWeEarn.payout.description")}
              </p>
            </div>
          </div>

          {/* Returns Card (inside Profit Flow box) */}
          <div className="mt-8 sm:mt-12 rounded-[20px] sm:rounded-[27px] border border-[#0D3626] md:border-2 bg-[#06130E] backdrop-blur-sm p-4 sm:p-6 md:p-12 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-6xl font-inter font-bold bg-gradient-to-r from-[#36D498] via-[#4ADD81] to-[#14BA81] bg-clip-text text-transparent mb-2 sm:mb-4">
                  {t("howWeEarn.returnsRange")}
                </h3>
                <p className="text-ws-gray text-sm sm:text-base md:text-2xl font-inter font-bold">
                  {t("howWeEarn.returnsTitle")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-4 sm:w-8 sm:h-5 md:w-10 md:h-6"
                  viewBox="0 0 40 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M25.2639 9.02216L32.482 16.2403L39.7002 9.02216"
                    stroke="#31C991"
                    strokeWidth="2"
                  />
                  <path
                    d="M13.5339 1.69246C15.4542 0.583784 17.6325 0.000113743 19.8499 0.000113717C22.0672 0.00011369 24.2455 0.583784 26.1658 1.69246C28.0861 2.80113 29.6807 4.39575 30.7893 6.31603C31.898 8.23631 32.4817 10.4146 32.4817 12.6319"
                    stroke="#31C991"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14.4363 16.2436L7.21809 9.02538L-0.000100623 16.2436"
                    stroke="#31C991"
                    strokeWidth="2"
                  />
                  <path
                    d="M26.1663 23.5733C24.246 24.6819 22.0677 25.2656 19.8503 25.2656C17.633 25.2656 15.4547 24.6819 13.5344 23.5733C11.6141 22.4646 10.0195 20.87 8.91086 18.9497C7.80218 17.0294 7.21851 14.8511 7.21851 12.6338"
                    stroke="#31C991"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-ws-gray text-sm sm:text-base md:text-2xl font-inter">
                  {t("howWeEarn.continuousCycle")}
                </span>
              </div>
            </div>

          </div>

          <div className="mt-5 sm:mt-6 md:mt-8 max-w-4xl mx-auto overflow-hidden rounded-[18px] sm:rounded-[22px] md:rounded-[28px] border border-[#1A2A24]">
            <img
              src={profitFlowPreview}
              alt="Profit flow dashboard preview"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
