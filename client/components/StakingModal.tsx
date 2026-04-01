// src/components/StakingModal.tsx

import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogActions, Button, Typography, CircularProgress, Box, Fade, Grow, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface StakingModalProps {
  open: boolean; // 控制模態框是否開啟
  state: 'confirm' | 'loading' | 'success' | 'error' | 'newstake' | 'newAddFunds'; // 模態框當前狀態
  message: string; // 顯示的主要訊息
  details?: string[]; // 額外的補充訊息（動態鍵值對）
  onClose: () => void; // 關閉模態框的函數
  onConfirm: (() => void) | null; // 用戶確認操作的函數
}

/**
 * StakingModal 組件
 * 顯示質押流程的不同階段
 */
const StakingModal: React.FC<StakingModalProps> = ({ open, state, message, details, onClose, onConfirm }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [txnHashCopied, setTxnHashCopied] = useState(false);
  const [txnHash, setTxnHash] = useState('');

  const handleTxnHashCopy = async (txnHash: string) => {
    try {
      await navigator.clipboard.writeText(txnHash);
      setTxnHashCopied(true);
      setTimeout(() => setTxnHashCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  const formatTxnHash = (txnHash: string) => {
    const truncateLength = 38;

    if (txnHash.length > truncateLength) {
      const formattedTxnHash = txnHash.slice(0, truncateLength) + '...';
      return formattedTxnHash
    }

    return txnHash;
  }

  /**
   * 渲染確認狀態下的補充訊息
   */
  const renderDetails = () => {
    if (!details || details.length === 0) return null;

    if (state === 'newstake') {
      return (
        <Box mt={2}>
          <Typography sx={{ width: { xs: "100%", sm: 400 }, mt: 1 }}>{details[0]}</Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 1,
            }}
          >
            <Typography sx={{ mt: 1, wordBreak: "break-all" }}>{formatTxnHash(details[1])}</Typography>
            <IconButton
              onClick={() => handleTxnHashCopy(details[1])}
              sx={{
                color: 'white',
                borderRadius: 0,
                '&:focus': {
                  outline: 'none',
                }
              }}
            >
              {txnHashCopied ? <CheckIcon /> : <ContentCopyIcon />}
            </IconButton>
          </Box>
        </Box>
      );
    }

    return (
      <Box mt={2}>
        {details.map((string, index) => (
          <Typography key={index} sx={{ mt: 1, color: "grey.400", fontSize: 14 }}>
            {string}
          </Typography>
        ))}
      </Box>
    );
  };

  /**
   * 渲染不同狀態下的內容
   */
  const renderContent = () => {
    switch (state) {
      case 'confirm':
        return (
          <Box textAlign="center">
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, fontSize: { xs: 16, sm: 18 } }}
            >
              {message}
            </Typography>
            {renderDetails()}
          </Box>
        );
      case 'loading':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <CircularProgress sx={{ color: "#12B980" }} />
            <Typography variant="h6" sx={{ mt: 2, fontSize: { xs: 16, sm: 18 } }}>
              {message}
            </Typography>
          </Box>
        );
      case 'success':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(18,185,128,0.15)",
                border: "1px solid rgba(18,185,128,0.4)",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 42, color: "#12B980" }} />
            </Box>
            <Typography variant="h6" sx={{ mt: 2, whiteSpace: 'pre-line', fontSize: { xs: 16, sm: 18 } }}>
              {message}
            </Typography>
          </Box>
        );
      case 'error':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
              }}
            >
              <ErrorIcon sx={{ fontSize: 42, color: "#EF4444" }} />
            </Box>
            <Typography variant="h6" sx={{ mt: 2, fontSize: { xs: 16, sm: 18 } }}>
              {message}
            </Typography>
          </Box>
        );
      case 'newstake':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(18,185,128,0.15)",
                border: "1px solid rgba(18,185,128,0.4)",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 42, color: "#12B980" }} />
            </Box>
            <Typography variant="h6" sx={{ mt: 2, fontSize: { xs: 16, sm: 18 } }}>
              {message}
            </Typography>
            {renderDetails()}
          </Box>
        )
      case 'newAddFunds':
        return (
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                backgroundColor: "rgba(18,185,128,0.15)",
                border: "1px solid rgba(18,185,128,0.4)",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 42, color: "#12B980" }} />
            </Box>
            <Typography variant="h6" sx={{ mt: 2, fontSize: { xs: 16, sm: 18 } }}>
              {message}
            </Typography>
            {renderDetails()}
          </Box>
        )
      default:
        return null;
    }
  };

  /**
   * 渲染不同狀態下的按鈕
   */
  const renderActions = () => {
    switch (state) {
      case 'confirm':
        return (
          <>
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
              onClick={() => onConfirm && onConfirm()}
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
              {t("confirm")}
            </Button>
          </>
        );
      case 'loading':
        return null; // 加載階段不顯示按鈕
      case 'success':
      case 'newstake':
      case 'error':
      case 'newAddFunds':
        return (
          <Button
            variant="contained"
            fullWidth
            onClick={onClose}
            sx={{
              backgroundColor: "#12B980",
              color: "black",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": { backgroundColor: "#1FD18A" },
            }}
          >
            Continue
          </Button>
        );
      default:
        return null;
    }
  };

  const isConfirmState = state === "confirm";

  return (
    <Dialog
      open={open}
      onClose={state === 'loading' ? () => { } : onClose}
      disableEscapeKeyDown={state === 'loading'}
      PaperProps={{
        style: {
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(8, 10, 9, 0.94)',
          color: '#fff',
          borderRadius: 20,
          border: '1px solid rgba(30, 42, 36, 0.9)',
          boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.35)'
        }
      }}
    >
      <DialogContent sx={{ width: { xs: "100%", sm: "auto" }, px: { xs: 2, sm: 3 } }}>
        {renderContent()}
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          justifyContent: "center",
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
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
};

export default StakingModal;
