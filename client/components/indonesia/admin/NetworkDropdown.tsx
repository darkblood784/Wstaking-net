import {
	Box,
	Checkbox,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Select,
	SelectChangeEvent,
	styled,
	Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getAllNetworkConfigs, getNetworkConfig, getNetworkName } from "@/utils/networkUtils";

export const Dropdown = styled(Select)(({ theme }) => ({
	flex: 1,
	color: "white",
	backgroundColor: "rgba(255, 255, 255, 0.03)",
	minWidth: 0,
	paddingRight: theme.spacing(1),
	"& .MuiSelect-icon": {
		color: "white",
		fontSize: 28,
	},
	"& .MuiOutlinedInput-notchedOutline": {
		borderColor: "#282D29",
	},
	"&:hover .MuiOutlinedInput-notchedOutline": {
		borderColor: "#22C55F",
	},
	"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
		borderColor: "#22C55F",
	},
	"& .MuiSelect-select": {
		paddingRight: theme.spacing(5),
		margin: 0,
		minHeight: "auto",
		paddingTop: theme.spacing(1.25),
		paddingBottom: theme.spacing(1.25),
	},
}));

export const DropdownMenuProps = {
	PaperProps: {
		sx: {
			marginTop: 0.5,
			backgroundColor: "rgba(9, 12, 11, 0.9)",
			backdropFilter: "blur(8px)",
			border: "1px solid",
			borderColor: "#282D29",
			borderRadius: 4,
			boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
			maxWidth: 360,
			maxHeight: "40.5vh",
			scrollbarWidth: "thin",
			scrollbarColor: "transparent transparent",
			"& .MuiList-root": {
				paddingTop: 0,
				paddingBottom: 0,
			},
		},
	},
};

export const DropdownInput = styled(OutlinedInput)(({ theme }) => ({
	backgroundColor: "rgba(255, 255, 255, 0.03)",
	color: "#fff",
	borderRadius: theme.spacing(2),
	"& fieldset": {
		borderColor: "#282D29",
	},
	"& .MuiOutlinedInput-notchedOutline .MuiNotchedOutlined-root span": {
		color: "white !important",
	},
	"&:hover fieldset": {
		borderColor: "#22C55F",
	},
	"&.Mui-focused fieldset": {
		borderColor: "#22C55F",
	},
	"& input": {
		fontFeatureSettings: "'tnum' on, 'lnum' on",
		textAlign: "right",
		paddingRight: "8px",
		fontSize: "1rem",
		letterSpacing: "0.5px",
	},
	"& .MuiFormLabel-root": {
		color: "rgba(255, 255, 255, 0.7)",
	},
	"& .MuiFormHelperText-root": {
		fontSize: "0.75rem",
	},
}));

export const FadedText = styled(Typography)(({ theme }) => ({
	opacity: 0.5,
}));

export const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
	paddingTop: theme.spacing(1.5),
	paddingBottom: theme.spacing(1.5),
	color: "white",
	"&:hover": {
		backgroundColor: "rgba(34, 197, 95, 0.12)",
	},
	"&.Mui-selected": {
		backgroundColor: "rgba(34, 197, 95, 0.22)",
		"&:hover": {
			backgroundColor: "rgba(34, 197, 95, 0.28)",
		},
	},
	"& .MuiCheckbox-root": {
		padding: 0,
		color: "white",
	},
	"&:not(:last-child)": {
		borderBottom: "1px solid",
		borderColor: "#282D29",
	},
}));

export const CustomMenuItemInnerBox = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
}));

interface NetworkDropdownProps {
	selectedNetworks: number[];
	setSelectedNetworks: (networks: number[]) => void;
}

const NetworkDropdown: React.FC<NetworkDropdownProps> = ({ selectedNetworks, setSelectedNetworks }) => {
	const supportedNetworks = getAllNetworkConfigs();

	const handleSelectedNetworksChange = (event: SelectChangeEvent<unknown>) => {
		const value = event.target.value;
		setSelectedNetworks(typeof value === "string" ? value.split(",").map(Number) : (value as number[]));
	};

	return (
		<Dropdown
			multiple
			displayEmpty
			fullWidth
			value={selectedNetworks}
			onChange={handleSelectedNetworksChange}
			input={<DropdownInput />}
			IconComponent={ExpandMoreIcon}
			MenuProps={DropdownMenuProps}
			renderValue={(selected) => {
				if (selectedNetworks.length === 0) return <FadedText>Select networks...</FadedText>;
				return (
					<Box display={"flex"} gap={0.75} flexWrap="wrap" alignItems="center">
						{(selected as number[]).map(getNetworkConfig).map((config, index) => (
							<Box
								key={`network.icon.${index}`}
								component="img"
								src={config.icon}
								alt={config.name}
								height={20}
							/>
						))}
					</Box>
				);
			}}
		>
			{Object.values(supportedNetworks).map((network) => (
				<CustomMenuItem key={`network.${network.chainId}`} value={network.chainId}>
					<CustomMenuItemInnerBox>
						<Checkbox checked={selectedNetworks.includes(network.chainId)} />
						<Box component="img" src={network.icon} alt={network.name} height={20} />
						<ListItemText primary={network.name} />
					</CustomMenuItemInnerBox>
				</CustomMenuItem>
			))}
		</Dropdown>
	);
};

export default NetworkDropdown;
