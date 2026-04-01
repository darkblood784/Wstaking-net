import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Description from "@/components/version/Description/Description";
import { Seo } from "@/components/Seo";

export const CURRENT_CONTRACT_VERSION = "1.5";

const Version: React.FC = () => {
  const versionsList = ["1.0", "1.1", "1.2", "1.3", "1.4", "1.5"];
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [selectedVersion, setSelectedVersion] = useState<string>(
    versionsList.slice(-1)[0]
  );
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const versionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("selected");
    if (selected && versionsList.includes(selected)) {
      setSelectedVersion(selected);
    }
  }, [pathname, versionsList]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!versionMenuRef.current) return;
      if (!versionMenuRef.current.contains(event.target as Node)) {
        setIsVersionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Seo
        title="WStaking Smart Contract Versions"
        description="Track WStaking smart contract versions and review version-specific changes and policy updates."
        path="/version"
      />
      <Header />
      <main className="pt-28 md:pt-36 pb-24">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="relative rounded-[28px] border border-ws-card-border bg-gradient-to-br from-[#07110d] via-[#060c0a] to-[#050606] p-8 md:p-12 shadow-[0_25px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#12B980]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#22C55F]/10 blur-3xl" />

            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-ws-green/80 text-sm uppercase tracking-[0.2em]">
                    {t("version")}
                  </p>
                  <h1 className="text-3xl md:text-5xl font-bold">
                    {t("smartcontractversion")}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-sm">{t("version")}</span>
                  <div className="relative" ref={versionMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsVersionMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-ws-card-border bg-black/70 px-5 py-2 text-sm text-white md:text-base focus:outline-none focus:ring-2 focus:ring-ws-green/60"
                    >
                      {t("version")} {selectedVersion}
                      <svg
                        className={`h-4 w-4 text-[#A7F3D0] transition-transform ${isVersionMenuOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 8L10 12L14 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {isVersionMenuOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-white/15 bg-[#040706] shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
                        {versionsList.map((version) => {
                          const isActive = version === selectedVersion;
                          return (
                            <button
                              key={version}
                              type="button"
                              onClick={() => {
                                setSelectedVersion(version);
                                setIsVersionMenuOpen(false);
                              }}
                              className={`block w-full px-4 py-2.5 text-left text-base transition-colors ${
                                isActive
                                  ? "bg-[#12B980] text-black font-semibold"
                                  : "text-white hover:bg-[#0D2A1F] hover:text-[#A7F3D0]"
                              }`}
                            >
                              {t("version")} {version}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-ws-card-border px-4 py-2 text-sm text-white/80 bg-black/40 w-fit">
                <span className="h-2 w-2 rounded-full bg-ws-green" />
                {t("version")} {selectedVersion}
              </div>

              <div className="mt-2 rounded-2xl border border-white/10 bg-transparent p-6 md:p-8">
                <Description version={selectedVersion} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Version;
