import { fetchAllUserStakes, formatStakeInfo, FormattedStakeInfo, PaginatedStakeData, UnformattedStakeInfo } from "@/utils/userStakesUtils";
import { getTokenConfigs, SupportedToken, TokenConfig } from "@/configs/tokenConfigs";
import { getNetworkName } from "@/utils/networkUtils";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount, useChainId } from "wagmi";
import { useSelectedToken } from "./SelectedTokenContext";

const ITEMS_PER_PAGE = 6;
const ENABLE_AUTO_TOKEN_FALLBACK =
    import.meta.env.VITE_AUTO_TOKEN_FALLBACK === "true";

interface UserStakesContextType {
    userLockedStakes: FormattedStakeInfo[];
    userUnlockedStakes: FormattedStakeInfo[];
    getPaginatedLockedStakes: (page: number) => PaginatedStakeData;
    getPaginatedUnlockedStakes: (page: number) => PaginatedStakeData;
    fetchUserStakeData: (userAddress: string, tokenAddress: string, chainId?: number) => Promise<void>;
    markStakeAsUnstaked: (stakeTxnHash: string, unstakeTxnHash?: string) => void;
    loading: boolean;
}

const UserStakesContext = createContext<UserStakesContextType>({
    userLockedStakes: [],
    userUnlockedStakes: [],
    getPaginatedLockedStakes: (page: number) => ({
        activeStakes: [],
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        hasStakes: false,
    }),
    getPaginatedUnlockedStakes: (page: number) => ({
        activeStakes: [],
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        hasStakes: false,
    }),
    fetchUserStakeData: async () => { },
    markStakeAsUnstaked: () => {},
    loading: false,
});

