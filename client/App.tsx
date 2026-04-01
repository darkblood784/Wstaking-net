import "./global.css";
import "@rainbow-me/rainbowkit/styles.css";
import "@/i18n";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { RainbowKitProvider, Locale, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/wagmi";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { LANGUAGES } from "@/i18n";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ModalContextProvider } from "@/contexts/ModalContext";
import { RefreshStakesProvider } from "@/contexts/RefreshStakesContext";
import { UserStakesProvider } from "@/contexts/UserStakesContext";
import { SelectedTokenContextProvider } from "@/contexts/SelectedTokenContext";
import { UserDetailsContextProvider } from "@/contexts/UserDetailsContext";
import { SystemDetailsProvider } from "@/contexts/SystemDetailsContext";
import WalletConnectLogger from "@/components/WalletConnectLogger";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Version from "./pages/Version";
import FAQ from "./pages/FAQ";
import WhitePaper from "./pages/WhitePaper";

const queryClient = new QueryClient();

const App = () => {
  const { i18n } = useTranslation();
  const languageCode = i18n.language.split("-")[0];
  const currentLanguage =
    LANGUAGES.find((lang) => lang.code === languageCode) || LANGUAGES[0];
  const rainbowKitLocale: Locale | undefined =
    currentLanguage.rainbowKitLocale as Locale;

  const ScrollToHash = () => {
    const location = useLocation();
    useEffect(() => {
      if (!location.hash) return;
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        // wait for layout after route render
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    }, [location]);
    return null;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationProvider>
          <ModalContextProvider>
            <WagmiProvider config={wagmiConfig}>
              <RainbowKitProvider
                showRecentTransactions
                locale={rainbowKitLocale}
                theme={darkTheme({
                  accentColor: "#12B980",
                  accentColorForeground: "#0A0A0A",
                  borderRadius: "large",
                  fontStack: "system",
                  overlayBlur: "small",
                  colors: {
                    actionButtonBorder: "rgba(18, 185, 128, 0.2)",
                    actionButtonBorderMobile: "rgba(18, 185, 128, 0.3)",
                    actionButtonSecondaryBackground: "linear-gradient(180deg, rgba(18, 185, 128, 0.2), rgba(10, 15, 13, 0.9))",
                    closeButton: "#A7F3D0",
                    closeButtonBackground: "#0F1713",
                    connectButtonBackground: "#0F1713",
                    connectButtonBackgroundError: "#7F1D1D",
                    connectButtonInnerBackground:
                      "linear-gradient(180deg, rgba(18, 185, 128, 0.35), rgba(18, 185, 128, 0.08))",
                    connectButtonText: "#E5F7F0",
                    connectButtonTextError: "#FECACA",
                    connectionIndicator: "#22C55F",
                    downloadBottomCardBackground:
                      "linear-gradient(126deg, rgba(18, 185, 128, 0.12) 9.49%, rgba(0, 0, 0, 0) 71.04%), #0B0F0D",
                    downloadTopCardBackground:
                      "linear-gradient(126deg, rgba(148, 163, 184, 0.18) 9.49%, rgba(0, 0, 0, 0) 71.04%), #0B0F0D",
                    error: "#F87171",
                    generalBorder: "rgba(18, 185, 128, 0.18)",
                    generalBorderDim: "rgba(18, 185, 128, 0.08)",
                    menuItemBackground: "#0F1713",
                    modalBackdrop: "rgba(0, 0, 0, 0.7)",
                    modalBackground: "#0B0F0D",
                    modalBorder: "rgba(18, 185, 128, 0.25)",
                    modalText: "#F8FAFC",
                    modalTextDim: "#64748B",
                    modalTextSecondary: "#94A3B8",
                    profileAction:
                      "linear-gradient(135deg, #12B980 0%, #22C55F 100%)",
                    profileActionHover:
                      "linear-gradient(135deg, #22C55F 0%, #12B980 100%)",
                    profileForeground:
                      "linear-gradient(180deg, rgba(15, 23, 19, 0.95), rgba(11, 15, 13, 0.95))",
                    selectedOptionBorder: "#12B980",
                    standby: "#94A3B8",
                  },
                  radii: {
                    actionButton: "12px",
                    connectButton: "999px",
                    menuButton: "12px",
                    modal: "24px",
                    modalMobile: "20px",
                  },
                  shadows: {
                    connectButton: "0 8px 24px rgba(0, 0, 0, 0.35)",
                    dialog: "0 25px 60px rgba(0, 0, 0, 0.55)",
                    profileDetailsAction:
                      "0 0 0 1px rgba(18, 185, 128, 0.25), 0 10px 24px rgba(18, 185, 128, 0.18)",
                    selectedOption: "0 0 0 1px rgba(18, 185, 128, 0.28)",
                    selectedWallet: "0 10px 30px rgba(0, 0, 0, 0.45)",
                    walletLogo: "0 6px 16px rgba(0, 0, 0, 0.4)",
                  },
                  blurs: {
                    modalOverlay: "8px",
                  },
                } as any)}
              >
                <RefreshStakesProvider>
                  <UserStakesProvider>
                    <SelectedTokenContextProvider>
                      <UserDetailsContextProvider>
                        <SystemDetailsProvider>
                          <BrowserRouter
                            future={{
                              v7_startTransition: true,
                              v7_relativeSplatPath: true,
                            }}
                          >
                            <ScrollToHash />
                            <WalletConnectLogger />
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/admin" element={<Admin />} />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/white-paper" element={<WhitePaper />} />
                              <Route path="/version" element={<Version />} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </BrowserRouter>
                        </SystemDetailsProvider>
                      </UserDetailsContextProvider>
                    </SelectedTokenContextProvider>
                  </UserStakesProvider>
                </RefreshStakesProvider>
              </RainbowKitProvider>
            </WagmiProvider>
          </ModalContextProvider>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
