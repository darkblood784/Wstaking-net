import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import xLayerIcon from "@/assets/contracts/xlayer.svg";
import bnbIcon from "@/assets/contracts/bnb.svg";
import baseIcon from "@/assets/contracts/base.svg";
import { loadEnvConfig } from "@/utils/envLoader";

export function Footer() {
  const { t } = useTranslation();
  const envConfig = loadEnvConfig();
  const WHITE_PAPER_URL = "/white-paper";
  const CURRENT_CONTRACT_VERSION = "1.5";
  const currentYear = new Date().getFullYear();
  const contracts = [
    {
      key: "xlayer",
      icon: xLayerIcon,
      label: "0xe.....2Bba",
      url: "https://www.oklink.com/xlayer/address/0xe5ef454b050e7a6cffe692c05b71ee2768c32bba/contract",
    },
    {
      key: "bnb",
      icon: bnbIcon,
      label: "0x1.....2496",
      url: "https://bscscan.com/address/0x1C5204bb87cE4A2c2e00d42f20a5aF24705c2496#code",
    },
    {
      key: "base",
      icon: baseIcon,
      label: "0xA.....52cA",
      url: "https://basescan.org/address/0xA4B852C076A119586269054E919FFF1F711A52cA#code",
    },
  ];

  const handleOpenDisclaimer = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("open-disclaimer", "1");
      window.dispatchEvent(new CustomEvent("open-disclaimer"));
      if (window.location.pathname !== "/") {
        window.location.href = "/#start-staking";
      }
    }
  };

  const handleWhitePaperClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!WHITE_PAPER_URL) {
      event.preventDefault();
    }
  };

  return (
    <footer
      id="contact"
      className="relative py-12 md:py-16 px-4 border-t border-ws-card-border"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <div>
            <h3 className="text-3xl md:text-4xl font-inter font-bold mb-6">
              <span className="text-white">W</span>
              <span className="text-ws-green">Staking</span>
            </h3>
            <p className="text-[#BDBDBD] text-sm font-inter mb-2">
              {t("footer.email", { email: "Service@wstaking.net" })}
            </p>
            <p className="text-[#BDBDBD] text-sm font-inter">
              © {currentYear} WStaking. All Rights Reserved
            </p>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-white text-xl font-inter font-semibold mb-4">
              {t("footer.contracts", "Contracts")}
            </h4>
            <div className="flex flex-col gap-3">
              {contracts.map((contract) => (
                <a
                  key={contract.key}
                  href={contract.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-ws-green/40 bg-black/40 px-3 py-1 text-sm font-medium text-ws-green shadow-[0_0_0_1px_rgba(20,186,129,0.08)] transition hover:border-ws-green/70 hover:bg-ws-green/10 w-fit"
                >
                  <img
                    src={contract.icon}
                    alt={`${contract.key} contract`}
                    className="h-4 w-4"
                    style={{
                      filter:
                        "invert(60%) sepia(29%) saturate(739%) hue-rotate(110deg) brightness(93%) contrast(92%)",
                    }}
                  />
                  <span>{contract.label}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-white text-xl font-inter font-semibold mb-4">
              {t("footer.developerInfo", "Developer Info")}
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href={envConfig.socialGithubStrategies || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-[#BDBDBD] hover:text-ws-green transition-colors text-base md:text-lg"
              >
                {t("footer.strategyInformation", "Strategy Information")}
              </a>
              <a
                href={envConfig.socialGithubTeam || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-[#BDBDBD] hover:text-ws-green transition-colors text-base md:text-lg"
              >
                {t("footer.technicalTeam", "Technical Team")}
              </a>
            </div>
          </div>

          <div className="lg:col-span-1 lg:pl-6">
            <h4 className="text-white text-xl font-inter font-semibold mb-4">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors text-base md:text-lg"
                >
                  {t("footer.home")}
                </a>
              </li>
              <li>
                <a
                  href="/#earn"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors text-base md:text-lg"
                >
                  {t("footer.howToEarn")}
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors text-base md:text-lg"
                >
                  {t("nav.faq")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:service@wstaking.net"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors text-base md:text-lg"
                >
                  {t("footer.contactUs")}
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4 lg:text-right">
            <div className="flex flex-col items-start lg:items-end gap-2">
              <a
                href={WHITE_PAPER_URL || "#"}
                onClick={handleWhitePaperClick}
                className="text-ws-green text-sm font-semibold hover:underline"
              >
                {t("footer.whitePaper", "White Paper")}
              </a>
              <button
                type="button"
                onClick={handleOpenDisclaimer}
                className="text-ws-green text-sm font-semibold hover:underline text-left"
              >
                {t("riskstatement")}
              </button>
              <a
                href="/version"
                className="text-ws-green text-sm font-semibold hover:underline"
              >
                {t("smartcontractversion")}
              </a>
            </div>
            
            <div className="pt-2">
              <h4 className="text-white text-base font-inter font-semibold mb-3">
                {t("footer.followUs")}
              </h4>
              <div className="flex gap-4 justify-start lg:justify-end">
                <a
                  href="https://x.com/WStaking_net"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://t.me/+kblSL0SH7JRlOGM1"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </a>
                <a
                  href={envConfig.socialInstagram || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#BDBDBD] hover:text-ws-green transition-colors"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
