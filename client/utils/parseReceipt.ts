import { Interface } from "ethers";
import { loadABI } from "./abiLoader";

interface ParsedReceipt {
	status: boolean;
	text: string;
	internalTxnHash: string;
}

interface ParsedLogResult {
	status: boolean | null;
	text: string;
	internalTxnHash: string;
}

interface ParsedEvent {
	name: string;
	details: string;
	txnHash: string;
}

const parseLogs = (logs: any, preferredEventNames: string[] = []): ParsedLogResult => {
	const contractABI = loadABI("contract");
	const intface = new Interface(contractABI);

	const parsedEvents: ParsedEvent[] = [];

	for (const log of logs) {
		try {
			const parsed = intface.parseLog(log);
			const args = parsed?.args || [];
			const inputs = parsed?.fragment.inputs || [];

			if (!args.length) {
				continue;
			}

			const object: { [key: string]: string } = {};
			for (let i = 0; i < args.length; i++) {
				const key = inputs[i]?.name || `arg${i}`;
				object[key] = String(args[i]);
			}

			const details = object.details || object.message || "";
			const txnHash =
				object.txnHash ||
				object.txHash ||
				object.claimedTxnHash ||
				object.unstakeTxnHash ||
				"";

			if (details || txnHash) {
				parsedEvents.push({
					name: parsed?.name || "",
					details,
					txnHash,
				});
			}
		} catch {
			// Ignore logs that don't match current ABI/event shape.
			continue;
		}
	}

	const successPriorityEvents = new Set([
		"Staked",
		"StakeRenewed",
		"Fundadded",
		"Unstaked",
		"PartialUnstaked",
		"RewardsClaimed",
	]);

	const preferredEventSet = new Set(preferredEventNames);

	// A ClaimInsufficientHotWalletBalance event means the tx succeeded on-chain
	// but the hot wallet had no funds — always treat this as failure and surface
	// the accompanying Notification message (or fall back to a default).
	const hasInsufficientBalance = parsedEvents.some(
		(e) => e.name === "ClaimInsufficientHotWalletBalance"
	);

	const prioritized =
		(preferredEventSet.size > 0
			? [...parsedEvents].reverse().find((event) => preferredEventSet.has(event.name))
			: undefined) ||
		[...parsedEvents].reverse().find((event) => successPriorityEvents.has(event.name)) ||
		// Failure notifications (3::...) must beat plain txnHash events so that
		// ClaimInsufficientHotWalletBalance + Notification combos are caught correctly.
		[...parsedEvents].reverse().find((event) => event.details.startsWith("3::")) ||
		[...parsedEvents].reverse().find((event) => event.txnHash) ||
		[...parsedEvents].reverse().find((event) => event.details);

	const message = prioritized?.details || "";
	const internalTxnHash = prioritized?.txnHash || "";

	let status: boolean | null = null;
	const text = message.replace(/^\d+::?/, "");
	if (hasInsufficientBalance && !message) {
		// Hot-wallet out of funds but no Notification details were parsed —
		// force a clear failure with a fallback message.
		return {
			status: false,
			text: "Network congestion, please wait a few hours and try again.",
			internalTxnHash,
		};
	}
	if (message.startsWith("3::")) {
		status = false;
	} else if (message) {
		status = true;
	}

	return {
		status,
		text: text,
		internalTxnHash,
	};
};

export const parseReceipt = (receipt: any, preferredEventNames: string[] = []): ParsedReceipt => {
	const parsed = parseLogs(receipt?.logs || [], preferredEventNames);
	if (parsed.status !== null) {
		return {
			status: parsed.status,
			text: parsed.text,
			internalTxnHash: parsed.internalTxnHash,
		};
	}

	const receiptStatus = String(receipt?.status || "").toLowerCase();
	const isSuccess =
		receiptStatus === "success" ||
		receiptStatus === "1" ||
		receiptStatus === "0x1" ||
		receiptStatus === "true" ||
		receipt?.status === 1 ||
		receipt?.status === 1n ||
		receipt?.status === true;

	if (parsed.text || parsed.internalTxnHash) {
		return {
			status: isSuccess,
			text: parsed.text,
			internalTxnHash: parsed.internalTxnHash,
		};
	}

	return {
		status: isSuccess,
		text: parsed.text,
		internalTxnHash: parsed.internalTxnHash,
	};
};
