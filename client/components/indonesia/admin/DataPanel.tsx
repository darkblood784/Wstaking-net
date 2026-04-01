import {
	getTokenConfig,
	SupportedToken,
	TOKEN_NOADDRESS_CONFIGS,
	TokenNoaddressConfig,
} from "@/configs/tokenConfigs";
import { Box, CircularProgress, IconButton, SelectChangeEvent, styled, Typography } from "@mui/material";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getAllNetworkConfigs, getNetworkName, NetworkConfig } from "@/utils/networkUtils";
import { customReadContract } from "@/utils/customReadContract";
import { GetAllSupportedTokensResponse } from "@/contexts/SystemDetailsContext";
import { convertToHumanReadNumber } from "@/utils/limitDecimalPoint";
import BigNumber from "bignumber.js";
import NetworkDropdown from "./NetworkDropdown";
import TokenDropdown from "./TokenDropdown";

const PanelContainer = styled(Box)(({ theme }) => ({
	maxWidth: "100%",
	minWidth: 0,
	paddingTop: theme.spacing(0.5),
	paddingBottom: theme.spacing(0.5),
	[theme.breakpoints.up("sm")]: {
		paddingLeft: theme.spacing(1),
		paddingRight: theme.spacing(1),
	},
	[theme.breakpoints.up("md")]: {
		paddingLeft: theme.spacing(2),
		paddingRight: theme.spacing(2),
		paddingTop: theme.spacing(1),
		paddingBottom: theme.spacing(1),
	},
	[theme.breakpoints.up("lg")]: {
		paddingLeft: theme.spacing(4),
		paddingRight: theme.spacing(4),
		paddingTop: theme.spacing(1.5),
		paddingBottom: theme.spacing(1.5),
	},
}));

const PanelWrapper = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	width: "100%",
	minWidth: 0,
	border: "1px solid #282D29",
	borderRadius: theme.spacing(3),
	backgroundColor: "rgba(255, 255, 255, 0.03)",
	backdropFilter: "blur(10px)",
	boxSizing: "border-box",
	overflow: "hidden",
}));

const BottomDataRow = styled(Box)(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "1fr",
	gap: theme.spacing(1.5),
	padding: theme.spacing(2),
	[theme.breakpoints.up("sm")]: {
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		padding: theme.spacing(2),
	},
	[theme.breakpoints.up("lg")]: {
		gap: theme.spacing(0),
		padding: `${theme.spacing(2.5)} ${theme.spacing(1.5)}`,
	},
}));

const DataRow = styled(BottomDataRow)(() => ({
	borderBottom: "1px solid #282D29",
}));

const SelectorsRow = styled(Box)(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "1fr",
	gap: theme.spacing(1.25),
	padding: theme.spacing(2),
	borderBottom: "1px solid #282D29",
	[theme.breakpoints.up("md")]: {
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		padding: theme.spacing(2.5),
	},
	[theme.breakpoints.up("lg")]: {
		padding: `${theme.spacing(2.75)} ${theme.spacing(3)}`,
	},
}));

const DataBox = styled(Box)(({ theme }) => ({
	minWidth: 0,
	border: "1px solid rgba(255,255,255,0.08)",
	borderRadius: theme.spacing(2),
	padding: theme.spacing(1.5),
	background: "rgba(255,255,255,0.02)",
	[theme.breakpoints.up("lg")]: {
		background: "transparent",
		border: "none",
		borderRadius: 0,
		padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
		"&:not(:last-child)": {
			borderRight: "1px solid #282D29",
		},
	},
}));

const DataBoxWrapper: React.FC<{ title: string; value: string | undefined; token: string; loading: boolean }> = ({
	title,
	value,
	token,
	loading,
}) => {
	if (loading) {
		return (
			<DataBox>
				<CircularProgress size={22} sx={{ color: "#12B980" }} />
			</DataBox>
		);
	}

	return (
		<DataBox>
			<Typography sx={{ color: "grey.400", fontSize: { xs: 12, md: 13 } }}>{title}</Typography>
			<Typography sx={{ fontWeight: 700, color: "white", fontSize: { xs: 15, md: 16 }, mt: 0.5, wordBreak: "break-word" }}>
				{value ?? "N/A"} {token}
			</Typography>
		</DataBox>
	);
};

interface DataPanelProps {
	selectedNetworks: number[];
	selectedToken: SupportedToken | "";
	setSelectedNetworks: Dispatch<SetStateAction<number[]>>;
	setSelectedToken: Dispatch<SetStateAction<SupportedToken | "">>;
}

type GetTokenAggResponse = [bigint, bigint, bigint, bigint, bigint];
type TokenAggData = {
	totalStaked: BigNumber;
	totalActive: BigNumber;
	rewardsGranted: BigNumber;
	ungrantedRewards: BigNumber;
	stakingUsersCount: BigNumber;
};

