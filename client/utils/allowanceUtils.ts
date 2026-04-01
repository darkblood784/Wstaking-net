import { loadABI } from "./abiLoader";
import { convertToBlockchainNumber } from "./limitDecimalPoint";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { wagmiConfig } from "@/wagmi";
import { getNetworkConfig, getNetworkName } from "./networkUtils";
import { TFunction } from "i18next";
import BigNumber from "bignumber.js";
import { getTokenConfig, SupportedToken } from "@/configs/tokenConfigs";

type openModalType = (
	state: "confirm" | "loading" | "success" | "error" | "newstake",
	config: {
		message: string;
		details?: string[];
	}
) => void;

export const checkAllowance = async (
	amount: string,
	address: string,
	selectedToken: SupportedToken,
	openModal: openModalType,
	t: TFunction<"translation", undefined>
) => {
	if (!address) {
		throw new Error("遺失必要參數");
	}

	const tokenConfig = getTokenConfig(selectedToken, getNetworkName());

	const erc20ABI = loadABI("erc20");
	const blockchainAmount = convertToBlockchainNumber(amount);
	const contractAddress = getNetworkConfig().contractAddress;

	const tokenContract = {
		address: tokenConfig.address as `0x${string}`,
		abi: erc20ABI,
	};

	const allowance = await (readContract as any)(wagmiConfig, {
		address: tokenContract.address,
		abi: tokenContract.abi,
		functionName: "allowance",
		args: [address as `0x${string}`, contractAddress as `0x${string}`],
	}).then((response) => new BigNumber(response?.toString() || "0"));

	if (allowance.isLessThan(blockchainAmount)) {
		openModal("loading", { message: t("authorizationTransactionInProgress") });
		const approveTxHash = await (writeContract as any)(wagmiConfig, {
			address: tokenContract.address as `0x${string}`,
			abi: tokenContract.abi,
			functionName: "approve",
			args: [contractAddress, BigInt(blockchainAmount.toFixed())],
		});

		const approveReceipt = await waitForTransactionReceipt(wagmiConfig, {
			hash: approveTxHash,
			confirmations: 1
		});
		if (!approveReceipt.status) {
			throw new Error("Allowance authorization failed.");
		}
	}
};
