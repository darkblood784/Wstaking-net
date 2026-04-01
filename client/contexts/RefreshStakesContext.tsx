import { createContext, useCallback, useContext, useState } from "react";
import { useUserStakes } from "./UserStakesContext";
import { useAccount, useChainId } from "wagmi";
import { useSelectedToken } from "./SelectedTokenContext";
import { useUserDetails } from "./UserDetailsContext";
import { useSystemDetails } from "./SystemDetailsContext";

interface RefreshStakesContextType {
    setRefreshLockedStakes: (refreshStakes: () => () => Promise<void>) => void;
    setRefreshUnlockedStakes: (refreshStakes: () => () => Promise<void>) => void;
    refreshAllStakes: () => Promise<void>;
}

const RefreshStakesContext = createContext<RefreshStakesContextType>({
    setRefreshLockedStakes: () => {},
    setRefreshUnlockedStakes: () => {},
    refreshAllStakes: async () => {},
});

export const RefreshStakesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [refreshLockedStakes, setRefreshLockedStakes] = useState<(() => Promise<void>) | null>(null);
    const [refreshUnlockedStakes, setRefreshUnlockedStakes] = useState<(() => Promise<void>) | null>(null);
    const { fetchUserStakeData } = useUserStakes();
    const { address } = useAccount();
    const chainId = useChainId();
    const { selectedToken } = useSelectedToken();
    const { refreshWalletBalance } = useUserDetails();
    const { fetchTotalStaked } = useSystemDetails();

    const runSingleRefreshPass = useCallback(async () => {
        if (!address) {
            return;
        }

        try {
            // Fetch user stake data first
            await fetchUserStakeData(address, selectedToken.address, chainId);
            
            // Then refresh locked and unlocked stakes if available
            if (refreshLockedStakes) {
                await refreshLockedStakes();
            }
            if (refreshUnlockedStakes) {
                await refreshUnlockedStakes();
            }

            // Update wallet balance and total staked
            await refreshWalletBalance();
            await fetchTotalStaked();
        } catch (error) {
            console.error("Error refreshing stakes:", error);
        }
    }, [address, selectedToken.address, chainId, fetchUserStakeData, refreshLockedStakes, refreshUnlockedStakes, refreshWalletBalance, fetchTotalStaked]);

    const refreshAllStakes = useCallback(async () => {
        // Immediate pass (awaited) for fast UI update.
        await runSingleRefreshPass();

        // Follow-up passes for RPC/indexer lag so UI converges without manual refresh.
        setTimeout(() => { void runSingleRefreshPass(); }, 1200);
        setTimeout(() => { void runSingleRefreshPass(); }, 3200);
    }, [runSingleRefreshPass]);

    return (
        <RefreshStakesContext.Provider
            value={({
                setRefreshLockedStakes,
                setRefreshUnlockedStakes,
                refreshAllStakes
            })}
        >
            {children}
        </RefreshStakesContext.Provider>
    )
}

export const useRefreshStakes = () => useContext(RefreshStakesContext);