export const UserStakesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // data exposed to user
    const [userLockedStakes, setUserLockedStakes] = useState<FormattedStakeInfo[]>([]);
    const [userUnlockedStakes, setUserUnlockedStakes] = useState<FormattedStakeInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { t } = useTranslation();
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { selectedToken, changeSelectedToken } = useSelectedToken();
    const latestFetchIdRef = useRef(0);
    const lastResolvedContextKeyRef = useRef<string | null>(null);

    const sortAllUserStakes = useCallback((allStakes: UnformattedStakeInfo[]) => {
        const lockedStakes: FormattedStakeInfo[] = [];
        const unlockedStakes: FormattedStakeInfo[] = [];

        for (const stake of allStakes) {
            if (stake.unstaked) {
                unlockedStakes.push(formatStakeInfo(stake, t))
            } else {
                lockedStakes.push(formatStakeInfo(stake, t))
            }
        }

        setUserLockedStakes(lockedStakes);
        setUserUnlockedStakes(unlockedStakes);
    }, [t]);

    const fetchUserStakeData = useCallback(async (userAddress: string, tokenAddress: string, currentChainId?: number) => {
        const fetchId = ++latestFetchIdRef.current;
        setLoading(true);
        const requestedChainId = currentChainId ?? chainId;
        const requestContextKey = `${userAddress.toLowerCase()}|${requestedChainId}|${tokenAddress.toLowerCase()}`;

        if (!userAddress || !tokenAddress) {
            if (fetchId === latestFetchIdRef.current) {
                setUserLockedStakes([]);
                setUserUnlockedStakes([]);
                setLoading(false);
            }
            return;
        }

        let allUserStakes = await fetchAllUserStakes(
            userAddress,
            tokenAddress,
            currentChainId
        );

        // Do not overwrite existing stakes with an empty fallback when RPC fails.
        if (allUserStakes === null) {
            // Keep existing list only when fetch failed for the exact same context.
            // If token/chain/user changed and fetch fails, clear old stakes to avoid token mismatch actions.
            if (lastResolvedContextKeyRef.current !== requestContextKey) {
                setUserLockedStakes([]);
                setUserUnlockedStakes([]);
            }
            if (fetchId === latestFetchIdRef.current) {
                setLoading(false);
            }
            return;
        }

        if (
            ENABLE_AUTO_TOKEN_FALLBACK &&
            Array.isArray(allUserStakes) &&
            allUserStakes.length === 0 &&
            typeof currentChainId === "number"
        ) {
            const networkName = getNetworkName(currentChainId);
            const networkTokenConfigs = (getTokenConfigs()[networkName] ||
                {}) as Partial<Record<SupportedToken, TokenConfig>>;
            const candidates = (Object.values(networkTokenConfigs) as TokenConfig[]).filter(
                (tokenConfig) => tokenConfig.address !== tokenAddress
            );

            for (const tokenConfig of candidates) {
                const candidateStakes = await fetchAllUserStakes(
                    userAddress,
                    tokenConfig.address,
                    currentChainId
                );
                if (Array.isArray(candidateStakes) && candidateStakes.length > 0) {
                    allUserStakes = candidateStakes;
                    if (tokenConfig.symbol !== selectedToken.symbol) {
                        changeSelectedToken(tokenConfig.symbol as SupportedToken);
                    }
                    break;
                }
            }
        }
        if (import.meta.env.DEV) {
            console.log("Fetch user stakes for token:", selectedToken.symbol);
            console.log("Fetched stakes count:", allUserStakes.length);
        }
        if (fetchId !== latestFetchIdRef.current) {
            return;
        }
        lastResolvedContextKeyRef.current = requestContextKey;
        sortAllUserStakes(allUserStakes);

        if (fetchId === latestFetchIdRef.current) {
            setLoading(false);
        }
    }, [sortAllUserStakes, selectedToken.symbol, changeSelectedToken, chainId]);

    const markStakeAsUnstaked = useCallback((stakeTxnHash: string, unstakeTxnHash?: string) => {
        if (!stakeTxnHash) return;

        setUserLockedStakes((prevLocked) => {
            const target = prevLocked.find((stake) => stake.txnHash.toLowerCase() === stakeTxnHash.toLowerCase());
            if (!target) return prevLocked;

            // Remove immediately from active cards.
            const nextLocked = prevLocked.filter(
                (stake) => stake.txnHash.toLowerCase() !== stakeTxnHash.toLowerCase()
            );

            // Add to past cards optimistically to avoid stale active-state complaints when RPC lags.
            setUserUnlockedStakes((prevUnlocked) => {
                const alreadyExists = prevUnlocked.some(
                    (stake) => stake.txnHash.toLowerCase() === stakeTxnHash.toLowerCase()
                );
                if (alreadyExists) return prevUnlocked;

                const optimisticUnlocked: FormattedStakeInfo = {
                    ...target,
                    unstaked: true,
                    claimed: true,
                    unstakeTxnHash: unstakeTxnHash || target.unstakeTxnHash,
                };
                return [optimisticUnlocked, ...prevUnlocked];
            });

            return nextLocked;
        });
    }, []);

    const getPaginatedLockedStakes = useCallback((page: number): PaginatedStakeData => {
        const totalItems = userLockedStakes.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return {
            activeStakes: userLockedStakes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
            currentPage: page,
            totalPages,
            totalItems,
            hasStakes: totalItems > 0, // remove later, redundant as can just calculate from activeStakes
        }
    }, [userLockedStakes]);

    const getPaginatedUnlockedStakes = (page: number): PaginatedStakeData => {
        const totalItems = userUnlockedStakes.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        return {
            activeStakes: userUnlockedStakes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
            currentPage: page,
            totalPages,
            totalItems,
            hasStakes: totalItems > 0, // remove later, redundant as can just calculate from activeStakes
        }
    }

    useEffect(() => {
        if (address && isConnected) {
            console.log("user stakes fetch")
            fetchUserStakeData(address, selectedToken.address, chainId);
        }
    }, [address, isConnected, chainId, selectedToken.address, fetchUserStakeData]);

    return (
        <UserStakesContext.Provider
            value={({
                userLockedStakes,
                userUnlockedStakes,
                getPaginatedLockedStakes,
                getPaginatedUnlockedStakes,
                fetchUserStakeData,
                markStakeAsUnstaked,
                loading
            })}
        >
            {children}
        </UserStakesContext.Provider>
    )
}

export const useUserStakes = () => useContext(UserStakesContext);
