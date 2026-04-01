import React from "react";
import { Box, MenuItem, Select, Typography, styled, useTheme } from "@mui/material";
import { SupportedToken } from "@/configs/tokenConfigs";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useSystemDetails } from "@/contexts/SystemDetailsContext";

const StyledSelect = styled(Select)(({ theme }) => ({
	backgroundColor: "rgb(10, 10, 10)",
	color: "white",
	textAlign: "center",
	fontSize: "1.4rem",
	fontWeight: 600,
	flex: 1,
	paddingRight: theme.spacing(2),
	"& .MuiSelect-icon": {
		color: "white",
		fontSize: 36,
	},
	"& .MuiOutlinedInput-notchedOutline": {
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	"& .MuiSelect-select": {
		paddingRight: theme.spacing(6),
		margin: 0,
	},
}));

const StyledSelectMenuProps = {
	PaperProps: {
		sx: {
			marginTop: 0.5,
			backgroundColor: "rgb(0, 0, 0, 0.1)",
			backdropFilter: "blur(8px)",
			border: "1px solid",
			borderColor: "grey.600",
			borderRadius: 4,
			boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
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

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
	paddingTop: theme.spacing(1.5),
	paddingBottom: theme.spacing(1.5),
	color: "white",
	"&:hover": {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
	},
	"&.Mui-selected": {
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		"&:hover": {
			backgroundColor: "rgba(255, 255, 255, 0.23)",
		},
	},
	"&:not(:last-child)": {
		borderBottom: "1px solid",
		borderColor: theme.palette.grey[600],
	},
}));

const TokenBox = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: 16,
});

const AssetSelector: React.FC = ({ ...rest }) => {
	const theme = useTheme();

	const { selectedToken, changeSelectedToken } = useSelectedToken();
	const { supportedTokens } = useSystemDetails();

	return (
		<StyledSelect
			value={selectedToken.symbol}
			onChange={(e) => changeSelectedToken(e.target.value as SupportedToken)}
			variant="standard"
			disableUnderline
			IconComponent={ExpandMoreIcon}
			MenuProps={StyledSelectMenuProps}
			{...rest}
		>
			{Object.entries(supportedTokens).map(([name, config]) => (
				<StyledMenuItem key={name} value={config.symbol}>
					<TokenBox>
						<img src={config.icon} alt={config.symbol} height={60} />
						<Typography
							sx={{
								fontSize: config.symbol.length > 4 ? 18 : 28,
								fontWeight: 600,
								flex: 1,
							}}
						>
							{config.symbol}
						</Typography>
					</TokenBox>
				</StyledMenuItem>
			))}
		</StyledSelect>
	);
};

export default AssetSelector;
