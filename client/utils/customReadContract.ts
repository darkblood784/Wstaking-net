import { wagmiConfig } from "@/wagmi";
import { readContract } from "wagmi/actions";
import { loadABI } from "./abiLoader";
import { getNetworkConfig, getNetworkName } from "./networkUtils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const customReadContract = async (functionName: string, args: any[], chainId?: number) => {
	const params = {
		address: getNetworkConfig(chainId).contractAddress as `0x${string}`,
		abi: loadABI("contract"),
		functionName,
		args,
		chainId: chainId ?? getNetworkConfig().chainId,
	};

	const maxAttempts = 2;
	let lastError: any;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await (readContract as any)(wagmiConfig, params);
		} catch (error: any) {
			lastError = error;
			const message = String(error?.shortMessage || error?.message || error || "");

			// Contract-level "no stakes" custom error; treat as empty result.
			if (message.includes("Nolockedstakesfound()")) {
				return [];
			}

			const retryable =
				message.includes("over rate limit") ||
				message.includes("Request Timeout") ||
				message.includes("timeout") ||
				message.includes("408");

			if (!retryable || attempt === maxAttempts) {
				break;
			}

			await wait(200);
		}
	}

	console.error(`Error calling ${functionName} on ${getNetworkName(chainId)}:`, lastError);
	return [];
};
