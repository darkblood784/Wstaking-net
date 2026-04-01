import { useUserDetails } from "@/contexts/UserDetailsContext";
import AdminHome from "@/pages/indonesia/AdminHome";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import NotFound from "@/pages/NotFound";
import { Seo } from "@/components/Seo";
import { useAccount, useSignMessage } from "wagmi";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNetworkName } from "@/utils/networkUtils";
import {
  AdminAccessLogResponse,
  AdminAuthChallengeResponse,
  AdminAuthSessionResponse,
  AdminAuthVerifyResponse,
} from "@shared/api";

const Admin = () => {
  const { isAdmin, userDetailsLoading } = useUserDetails();
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const loggedWalletRef = useRef<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isServerAuthorized, setIsServerAuthorized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const previousAddressRef = useRef<string | null>(null);
  const previousChainIdRef = useRef<number | null>(null);

  const clearClientAdminState = useCallback(() => {
    setIsServerAuthorized(false);
    setAuthError("");
    setIsVerifying(false);
    loggedWalletRef.current = null;
  }, []);

  const logoutAdminSession = useCallback(
    async (reason: string) => {
      const payload = JSON.stringify({
        walletAddress: address || "",
        reason,
      });
      try {
        const endpoints = ["/api/admin/logout", "/api/admin-auth/logout"];
        for (const endpoint of endpoints) {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: payload,
          }).catch(() => null);
          if (response && response.ok) break;
        }
      } catch (error) {
        console.error("Failed to logout admin session:", error);
      } finally {
        clearClientAdminState();
      }
    },
    [address, clearClientAdminState]
  );

  const verifyServerSession = useCallback(async () => {
    if (!isConnected || !address) {
      setIsServerAuthorized(false);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch("/api/admin-auth/session", {
        method: "GET",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as AdminAuthSessionResponse | null;
      const authenticated =
        Boolean(response.ok && data?.authenticated) &&
        data?.walletAddress?.toLowerCase() === address.toLowerCase();
      setIsServerAuthorized(authenticated);
      if (!authenticated) {
        setAuthError("");
      }
    } catch (error) {
      console.error("Failed to verify admin session:", error);
      setIsServerAuthorized(false);
    } finally {
      setAuthLoading(false);
    }
  }, [isConnected, address]);

  const startAdminAuth = useCallback(async () => {
    if (!address || !chainId) {
      setAuthError("Please connect wallet and switch to a supported chain.");
      return;
    }

    setIsVerifying(true);
    setAuthError("");
    try {
      const challengeRes = await fetch("/api/admin-auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          walletAddress: address,
          chainId,
        }),
      });
      const challengeData = (await challengeRes.json().catch(() => null)) as AdminAuthChallengeResponse | null;
      if (!challengeRes.ok || !challengeData?.ok || !challengeData.message || !challengeData.challengeToken) {
        setAuthError(challengeData?.message || "Failed to generate auth challenge.");
        return;
      }

      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message: challengeData.message,
      });

      const verifyRes = await fetch("/api/admin-auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          walletAddress: address,
          chainId,
          message: challengeData.message,
          signature,
          challengeToken: challengeData.challengeToken,
        }),
      });
      const verifyData = (await verifyRes.json().catch(() => null)) as AdminAuthVerifyResponse | null;
      if (!verifyRes.ok || !verifyData?.ok || !verifyData.authenticated) {
        setAuthError(verifyData?.message || "Admin auth verification failed.");
        return;
      }

      setIsServerAuthorized(true);
      setAuthError("");
    } catch (error) {
      console.error("Admin auth flow failed:", error);
      setAuthError("Authentication request failed.");
    } finally {
      setIsVerifying(false);
    }
  }, [address, chainId, signMessageAsync]);

  useEffect(() => {
    if (!isAdmin || !address) {
      clearClientAdminState();
      setAuthLoading(false);
      return;
    }
    verifyServerSession();
  }, [isAdmin, address, verifyServerSession, clearClientAdminState]);

  useEffect(() => {
    const previousAddress = previousAddressRef.current;
    const previousChainId = previousChainIdRef.current;
    const hasAddressChanged =
      previousAddress !== null && String(previousAddress).toLowerCase() !== String(address || "").toLowerCase();
    const hasChainChanged = previousChainId !== null && previousChainId !== (chainId ?? null);
    const hasDisconnected = previousAddress !== null && !isConnected;

    if (isServerAuthorized && (hasAddressChanged || hasChainChanged || hasDisconnected)) {
      logoutAdminSession("Wallet context changed");
    }

    previousAddressRef.current = address ?? null;
    previousChainIdRef.current = chainId ?? null;
  }, [address, chainId, isConnected, isServerAuthorized, logoutAdminSession]);

  useEffect(() => {
    const ethereum = (window as any)?.ethereum;
    if (!ethereum?.on) return;

    const handleAccountsChanged = () => {
      if (isServerAuthorized) {
        logoutAdminSession("accountsChanged event");
      }
    };
    const handleChainChanged = () => {
      if (isServerAuthorized) {
        logoutAdminSession("chainChanged event");
      }
    };
    const handleDisconnect = () => {
      if (isServerAuthorized) {
        logoutAdminSession("disconnect event");
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);
    ethereum.on("disconnect", handleDisconnect);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
        ethereum.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [isServerAuthorized, logoutAdminSession]);

  useEffect(() => {
    if (!isAdmin || !address || !isServerAuthorized) return;
    if (loggedWalletRef.current === address) return;
    loggedWalletRef.current = address;

    let chainName = "unknown";
    try {
      chainName = chainId ? getNetworkName(chainId) : "unknown";
    } catch {
      chainName = "unknown";
    }

    const payload = {
      walletAddress: address,
      path: "/admin",
      chainId: chainId ?? null,
      chainName,
    };

    const sendAdminAccessLog = async () => {
      const endpoints = ["/api/admin-access", "/api/admin/access"];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) return;

          if (response.status === 404 || response.status === 405) {
            continue;
          }

          const data = (await response.json().catch(() => null)) as AdminAccessLogResponse | null;
          console.error("Admin access log failed:", data?.message || response.statusText);
          return;
        } catch (error) {
          console.error(`Admin access log request failed on ${endpoint}:`, error);
        }
      }

      console.error("Admin access log failed: no working endpoint found.");
    };

    sendAdminAccessLog();
  }, [isAdmin, address, chainId, isServerAuthorized]);

  if (userDetailsLoading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return <NotFound />;
  }

  if (!isServerAuthorized) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Seo
          title="Admin - WStaking"
          description="Administrative interface for WStaking."
          path="/admin"
          noindex
        />
        <Header />
        <div className="pt-28 md:pt-36 px-4">
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-2xl font-semibold mb-3">Admin Verification Required</h1>
            <p className="text-white/70 mb-5">
              Sign a message with your admin wallet to unlock the admin panel.
            </p>
            {authError ? (
              <p className="mb-4 text-sm text-red-400">{authError}</p>
            ) : null}
            <button
              type="button"
              onClick={startAdminAuth}
              disabled={isVerifying}
              className="inline-flex items-center rounded-lg bg-[#22C55F] px-4 py-2 text-black font-medium disabled:opacity-60"
            >
              {isVerifying ? "Verifying..." : "Verify Admin Access"}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Seo
        title="Admin - WStaking"
        description="Administrative interface for WStaking."
        path="/admin"
        noindex
      />
      <Header />
      <div className="px-4 pt-24 md:pt-28">
        <div className="mx-auto max-w-7xl flex justify-end">
          <button
            type="button"
            onClick={() => logoutAdminSession("Manual logout")}
            className="inline-flex items-center rounded-lg bg-[#22C55F] px-4 py-2 text-sm font-medium text-black hover:bg-[#16a34a]"
          >
            Logout Admin
          </button>
        </div>
      </div>
      <div className="pt-4 md:pt-6">
        <AdminHome />
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
