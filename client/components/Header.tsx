import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUserDetails } from "@/contexts/UserDetailsContext";
import logo from "@/assets/images/logo.png";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { TotalStakedBadge } from "@/components/TotalStakedBadge";
import { cn } from "@/lib/utils";

type HeaderProps = {
  compactNav?: boolean;
  showTotalStaked?: boolean;
};

export function Header({
  compactNav = false,
  showTotalStaked = false,
}: HeaderProps) {
  const { isAdmin } = useUserDetails();
  const { i18n, t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileWalletOpen, setIsMobileWalletOpen] = useState(false);
  const mobileWalletRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const CURRENT_CONTRACT_VERSION = "1.5";
  const getChainShortLabel = (name?: string) => {
    if (!name) return "";
    const normalized = name.toLowerCase();
    if (normalized.includes("bnb")) return "BNB";
    if (normalized.includes("binance")) return "BNB";
    if (normalized.includes("ethereum")) return "ETH";
    if (normalized.includes("arbitrum")) return "ARB";
    if (normalized.includes("optimism")) return "OP";
    if (normalized.includes("polygon")) return "MATIC";
    if (normalized.includes("base")) return "BASE";
    if (normalized.includes("avalanche")) return "AVAX";
    if (normalized.includes("fantom")) return "FTM";
    if (normalized.includes("linea")) return "LINEA";
    if (normalized.includes("zksync")) return "ZKS";
    if (normalized.includes("scroll")) return "SCROLL";
    if (normalized.includes("xlayer")) return "XLAYER";
    if (normalized.includes("testnet")) return "TEST";
    return name.split(" ")[0].toUpperCase();
  };

  useEffect(() => {
    if (!isMobileWalletOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (mobileWalletRef.current && !mobileWalletRef.current.contains(target)) {
        setIsMobileWalletOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileWalletOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[170] flex items-center justify-between px-4 md:px-8 h-20 md:h-30 bg-black/80 backdrop-blur-sm">
      <div className="flex items-center gap-8 md:gap-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="WStaking"
            className="w-12 h-12 md:w-16 md:h-16 object-contain"
          />
        </Link>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-end pr-6 lg:pr-10">
        <div
          className={cn(
            "transition-[opacity,transform] duration-300 ease-out",
            compactNav && showTotalStaked
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-4 pointer-events-none",
          )}
        >
          {showTotalStaked && <TotalStakedBadge variant="nav" />}
        </div>
      </div>

      {/* Desktop controls */}
      <div className="hidden md:flex items-center gap-3">
        {isAdmin && (
          <Link
            to="/admin"
            className="text-[#0DEB00] font-grotesk text-base lg:text-lg hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            {t("nav.admin")}
          </Link>
        )}
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const connected = mounted && account && chain;

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  className="px-4 md:px-6 lg:px-8 py-2 md:py-3 rounded-full bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black font-inter text-sm md:text-base font-semibold hover:opacity-90 transition-opacity"
                >
                  {t("nav.connectWallet")}
                </button>
              );
            }

            return (
              <div className="flex items-center gap-4">
                <button
                  onClick={openChainModal}
                  className="px-4 md:px-6 py-2.5 md:py-3 rounded-full border border-ws-card-border text-white text-sm md:text-base font-inter hover:border-ws-green transition-colors inline-flex items-center gap-2"
                  type="button"
                >
                  {chain?.iconUrl && (
                    <img
                      src={chain.iconUrl}
                      alt={`${chain?.name ?? "Network"} icon`}
                      className="h-4 w-4 rounded-full"
                    />
                  )}
                  {chain?.name || "Network"}
                </button>
                <button
                  onClick={openAccountModal}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-full bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black font-inter text-sm md:text-base font-semibold hover:opacity-90 transition-opacity"
                  type="button"
                >
                  {account?.displayName}
                </button>
              </div>
            );
          }}
        </ConnectButton.Custom>

        <button
          type="button"
          className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-ws-card-border bg-white/5 text-white hover:border-ws-green hover:text-ws-green transition-colors"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Toggle menu</span>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile actions (connect + menu) */}
      <div className="md:hidden flex items-center gap-3 sm:gap-4">
        {showTotalStaked && (
          <div
            className={cn(
              "transition-[opacity,transform] duration-300 ease-out",
              compactNav ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
            )}
          >
            <TotalStakedBadge
              variant="compact"
              className="px-3 py-1.5 gap-2"
              labelClassName="hidden sm:inline text-[10px]"
              valueClassName="text-[12px] sm:text-sm max-w-[28vw] truncate"
            />
          </div>
        )}
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const connected = mounted && account && chain;

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black font-inter text-[11px] font-semibold hover:opacity-90 transition-opacity whitespace-nowrap leading-none"
                >
                  {t("nav.connectWallet")}
                </button>
              );
            }

            return (
              <div className="relative" ref={mobileWalletRef}>
                <button
                  onClick={() => setIsMobileWalletOpen((open) => !open)}
                  className="px-2 py-1.5 rounded-2xl bg-gradient-to-r from-[#12B980] to-[#22C55F] text-black font-inter font-semibold hover:opacity-90 transition-opacity min-w-[104px]"
                  type="button"
                >
                  <span className="flex flex-col items-start leading-tight">
                    <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.08em]">
                      {chain?.iconUrl ? (
                        <img
                          src={chain.iconUrl}
                          alt={`${chain?.name ?? "Network"} icon`}
                          className="h-2.5 w-2.5 rounded-full"
                        />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-black/20" />
                      )}
                      <span>{getChainShortLabel(chain?.name) || "NETWORK"}</span>
                    </span>
                    <span className="text-[12px] truncate max-w-[88px]">
                      {account?.displayName}
                    </span>
                  </span>
                </button>

                {isMobileWalletOpen && (
                  <>
                    <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-ws-card-border bg-black/90 backdrop-blur p-2 z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileWalletOpen(false);
                          openChainModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10"
                      >
                        Change network
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileWalletOpen(false);
                          openAccountModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10"
                      >
                        Wallet options
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>

        <button
          type="button"
          className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-ws-card-border text-white"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Toggle menu</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

            {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[160]">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            ref={mobileMenuRef}
            className="absolute right-3 top-3 w-[92vw] max-w-sm rounded-2xl border border-ws-card-border bg-[#070808]/95 backdrop-blur p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-white text-lg font-semibold font-inter tracking-[0.01em]">
                {t("nav.menu", "Menu")}
              </span>
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ws-card-border p-0 text-white/90 hover:text-white hover:border-ws-green transition-colors leading-none"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg className="block" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="mt-3 inline-flex rounded-full border border-[#22C55F]/40 bg-[#22C55F]/10 px-3 py-1 text-[#22C55F] font-grotesk text-xs hover:opacity-90 transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("nav.admin")}
              </Link>
            )}

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 mb-2">
                {t("nav.navigation", "Navigation")}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="/#earn"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/90 hover:border-ws-green hover:text-white transition-colors"
                >
                  {t("nav.howWeEarnMenu", "How We Earn?")}
                </a>
                <a
                  href="/#start-staking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/90 hover:border-ws-green hover:text-white transition-colors"
                >
                  {`${t("startStaking.title", "Start")} ${t("startStaking.titleAccent", "Staking")}`}
                </a>
                <a
                  href="/#community"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/90 hover:border-ws-green hover:text-white transition-colors"
                >
                  {t("footer.contactUs")}
                </a>
                <Link
                  to="/faq"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/90 hover:border-ws-green hover:text-white transition-colors"
                >
                  {t("nav.faq")}
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 mb-2">
                {t("nav.language", "Language")}
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const isActive = i18n.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors",
                        isActive
                          ? "border-[#22C55F] bg-[#22C55F]/15 text-[#22C55F]"
                          : "border-ws-card-border text-white/75 hover:border-ws-green hover:text-white"
                      )}
                    >
                      {lang.code.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.12em] text-white/45">
                  {t("nav.version")}
                </span>
                <Link
                  to="/version"
                  className="text-white/90 text-sm font-medium hover:text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  v{CURRENT_CONTRACT_VERSION}
                </Link>
              </div>
              <a
                href="/white-paper"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:border-ws-green hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("footer.whitePaper", "White Paper")}
              </a>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}

export default Header;

