import { SupportedToken, TokenNoaddressConfig } from "@/configs/tokenConfigs";
import { ListItemText } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ReactNode } from "react";
import { CustomMenuItem, CustomMenuItemInnerBox, Dropdown, DropdownInput, DropdownMenuProps, FadedText } from "./NetworkDropdown";

interface TokenDropdownProps {
    selectedToken: SupportedToken | "";
    setSelectedToken: (token: SupportedToken | "") => void;
    supportedTokens: TokenNoaddressConfig[];
}

const TokenDropdown: React.FC<TokenDropdownProps> = ({ selectedToken, setSelectedToken, supportedTokens }) => {
	return (
		<Dropdown
			displayEmpty
			fullWidth
			value={selectedToken}
			onChange={(e) => setSelectedToken(e.target.value as SupportedToken)}
			input={<DropdownInput />}
			IconComponent={ExpandMoreIcon}
			MenuProps={DropdownMenuProps}
			renderValue={(selected) => {
				if (selectedToken === "") return <FadedText>Select a token</FadedText>;
				return selected as ReactNode;
			}}
		>
			<CustomMenuItem value={""}>
				<ListItemText primary={"Select a token"} />
			</CustomMenuItem>
			{supportedTokens.map((token) => (
				<CustomMenuItem key={`token.${token.symbol}`} value={token.symbol}>
					<CustomMenuItemInnerBox>
						<img src={token.icon} alt={token.symbol} height={18} width={18} />
						<ListItemText primary={token.symbol} />
					</CustomMenuItemInnerBox>
				</CustomMenuItem>
			))}
		</Dropdown>
	);
};

export default TokenDropdown;
