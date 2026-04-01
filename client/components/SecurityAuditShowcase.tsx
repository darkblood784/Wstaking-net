import auditedBadgeDark from "@/assets/images/CredShields-Audited-Badge-Dark.svg";
import sealOfSecurity from "@/assets/images/Seal-of-Security.svg";
import { useTranslation } from "react-i18next";

export function SecurityAuditShowcase() {
  const { t } = useTranslation();
  const title = t("trustAudit.title");
  const trustPoints = [
    t("trustAudit.point1"),
    t("trustAudit.point2"),
    t("trustAudit.point3"),
    t("trustAudit.point4"),
  ];

  return (
    <section className="relative px-4 py-8 sm:py-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="relative">
          <div className="pointer-events-none absolute left-[18%] top-[18%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(72,220,132,0.12)_0%,rgba(72,220,132,0.03)_42%,rgba(72,220,132,0)_76%)] blur-3xl" />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[#1f2a25] bg-[#0b1512]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 1.5L14.25 3.75V8.1C14.25 11.6925 11.76 15.0525 9 15.75C6.24 15.0525 3.75 11.6925 3.75 8.1V3.75L9 1.5Z"
                  stroke="#34D399"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.75 8.625L8.25 10.125L11.625 6.75"
                  stroke="#34D399"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-ws-green font-inter text-xl md:text-[25px] font-bold tracking-tight">
                {t("trustAudit.badge")}
              </span>
            </div>
            <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-5xl">
              {title.split("WStaking").map((part, index, parts) => (
                <span key={`${part}-${index}`}>
                  {part}
                  {index < parts.length - 1 && (
                    <span>
                      <span className="text-white">W</span>
                      <span className="text-[#36D498]">Staking</span>
                    </span>
                  )}
                </span>
              ))}
            </h2>
            <p className="mx-auto mt-4 max-w-4xl text-ws-gray text-sm sm:text-base md:text-2xl md:leading-relaxed">
              {t("trustAudit.subtitle")}
            </p>
          </div>

          <div className="relative mt-8 grid gap-6 md:grid-cols-[minmax(0,540px)_190px] md:justify-center md:items-start md:gap-2 lg:mt-10 lg:grid-cols-[minmax(0,540px)_240px] lg:gap-3">
            <div className="min-w-0">
              <div className="mx-auto grid max-w-[450px] gap-4 md:mx-3">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/8 bg-[#0D1612]/70 px-3.5 py-3 text-left"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#36D498]/45 bg-[#10271D] text-[#48DC84]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-2.5 w-2.5"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.5 8.5L6.5 11.5L12.5 4.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <p className="text-sm leading-6 text-white/88">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start justify-center md:justify-start md:-ml-6 md:-mt-4 lg:-ml-10 lg:-mt-6">
              <div className="relative w-full max-w-[210px] sm:max-w-[210px] md:max-w-[190px] lg:max-w-[240px]">
                <div className="relative z-10 flex min-h-[180px] items-center justify-center sm:min-h-[200px] lg:min-h-[240px]">
                  <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle,rgba(255,214,102,0.24)_0%,rgba(255,214,102,0.1)_34%,rgba(255,214,102,0)_74%)] blur-3xl animate-pulse" />
                  <div className="absolute inset-6 rounded-full border border-[#FFD56A]/20 opacity-80 blur-md animate-pulse [animation-duration:3.6s]" />
                  <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle,rgba(255,240,188,0.32)_0%,rgba(255,214,102,0.08)_46%,rgba(255,214,102,0)_76%)] blur-2xl animate-pulse [animation-duration:2.8s]" />
                  <img
                    src={sealOfSecurity}
                    alt="Seal of Security"
                    className="relative h-auto w-[125px] drop-shadow-[0_0_22px_rgba(255,214,102,0.14)] sm:w-[156px] md:w-[150px] lg:w-[150px]"
                  />
                </div>

                <div className="absolute bottom-0 right-0 z-0 w-full max-w-[132px] translate-x-[35%] translate-y-[15%] p-1.5 sm:max-w-[146px] lg:max-w-[170px]">
                  <img
                    src={auditedBadgeDark}
                    alt="CredShields audited badge"
                    className="block h-auto w-full opacity-95"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecurityAuditShowcase;
