import { useTranslation } from "react-i18next";
import { loadEnvConfig } from "@/utils/envLoader";

export function Community() {
  const { t } = useTranslation();
  const envConfig = loadEnvConfig();
  const socialLinks = [
    {
      name: "X",
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
          viewBox="0 0 26 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20.4765 0H24.4634L15.7533 10.1662L26 24H17.9769L11.693 15.6098L4.50267 24H0.51342L9.82969 13.1262L0 0H8.22676L13.9069 7.66892L20.4765 0ZM19.0773 21.5631H21.2864L7.02638 2.30892H4.65573L19.0773 21.5631Z"
            fill="white"
          />
        </svg>
      ),
      bgColor: "bg-[#000]",
      borderColor: "border-[#282D29]",
      href: "https://x.com/WStaking_net",
    },
    {
      name: "Telegram",
      icon: (
        <svg
          className="w-6 h-5 sm:w-7 sm:h-6 md:w-8 md:h-6"
          viewBox="0 0 32 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.19983 11.1928C10.7897 7.52363 16.5177 5.10467 19.3837 3.93595C27.5667 0.599007 29.2671 0.0193449 30.3753 0.000204084C30.6191 -0.00400572 31.1641 0.0552205 31.5171 0.336076C31.8152 0.573225 31.8973 0.89358 31.9365 1.11842C31.9758 1.34327 32.0246 1.85547 31.9858 2.25568C31.5423 6.8237 29.6236 17.9091 28.6474 23.0253C28.2344 25.1902 27.4211 25.9161 26.6337 25.9871C24.9226 26.1415 23.6232 24.8784 21.9659 23.8133C19.3725 22.1466 17.9074 21.1091 15.3901 19.4827C12.4809 17.6031 14.3668 16.57 16.0247 14.8817C16.4586 14.4399 23.9979 7.7166 24.1439 7.10669C24.1621 7.03041 24.1791 6.74607 24.0068 6.59594C23.8345 6.4458 23.5802 6.49714 23.3967 6.53797C23.1366 6.59585 18.9936 9.28057 10.9678 14.5921C9.79182 15.3838 8.72666 15.7696 7.77232 15.7494C6.72023 15.7271 4.69644 15.1661 3.19196 14.6867C1.34666 14.0986 -0.119957 13.7877 0.0077523 12.7889C0.074271 12.2687 0.804964 11.7367 2.19983 11.1928Z"
            fill="white"
          />
        </svg>
      ),
      bgColor: "bg-[#0A232F]",
      borderColor: "border-[#1BA7EC]",
      href: "https://t.me/+kblSL0SH7JRlOGM1",
    },
    {
      name: "Instagram",
      icon: (
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16"
          viewBox="0 0 98 98"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x={2} y={2} width={94} height={94} rx={26} fill="#290016" />
          <path
            d="M38.5 31L32.5 33.5L30 36V59.5L34.5 67.5L58.5 68.5L66.5 63L67.5 39L63.5 31H38.5Z"
            fill="white"
          />
          <path
            d="M49 31.7816C54.6109 31.7816 55.2754 31.8062 57.482 31.9047C59.5328 31.9949 60.6402 32.3395 61.3785 32.6266C62.3547 33.0039 63.0602 33.4633 63.7902 34.1934C64.5285 34.9316 64.9797 35.6289 65.357 36.6051C65.6441 37.3434 65.9887 38.459 66.0789 40.5016C66.1773 42.7164 66.202 43.3809 66.202 48.9836C66.202 54.5945 66.1773 55.259 66.0789 57.4656C65.9887 59.5164 65.6441 60.6238 65.357 61.3621C64.9797 62.3383 64.5203 63.0438 63.7902 63.7738C63.052 64.5121 62.3547 64.9633 61.3785 65.3406C60.6402 65.6277 59.5246 65.9723 57.482 66.0625C55.2672 66.1609 54.6027 66.1855 49 66.1855C43.3891 66.1855 42.7246 66.1609 40.518 66.0625C38.4672 65.9723 37.3598 65.6277 36.6215 65.3406C35.6453 64.9633 34.9398 64.5039 34.2098 63.7738C33.4715 63.0355 33.0203 62.3383 32.643 61.3621C32.3559 60.6238 32.0113 59.5082 31.9211 57.4656C31.8227 55.2508 31.798 54.5863 31.798 48.9836C31.798 43.3727 31.8227 42.7082 31.9211 40.5016C32.0113 38.4508 32.3559 37.3434 32.643 36.6051C33.0203 35.6289 33.4797 34.9234 34.2098 34.1934C34.948 33.4551 35.6453 33.0039 36.6215 32.6266C37.3598 32.3395 38.4754 31.9949 40.518 31.9047C42.7246 31.8062 43.3891 31.7816 49 31.7816ZM49 28C43.2988 28 42.5852 28.0246 40.3457 28.123C38.1145 28.2215 36.5805 28.5824 35.2516 29.0992C33.8652 29.6406 32.6922 30.3543 31.5273 31.5273C30.3543 32.6922 29.6406 33.8652 29.0992 35.2434C28.5824 36.5805 28.2215 38.1062 28.123 40.3375C28.0246 42.5852 28 43.2988 28 49C28 54.7012 28.0246 55.4148 28.123 57.6543C28.2215 59.8855 28.5824 61.4195 29.0992 62.7484C29.6406 64.1348 30.3543 65.3078 31.5273 66.4727C32.6922 67.6375 33.8652 68.3594 35.2434 68.8926C36.5805 69.4094 38.1063 69.7703 40.3375 69.8687C42.577 69.9672 43.2906 69.9918 48.9918 69.9918C54.693 69.9918 55.4066 69.9672 57.6461 69.8687C59.8773 69.7703 61.4113 69.4094 62.7402 68.8926C64.1184 68.3594 65.2914 67.6375 66.4563 66.4727C67.6211 65.3078 68.343 64.1348 68.8762 62.7566C69.393 61.4195 69.7539 59.8938 69.8523 57.6625C69.9508 55.423 69.9754 54.7094 69.9754 49.0082C69.9754 43.307 69.9508 42.5934 69.8523 40.3539C69.7539 38.1227 69.393 36.5887 68.8762 35.2598C68.3594 33.8652 67.6457 32.6922 66.4727 31.5273C65.3078 30.3625 64.1348 29.6406 62.7566 29.1074C61.4195 28.5906 59.8938 28.2297 57.6625 28.1313C55.4148 28.0246 54.7012 28 49 28Z"
            fill="#1E0638"
          />
          <path
            d="M49 38.2129C43.0445 38.2129 38.2129 43.0445 38.2129 49C38.2129 54.9555 43.0445 59.7871 49 59.7871C54.9555 59.7871 59.7871 54.9555 59.7871 49C59.7871 43.0445 54.9555 38.2129 49 38.2129ZM49 55.9973C45.1363 55.9973 42.0027 52.8637 42.0027 49C42.0027 45.1363 45.1363 42.0027 49 42.0027C52.8637 42.0027 55.9973 45.1363 55.9973 49C55.9973 52.8637 52.8637 55.9973 49 55.9973Z"
            fill="#1E0638"
          />
          <path
            d="M62.732 37.7864C62.732 39.181 61.6 40.3048 60.2137 40.3048C58.8191 40.3048 57.6953 39.1728 57.6953 37.7864C57.6953 36.3919 58.8273 35.2681 60.2137 35.2681C61.6 35.2681 62.732 36.4001 62.732 37.7864Z"
            fill="#1E0638"
          />
        </svg>
      ),
      bgColor: "bg-[#290016]",
      borderColor: "border-[#FE0187]",
      href: envConfig.socialInstagram || "#",
    },
  ];

  return (
    <section id="community" className="relative pt-2 sm:pt-3 md:pt-4 pb-16 md:pb-24 px-4">
      {/* Background gradient orb */}
      <div className="absolute right-[10%] top-[5%] w-[300px] h-[300px] md:w-[625px] md:h-[625px] opacity-15 pointer-events-none">
        <svg
          viewBox="0 0 1913 1677"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_f_community)">
            <ellipse
              cx="1074.19"
              cy="838.089"
              rx="594.577"
              ry="591.984"
              transform="rotate(-47.8358 1074.19 838.089)"
              fill="#48DC84"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_community"
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
          </defs>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-inter font-bold mb-6">
            {t("community.title")}{" "}
            <span className="text-ws-green">{t("community.titleAccent")}</span>
          </h2>
          <p className="text-ws-gray text-sm sm:text-base md:text-xl lg:text-2xl font-inter">
            {t("community.subtitle")}
          </p>
        </div>

        {/* Social Cards Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8 mb-10 md:mb-12">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="backdrop-blur-xl rounded-[18px] sm:rounded-[22px] md:rounded-[28px] border border-[#282D29] bg-white/[0.03] p-3 sm:p-4 md:p-6 hover:border-ws-green transition-colors cursor-pointer"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-[16px] sm:rounded-[20px] md:rounded-[28px] border-2 md:border-4 ${social.borderColor} ${social.bgColor} flex items-center justify-center mb-3 sm:mb-4 md:mb-6 mx-auto`}
              >
                {social.icon}
              </div>
              <h3 className="text-white text-xs sm:text-sm md:text-2xl font-inter font-medium text-center">
                {social.name}
              </h3>
            </a>
          ))}
        </div>

        <p className="text-ws-gray text-center text-sm sm:text-base md:text-2xl font-inter">
          {t("community.follow")}
        </p>
      </div>
    </section>
  );
}
