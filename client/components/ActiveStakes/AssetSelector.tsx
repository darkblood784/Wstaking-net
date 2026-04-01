import React from "react";
import {
  Box,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { getTokenConfigs, SupportedToken } from "@/configs/tokenConfigs";
import { getNetworkName } from "@/utils/networkUtils";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useChainId } from "wagmi";

const AssetSelector: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chainId = useChainId();
  type NetworkTokenConfig = { symbol: SupportedToken; icon: string };

  const tokenConfigs = getTokenConfigs();
  const networkTokenConfigs = tokenConfigs[getNetworkName(chainId)] || {};

  const { selectedToken, changeSelectedToken } = useSelectedToken();

  return (
    <Select
      value={selectedToken.symbol}
      onChange={(e) => changeSelectedToken(e.target.value as SupportedToken)}
      variant="standard"
      disableUnderline
      IconComponent={ExpandMoreIcon}
      MenuProps={{
        PaperProps: {
          sx: {
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
      }}
      sx={{
        backgroundColor: "rgb(10, 10, 10)",
        color: "white",
        textAlign: "center",
        fontSize: "1.4rem",
        fontWeight: 600,
        flex: "1",
        paddingRight: 2,
        "& .MuiSelect-icon": {
          color: "white",
          fontSize: 36,
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
        "& .MuiSelect-select": {
          paddingRight: 6,
          margin: 0,
        },
      }}
    >
      {Object.entries(networkTokenConfigs as Record<string, NetworkTokenConfig>).map(([name, config]) => (
        <MenuItem
          sx={{
            paddingY: 1.5,
            paddingRight: 6.5,
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
          }}
          key={name}
          value={config.symbol}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <img src={config.icon} alt={config.symbol} height={60} />
            <Typography
              sx={{
                fontSize: name.length > 4 ? 18 : 28,
                fontWeight: 600,
                flex: 1,
              }}
            >
              {config.symbol}
            </Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
};

export default AssetSelector;
