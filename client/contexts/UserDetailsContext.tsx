import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSelectedToken } from "./SelectedTokenContext";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "@/wagmi";
import { loadABI } from "@/utils/abiLoader";
import { convertToHumanReadNumber } from "@/utils/limitDecimalPoint";
import { useAccount } from "wagmi";
import { getNetworkConfig } from "@/utils/networkUtils";
import { customReadContract } from "@/utils/customReadContract";

interface UserDetailsContextType {
	walletBalance: string;
	refreshWalletBalance: () => Promise<void>;
	isAdmin: boolean;
	refreshIsAdmin: () => Promise<void>;
	userDetailsLoading: boolean;
}

const UserDetailsContext = createContext<UserDetailsContextType>({
	walletBalance: "0",
	refreshWalletBalance: async () => {},
	isAdmin: false,
	refreshIsAdmin: async () => {},
	userDetailsLoading: false,
});

export const UserDetailsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [userDetailsLoading, setUserDetailsLoading] = useState<boolean>(false);

	const [walletBalance, setWalletBalance] = useState<string>("0");
	const [isAdmin, setIsAdmin] = useState<boolean>(false);

	const { selectedToken } = useSelectedToken();
	const { isConnected, address } = useAccount();
	const latestBalanceRequestRef = useRef(0);

	const erc20ABI = loadABI("erc20");

	const refreshWalletBalance = useCallback(async () => {
		const requestId = ++latestBalanceRequestRef.current;
		if (!isConnected || !address) {
			if (requestId === latestBalanceRequestRef.current) {
				setWalletBalance("0");
			}
			return;
		}

		try {
			const balance = await (readContract as any)(wagmiConfig, {
				address: selectedToken.address as `0x${string}`,
				abi: erc20ABI,
				functionName: "balanceOf",
				args: [address],
			});

			const formattedBalance = balance ? convertToHumanReadNumber(balance.toString()).toString() : "0";
			if (requestId === latestBalanceRequestRef.current) {
				setWalletBalance(formattedBalance);
			}
		} catch (error) {
			console.error("Error fetching wallet balance:", error);
			if (requestId === latestBalanceRequestRef.current) {
				setWalletBalance("0");
			}
		}
	}, [isConnected, address, selectedToken]);

	const refreshIsAdmin = useCallback(async () => {
		if (!isConnected || !address) {
			setIsAdmin(false);
			return;
		}
		try {
			const isAdminFromContract = await customReadContract("admins", [address as `0x${string}`]).then(
				(response) => response as boolean
			);
			setIsAdmin(isAdminFromContract);
		} catch (error) {
			console.error("Error fetching admin status:", error);
			setIsAdmin(false);
		}
	}, [isConnected, address]);

	useEffect(() => {
		setUserDetailsLoading(true);

		// only set loading to false once all data has been fetched
		Promise.all([refreshWalletBalance(), refreshIsAdmin()]).finally(() => {
			setUserDetailsLoading(false);
		});
	}, [refreshWalletBalance, refreshIsAdmin, selectedToken]);

	return (
		<UserDetailsContext.Provider
			value={{
				walletBalance,
				refreshWalletBalance,
				isAdmin,
				refreshIsAdmin,
				userDetailsLoading,
			}}
		>
			{children}
		</UserDetailsContext.Provider>
	);
};

export const useUserDetails = () => useContext(UserDetailsContext);
