import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogTitle,
	Switch,
	Typography,
	TextField,
	IconButton,
	Tooltip,
	styled,
	TooltipProps,
	tooltipClasses,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { readContract, writeContract } from "wagmi/actions";
import { wagmiConfig } from "@/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";

import { loadABI } from "@/utils/abiLoader";
import { useNotification } from "@/components/NotificationProvider";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { getNetworkConfig } from "@/utils/networkUtils";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { customReadContract } from "@/utils/customReadContract";

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
	<Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		maxWidth: 500,
		border: "1px solid #282D29",
		borderRadius: theme.spacing(2),
		padding: `${theme.spacing(2)}`,
		backgroundColor: "rgba(9, 12, 11, 0.9)",
		backdropFilter: "blur(6px)",
	},
}));

const StyledTooltipText = styled(Typography)(({ theme }) => ({
	fontWeight: 500,
	fontSize: 16,
	color: theme.palette.grey[300],
}));

const ControlPanel: React.FC = () => {
	const { showNotification } = useNotification();
	const { address } = useAccount();

	const [systemLoading, setSystemLoading] = useState(false);
	const [systemEnable, setSystemEnable] = useState<null | boolean>(null);
	const [systemEnableDialogOpen, setSystemEnableDialogOpen] = useState(false);
	const [systemEnableDialogTitle, setSystemEnableDialogTitle] = useState("");

	const contractABI = loadABI("contract");

	async function fetchSystemStatus() {
		setSystemLoading(true);

		// 使用ABI取得系統狀態
		const systemStatus = await customReadContract("systemEnabled", []).then((response) => response as boolean);
		setSystemEnable(systemStatus);

		setSystemLoading(false);
	}

	async function toggleSystemStatus() {
		const contractAddress = getNetworkConfig().contractAddress;

		if (address && contractAddress) {
			setSystemLoading(true);
			try {
				const toggleSystemStateTxHash = await (writeContract as any)(wagmiConfig, {
					address: contractAddress as `0x${string}`,
					abi: contractABI,
					functionName: "toggleSystemState",
					args: [],
				});

				const tx = await waitForTransactionReceipt(wagmiConfig, {
					hash: toggleSystemStateTxHash,
					confirmations: 1,
				});

				if (tx.status) {
					fetchSystemStatus();
					return true;
				} else {
					fetchSystemStatus();
					return false;
				}
			} catch (error) {
				showNotification("Toggle system enable failed", "error");
			}

			setSystemLoading(false);
		}
	}

	useEffect(() => {
		fetchSystemStatus();
	}, []);

	function handleSystemEnableToggle(event: React.ChangeEvent<HTMLInputElement>) {
		if (systemEnable) {
			setSystemEnableDialogTitle("Are you sure you want to stop the system?");
		} else {
			setSystemEnableDialogTitle("Are you sure you want to start the system?");
		}
		setSystemEnableDialogOpen(true);
	}

	function processSystemEnableDialogResponse(response: boolean) {
		setSystemEnableDialogOpen(false);

		if (response) {
			toggleSystemStatus();
		}
	}

	return (
		<Box
			sx={{
				display: "grid",
				gap: { xs: 2, md: 3 },
				py: { xs: 0.5, md: 2 },
				px: { xs: 0, sm: 2, md: 4, lg: 6 },
				gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
			}}
		>
		<Box
			sx={{
				border: "1px solid",
				borderColor: "#282D29",
				borderRadius: 4,
				background: "rgba(255,255,255,0.03)",
				backdropFilter: "blur(10px)",
				padding: { xs: 2, md: 3 },
				paddingRight: { xs: 2, md: 7 },
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
			>
				<Box
					sx={{
						justifyContent: "space-between",
						display: "flex",
						alignItems: "center",
						width: "100%",
						gap: 1,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
						<Typography
							sx={{
								color: "grey.400",
								fontSize: { xs: 14, md: 16 },
							}}
						>
							System Enable
						</Typography>
						<StyledTooltip
							title={<StyledTooltipText>Toggles access to the service for users.</StyledTooltipText>}
							placement="right"
						>
							<InfoOutlined
								sx={{
									flexShrink: 0,
									fontSize: { xs: 18, md: 22 },
									color: "grey.400",
								}}
							/>
						</StyledTooltip>
					</Box>
					{systemEnable ? (
						<Box
							sx={{
								borderRadius: 3,
								background: "#22C55F",
								color: "common.black",
								fontWeight: 700,
								fontSize: 14,
								px: 1.8,
							}}
						>
							On
						</Box>
					) : (
						<Box
							sx={{
								borderRadius: 3,
								border: "1px solid",
								borderColor: "#282D29",
								background: "none",
								color: "common.white",
								fontWeight: 700,
								fontSize: 14,
								px: 1.8,
							}}
						>
							Off
						</Box>
					)}
				</Box>
				{!systemLoading ? (
					<Switch checked={systemEnable || false} onChange={handleSystemEnableToggle} />
				) : (
					<CircularProgress size={20} sx={{ marginTop: 1.5 }} />
				)}
				<Dialog open={systemEnableDialogOpen}>
					<DialogTitle>{systemEnableDialogTitle}</DialogTitle>
					<DialogActions
						sx={{
							display: "flex",
							justifyContent: "space-between",
						}}
					>
						<Button
							onClick={() => processSystemEnableDialogResponse(false)}
							variant="contained"
							color="error"
							disableElevation
						>
							Cancel
						</Button>
						<Button onClick={() => processSystemEnableDialogResponse(true)} variant="outlined">
							Confirm
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</Box>
	);
};

export default ControlPanel;
