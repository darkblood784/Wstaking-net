import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { getNetworkName } from "@/utils/networkUtils";

const SESSION_KEY = "wstaking:wallet:active-session";

function getSessionValue(): string {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function setSessionValue(value: string): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, value);
  } catch {
    // ignore storage failures
  }
}

function clearSessionValue(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage failures
  }
}

export default function WalletConnectLogger() {
  const { address, chainId, isConnected } = useAccount();
  const prevConnectedRef = useRef<boolean>(false);
  const prevAddressRef = useRef<string>("");
  const prevChainIdRef = useRef<number>(0);
  const hydratedSessionRef = useRef<boolean>(false);
  const hasObservedConnectedRef = useRef<boolean>(false);

  function postWalletEvent(
    eventType: "connect" | "disconnect",
    walletAddress: string,
    normalizedChainId: number,
    chainName: string
  ) {
    fetch("/api/wallet-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        walletAddress,
        chainId: normalizedChainId || null,
        chainName,
        path: window.location?.pathname || "/",
      }),
    })
      .then((res) => {
        if (res.ok) return;
        return res.json().catch(() => null).then((body) => {
          console.error(`Wallet ${eventType} log failed:`, body?.message || res.statusText);
        });
      })
      .catch((error) => {
        console.error(`Wallet ${eventType} log request failed:`, error);
      });
  }

  useEffect(() => {
    if (!hydratedSessionRef.current) {
      const stored = getSessionValue();
      if (stored) {
        const [storedAddress, storedChainId] = stored.split("|");
        prevConnectedRef.current = true;
        prevAddressRef.current = String(storedAddress || "").toLowerCase();
        prevChainIdRef.current = Number.parseInt(String(storedChainId || "0"), 10) || 0;
      }
      hydratedSessionRef.current = true;
    }

    if (!isConnected || !address) {
      if (hasObservedConnectedRef.current && prevConnectedRef.current && prevAddressRef.current) {
        let previousChainName = "unknown";
        try {
          previousChainName = getNetworkName(prevChainIdRef.current) || "unknown";
        } catch {
          previousChainName = "unknown";
        }

        postWalletEvent(
          "disconnect",
          prevAddressRef.current,
          prevChainIdRef.current,
          previousChainName
        );
      }

      prevConnectedRef.current = false;
      prevAddressRef.current = "";
      prevChainIdRef.current = 0;
      hasObservedConnectedRef.current = false;
      clearSessionValue();
      return;
    }

    const normalizedAddress = String(address).toLowerCase();
    const normalizedChainId = Number.isFinite(Number(chainId)) ? Number(chainId) : 0;
    const isNewConnectionEvent =
      !prevConnectedRef.current ||
      prevAddressRef.current !== normalizedAddress ||
      prevChainIdRef.current !== normalizedChainId;

    if (!isNewConnectionEvent) {
      hasObservedConnectedRef.current = true;
      return;
    }

    let chainName = "unknown";
    try {
      chainName = getNetworkName(chainId) || "unknown";
    } catch {
      chainName = "unknown";
    }

    postWalletEvent("connect", normalizedAddress, normalizedChainId, chainName);

    prevConnectedRef.current = true;
    prevAddressRef.current = normalizedAddress;
    prevChainIdRef.current = normalizedChainId;
    hasObservedConnectedRef.current = true;
    setSessionValue(`${normalizedAddress}|${normalizedChainId}`);
  }, [address, chainId, isConnected]);

  return null;
}