const DataPanel: React.FC<DataPanelProps> = ({
	selectedNetworks,
	selectedToken,
	setSelectedNetworks,
	setSelectedToken,
}) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [panelData, setPanelData] = useState<TokenAggData | null>(null);
	const [supportedTokens, setSupportedTokens] = useState<TokenNoaddressConfig[]>([]);
	const supportedNetworks = getAllNetworkConfigs();

	const fetchNetworkSupportedTokenConfigs = async (chainId: number): Promise<TokenNoaddressConfig[]> => {
		const response = (await customReadContract("getAllSupportedTokens", [], chainId)) as GetAllSupportedTokensResponse;
		return response[1].map((tokenName) => TOKEN_NOADDRESS_CONFIGS[tokenName]);
	};

	const fetchSupportedTokens = async () => {
		if (selectedNetworks.length === 0) {
			setSelectedToken("");
			return;
		}
		const networksArray = Object.values(supportedNetworks).filter((network) =>
			selectedNetworks.includes(network.chainId),
		);
		const tokenArrays = await Promise.all(
			networksArray.map(async (network: NetworkConfig) => fetchNetworkSupportedTokenConfigs(network.chainId)),
		);
		setSupportedTokens([...new Set(tokenArrays.flat())]);
	};

	const fetchPanelData = async (chains: number[], currentToken: SupportedToken | "") => {
		setLoading(true);

		if (currentToken === "") {
			setLoading(false);
			setPanelData(null);
			return;
		}

		const calls = chains.reduce<Promise<BigNumber[]>[]>((acc, chainId) => {
			try {
				const tokenAddress = getTokenConfig(currentToken, getNetworkName(chainId)).address;
				const promise = new Promise<BigNumber[]>((resolve, reject) => {
					customReadContract("getTokenAgg", [tokenAddress], chainId)
						.then((response) => {
							const typedResponse = response as GetTokenAggResponse;
							const converted = typedResponse.map((value, index) => {
								const bignumber = new BigNumber(value.toString());
								if (index === 4) return bignumber;
								return convertToHumanReadNumber(bignumber.toString(), chainId);
							});
							resolve(converted);
						})
						.catch(reject);
				});
				acc.push(promise);
			} catch (_error) {
				// token unsupported on this chain
			}
			return acc;
		}, []);

		if (calls.length === 0) {
			setLoading(false);
			setPanelData(null);
			return;
		}

		const data = await Promise.all(calls);
		const rawPanelData = data.reduce<BigNumber[]>((acc, networkData) => {
			return networkData.map((value, i) => (acc[i] || new BigNumber(0)).plus(value));
		}, []);

		setPanelData({
			totalStaked: rawPanelData[0],
			totalActive: rawPanelData[1],
			rewardsGranted: rawPanelData[2],
			ungrantedRewards: rawPanelData[3],
			stakingUsersCount: rawPanelData[4],
		});

		setLoading(false);
	};

	const handleSelectedNetworksChange = (event: SelectChangeEvent<unknown>) => {
		const value = event.target.value;
		setSelectedNetworks(typeof value === "string" ? value.split(",").map(Number) : (value as number[]));
	};

	useEffect(() => {
		if (selectedToken === "") return;
		if (!supportedTokens.map((token) => token.symbol).includes(selectedToken)) setSelectedToken("");
	}, [supportedTokens, selectedToken, setSelectedToken]);

	useEffect(() => {
		fetchSupportedTokens();
	}, [selectedNetworks]);

	useEffect(() => {
		fetchPanelData(selectedNetworks, selectedToken);
	}, [selectedNetworks, selectedToken]);

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					mb: { xs: 0.75, md: 1 },
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Typography
					sx={{
						fontSize: { xs: 24, sm: 32, md: 42, lg: 48 },
						fontWeight: 700,
						flexGrow: 1,
					}}
				>
					Data Panel
				</Typography>
				<IconButton
					onClick={() => fetchPanelData(selectedNetworks, selectedToken)}
					sx={{
						color: "common.white",
						padding: 0.5,
						zIndex: 10,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						"&:hover": {
							backgroundColor: "rgba(0, 0, 0, 0.7)",
						},
						width: { xs: 40, md: 48 },
						height: { xs: 40, md: 48 },
					}}
					disabled={loading}
				>
					{!loading ? <RefreshIcon sx={{ fontSize: { xs: 24, md: 32 } }} /> : <CircularProgress size={26} />}
				</IconButton>
			</Box>
			<PanelContainer>
				<PanelWrapper>
					<SelectorsRow>
						<Box sx={{ minWidth: 0 }}>
							<NetworkDropdown
								selectedNetworks={selectedNetworks}
								setSelectedNetworks={setSelectedNetworks}
							/>
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<TokenDropdown
								selectedToken={selectedToken}
								setSelectedToken={setSelectedToken}
								supportedTokens={supportedTokens}
							/>
						</Box>
					</SelectorsRow>
					{[
						[
							{ title: "Total Staked", value: panelData?.totalStaked.toFixed(4), token: selectedToken },
							{ title: "Actively Staking", value: panelData?.totalActive.toFixed(4), token: selectedToken },
						],
						[
							{ title: "Number of Staking Users", value: panelData?.stakingUsersCount.toFixed(0), token: "" },
							{ title: "Total Rewards Granted", value: panelData?.rewardsGranted.toFixed(10), token: selectedToken },
							{ title: "Total Ungranted Rewards", value: panelData?.ungrantedRewards.toFixed(10), token: selectedToken },
						],
					].map((itemRow, index, array) => {
						const isLastRow = index === array.length - 1;
						const RowComponent = isLastRow ? BottomDataRow : DataRow;

						return (
							<RowComponent
								key={`datarow.${index}`}
								sx={{
									gridTemplateColumns: {
										xs: "1fr",
										sm: itemRow.length === 2 ? "repeat(2, minmax(0, 1fr))" : "1fr",
										md: itemRow.length === 2 ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
									},
								}}
							>
								{itemRow.map((item) => (
									<DataBoxWrapper
										key={`dataitem.${item.title}`}
										title={item.title}
										value={item.value}
										token={item.token}
										loading={loading}
									/>
								))}
							</RowComponent>
						);
					})}
				</PanelWrapper>
			</PanelContainer>
		</Box>
	);
};

export default DataPanel;
