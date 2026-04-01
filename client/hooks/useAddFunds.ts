import { loadABI } from "@/utils/abiLoader";
import { getNetworkConfig } from "@/utils/networkUtils";
import { convertToBlockchainNumber } from "@/utils/limitDecimalPoint";
import { parseReceipt } from "@/utils/parseReceipt";
import { wagmiConfig } from "@/wagmi";
import { useTranslation } from "react-i18next";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { checkAllowance } from "@/utils/allowanceUtils";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useUserDetails } from "@/contexts/UserDetailsContext";

interface UseAddFundsProps {
	openModal: (
		state: "confirm" | "loading" | "success" | "error" | "newstake" | "newAddFunds",
		config: {
			message: string;
			details?: string[];
		}
	) => void;
	closeModal: () => void;
	fetchTotalStaked: () => void;
	refreshAllStakes: () => void;
	address: string | undefined;
}

const useAddFunds = ({
	openModal,
	closeModal,
	fetchTotalStaked,
	refreshAllStakes,
	address
}: UseAddFundsProps) => {
	const { t } = useTranslation();
	const { selectedToken } = useSelectedToken();
	const { refreshWalletBalance } = useUserDetails();
	const contractABI = loadABI("contract");

	const executeAddFunds = async (txnHash: string, amount: string) => {
		try {
			if (!address) {
				throw new Error("遺失必要參數");
			}

			const amountToAdd = convertToBlockchainNumber(amount);
			const contractAddress = getNetworkConfig().contractAddress;

			openModal("loading", {
				message: t("processingAddFunds"),
			});

			await checkAllowance(amount, address, selectedToken.symbol, openModal, t);

			const addFundsTxnHash = await (writeContract as any)(wagmiConfig, {
				address: contractAddress as `0x${string}`,
				abi: contractABI,
				functionName: "addFund",
				args: [selectedToken.address, txnHash, BigInt(amountToAdd.toFixed())],
			});

			const addFundsReceipt = await waitForTransactionReceipt(wagmiConfig, {
				hash: addFundsTxnHash,
			});

			console.log("addFundsReceipt", addFundsReceipt);

			const parsedReceipt = parseReceipt(addFundsReceipt, ["Fundadded"]);

			if (parsedReceipt.status) {
				// First refresh pass immediately after confirmation.
				await refreshAllStakes?.();
				await fetchTotalStaked?.();
				await refreshWalletBalance?.();

				// Second pass handles RPC/indexer lag so all sections converge
				// (StartStaking balance, Active cards, summaries) without manual refresh.
				setTimeout(() => {
					refreshAllStakes?.();
					fetchTotalStaked?.();
					refreshWalletBalance?.();
				}, 1200);

				openModal("success", {
					message: parsedReceipt.text || t("addFundsSuccess"),
				});

				return true;
			} else {
				openModal("error", {
					message: parsedReceipt.text || t("addFundsFailed"),
				});

				return false;
			}
		} catch (error) {
			console.error("增加基金錯誤:", error);
			openModal("error", { message: t("unexpectedError") });

			return false;
		}
	};

	return {
		executeAddFunds,
	};
};

export default useAddFunds;
