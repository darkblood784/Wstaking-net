import DialogModalWrapper from "@/components/DialogModalWrapper";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";

interface UnstakeDialogProps {
  open: boolean;
  onClose: () => void;
  onUnstake: () => void;
  unstakeAmount: string;
  onUnstakeAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePercentageClick: (percentage: number) => void;
  redeemableAmount: string;
}

const UnstakeDialog: React.FC<UnstakeDialogProps> = ({
  open,
  onClose,
  onUnstake,
  unstakeAmount,
  onUnstakeAmountChange,
  handlePercentageClick,
  redeemableAmount,
}) => {
  const { t } = useTranslation();
  const { selectedToken } = useSelectedToken();

  const handleMaxClick = () => {
    onUnstakeAmountChange({
      target: { value: redeemableAmount || "0" },
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
            border: "2px solid #EF4444",
            display: "grid",
            placeItems: "center",
            color: "#EF4444",
            fontWeight: 700,
          }}
        >
          -
        </Box>
        {t("unstakedialog.title")}
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
              placeholder={t("unstakedialog.placeholder")}
              value={unstakeAmount}
              onChange={onUnstakeAmountChange}
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
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(255,255,255,0.4)",
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
            {t("unstakeDialog.max")}
          </Button>
        </Box>
        <Typography color="grey.400" fontSize={13} textAlign="center">
          {t("unstakeDialog.redeemableBalance")}: {redeemableAmount} {selectedToken.symbol}
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
          }}
          gap={{
            xs: 1,
            sm: 3,
          }}
          marginY={1}
        >
          {[25, 50, 75, 100].map((value) => (
            <Button
              variant="contained"
              key={value}
              onClick={() => handlePercentageClick(value)}
              sx={{
                boxSizing: "border-box",
                borderRadius: 5,
                borderColor: "common.white",
                border: "solid 1px",
                backgroundColor: "transparent",
                color: "common.white",
                fontSize: { xs: 12, sm: 16 },
                paddingX: { xs: 1.2, sm: 2.8 },
                paddingY: { xs: 0.4, sm: 0.3 },
                "&:hover, &:focus": {
                  backgroundColor: "common.white",
                  color: "common.black",
                  outline: "none",
                  borderColor: "common.white",
                },
              }}
            >
              {`${value}%`}
            </Button>
          ))}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          padding: 0,
          gap: 1.5,
          width: "100%",
          justifyContent: "center",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          px: { xs: 1, sm: 0 },
          "& .MuiButton-root": {
            width: { xs: "100%", sm: "auto" },
            maxWidth: { xs: 280, sm: "none" },
            alignSelf: "center",
            mx: "auto",
            boxSizing: "border-box",
          },
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          onClick={onClose}
          sx={{
            color: "white",
            borderColor: "rgba(18,185,128,0.4)",
            paddingX: 4,
            borderRadius: 2,
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
          fullWidth
          onClick={onUnstake}
          disableElevation
          sx={{
            backgroundColor: "#12B980",
            color: "black",
            fontWeight: 700,
            paddingX: 4,
            borderRadius: 2,
            "&:hover": {
              backgroundColor: "#1FD18A",
            },
          }}
        >
          {t("unstakedialog.title")}
        </Button>
      </DialogActions>
    </DialogModalWrapper>
  );
};

export default UnstakeDialog;

