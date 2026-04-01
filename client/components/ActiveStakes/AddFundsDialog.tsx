import DialogModalWrapper from "@/components/DialogModalWrapper";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useUserDetails } from "@/contexts/UserDetailsContext";

interface AddFundsDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFunds: () => void;
  addFundAmount: string;
  onAddFundAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  duration: string;
}

const AddFundsDialog: React.FC<AddFundsDialogProps> = ({
  open,
  onClose,
  onAddFunds,
  addFundAmount,
  onAddFundAmountChange,
  duration,
}) => {
  const { t } = useTranslation();
  const { selectedToken } = useSelectedToken();
  const { walletBalance } = useUserDetails();

  const handleMaxClick = () => {
    onAddFundAmountChange({
      target: { value: walletBalance || "0" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <DialogModalWrapper
      open={open}
      paperSx={{
        paddingX: 3,
        paddingY: 2,
        borderRadius: 4,
        borderColor: "#1E2A24",
        backgroundColor: "rgba(8, 10, 9, 0.92)",
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 1.2,
          margin: 0,
          padding: 0,
          pb: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid #12B980",
            display: "grid",
            placeItems: "center",
            color: "#12B980",
            fontWeight: 700,
          }}
        >
          +
        </Box>
        {t("addfundsdialog.title")}
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          padding: 0,
          mt: 2,
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(0,0,0,0.4)",
            padding: 2,
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
            <Box
              component="img"
              src={selectedToken.icon}
              alt={selectedToken.symbol}
              sx={{ width: 28, height: 28 }}
            />
            <TextField
              variant="outlined"
              placeholder={t("addfundsdialog.placeholder")}
              value={addFundAmount}
              onChange={onAddFundAmountChange}
              sx={{
                width: { xs: "100%", sm: 160 },
                flex: 1,
                "& fieldset": {
                  border: "1px solid rgba(18,185,128,0.4)",
                },
                "& .MuiInputBase-input": {
                  color: "white",
                  fontWeight: 600,
                  paddingY: 0.8,
                  paddingX: 1.2,
                },
              }}
              required
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleMaxClick}
            sx={{
              backgroundColor: "rgba(18,185,128,0.2)",
              color: "#9AE6C0",
              fontWeight: 700,
              borderRadius: 2,
              paddingX: 2.5,
              minWidth: 80,
              whiteSpace: "nowrap",
              "&:hover": {
                backgroundColor: "rgba(18,185,128,0.35)",
              },
            }}
          >
            MAX
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between" }}>
          <Typography color="grey.400" fontSize={12}>
            Plan : {duration}
          </Typography>
          <Typography color="grey.400" fontSize={12}>
            {t("balance")}: {walletBalance || "0"} {selectedToken.symbol}
          </Typography>
        </Box>
        <DialogContentText color="grey.500" lineHeight={1.4}>
          {t("addfundsdialog.text1")} {t("addfundsdialog.text2")}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          padding: 0,
          gap: 1.5,
          justifyContent: "center",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "stretch",
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            color: "white",
            borderColor: "rgba(18,185,128,0.4)",
            paddingX: 4,
            borderRadius: 2,
            width: { xs: "100%", sm: "auto" },
            "&:hover": {
              borderColor: "#12B980",
              backgroundColor: "rgba(18,185,128,0.1)",
            },
          }}
        >
          {t("cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={onAddFunds}
          disableElevation
          sx={{
            backgroundColor: "#12B980",
            color: "black",
            fontWeight: 700,
            paddingX: 4,
            borderRadius: 2,
            width: { xs: "100%", sm: "auto" },
            "&:hover": {
              backgroundColor: "#1FD18A",
            },
          }}
        >
          {t("confirm")}
        </Button>
      </DialogActions>
    </DialogModalWrapper>
  );
};

export default AddFundsDialog;
