import { Box, Button, CircularProgress, Dialog, DialogActions, DialogTitle, Switch, Typography, TextField, Tooltip, styled, TooltipProps, tooltipClasses } from "@mui/material"
import React, { useEffect, useState } from "react";
import { readContract, writeContract } from 'wagmi/actions';
import { wagmiConfig } from '@/wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { format } from 'date-fns';

import promotionImg from "@/assets/images/promotion.svg"
import { loadABI } from "@/utils/abiLoader";
import { useNotification } from "@/components/NotificationProvider";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { getNetworkConfig } from "@/utils/networkUtils";
import { customReadContract } from "@/utils/customReadContract";

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        width: 500,
        border: '1px solid',
        borderColor: "#282D29",
        borderRadius: theme.spacing(2),
        padding: `${theme.spacing(2)}`,
        backgroundColor: 'rgba(9, 12, 11, 0.9)',
        backdropFilter: 'blur(3px)',
    },
}));

const StyledTooltipText = styled(Typography)(({ theme }) => ({
    fontWeight: 500,
    fontSize: 16,
    color: theme.palette.grey[300],
}));

const PlanPromotion: React.FC = () => {
    const [promotionDuration, setPromotionDuration] = useState<string>('');

    const [promotionLoading, setPromotionLoading] = useState(false);
    const [promotionActive, setPromotionActive] = useState<null | boolean>(null);
    const [promotionActiveDialogOpen, setPromotionActiveDialogOpen] = useState(false);
    const [promotionActiveDialogTitle, setPromotionActiveDialogTitle] = useState('');
    const [promotionEnd, setPromotionEnd] = useState<null | string>(null);
    const [promotionId, setPromotionId] = useState<null | string>(null);

    const contractAddress = getNetworkConfig().contractAddress;
    const { showNotification } = useNotification();
    const contractABI = loadABI('contract');

    async function fetchPromotionActive() {
        setPromotionLoading(true);

        const promotionActive = await customReadContract('isPromotionActive', [])
            .then(response => response as boolean);
        setPromotionActive(promotionActive);

        setPromotionLoading(false);
    }

    async function fetchPromotionEnd() {
        setPromotionLoading(true);

        const promotionEnd = await customReadContract('promoEndTime', [])
            .then(response => response as bigint)
            .then(response => Number(response) * 1000)
            .then(response => new Date(response))
            .then(response => format(response, 'yyyy/MM/dd HH:mm:ss'));

        setPromotionEnd(promotionEnd);

        setPromotionLoading(false);
    }

    async function fetchPromotionId() {
        setPromotionLoading(true);

        const promotionId = await customReadContract('currentPromoId', [])
            .then(response => response as bigint)
            .then(response => response.toString());

        setPromotionId(promotionId);
        
        setPromotionLoading(false);
    }

    async function startPromotion() {
        if (promotionDuration) {
            setPromotionLoading(true);

            try {
                const startPromotionTxHash = await (writeContract as any)(wagmiConfig, {
                    address: contractAddress as `0x${string}`,
                    abi: contractABI,
                    functionName: 'startPromotion',
                    args: [promotionDuration],
                });

                const tx = await waitForTransactionReceipt(wagmiConfig, {
                    hash: startPromotionTxHash,
                    confirmations: 1
                });

                if (tx.status) {
                    fetchPromotionActive();
                    fetchPromotionEnd();
                    fetchPromotionId();
                    return true;
                } else {
                    fetchPromotionActive();
                    return false;
                }
            } catch (error) {
                showNotification('Start promotion failed', 'error');
            }

            setPromotionLoading(false);
        }
    }

    async function stopPromotion() {
        setPromotionLoading(true);

        try {
            const stopPromotionTxHash = await (writeContract as any)(wagmiConfig, {
                address: contractAddress as `0x${string}`,
                abi: contractABI,
                functionName: 'stopPromotion',
                args: [],
            });

            const tx = await waitForTransactionReceipt(wagmiConfig, {
                hash: stopPromotionTxHash,
                confirmations: 1
            });

            if (tx.status) {
                fetchPromotionActive();
                return true;
            } else {
                fetchPromotionActive();
                return false;
            }
        } catch (error) {
            showNotification('Stop promotion failed', 'error');
        }

        setPromotionLoading(false);
    }

    useEffect(() => {
        fetchPromotionActive();
        fetchPromotionEnd();
        fetchPromotionId();
    }, [])

    function handlePromotionActiveToggle() {
        if (!promotionActive) {
            if (promotionDuration === '') {
                showNotification('Duration field must not be empty', 'error');
                return;
            } else if (promotionDuration === '0') {
                showNotification('Value of duration field must be greater than 0', 'error');
                return;
            }
        }

        if (promotionActive) {
            setPromotionActiveDialogTitle('Are you sure about ending the promotion before scheduled?');
        } else {
            setPromotionActiveDialogTitle(`Are you sure you want to start the promotion for ${promotionDuration} day(s)?`);
        }
        setPromotionActiveDialogOpen(true);
    }

    function handlePromotionInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const inputValue = event.target.value;
        const parsedInputValue = parseInt(inputValue);

        if (!Number.isNaN(parsedInputValue)) {
            setPromotionDuration(parsedInputValue.toString());
        }
    }

    function handlePromotionActiveDialogResponse(response: boolean) {
        setPromotionActiveDialogOpen(false);

        if (response) {
            if (promotionActive) {
                stopPromotion();
            } else {
                startPromotion();
            }
        }
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gap: { xs: 2, md: 3 },
                py: { xs: 0.5, md: 2 },
                px: { xs: 0, sm: 2, md: 4, lg: 6 },
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }
            }}
        >
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: "#282D29",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.03)",
                    backdropFilter: "blur(10px)",
                    padding: { xs: 2, md: 3 },
                    paddingRight: { xs: 2, md: 7 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <Box
                    sx={{
                        justifyContent: 'space-between',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: 1,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
                        <Typography
                            sx={{
                                color: 'grey.400',
                                fontSize: { xs: 14, md: 16 },
                            }}
                        >
                            Full APR Promotion
                        </Typography>
                        <StyledTooltip
                            title={
                                <Box>
                                    <StyledTooltipText>
                                        After opening, a plan with yellow text will be displayed.
                                    </StyledTooltipText>
                                    <Box
                                        component={'img'}
                                        src={promotionImg}
                                        sx={{
                                            maxWidth: '100%',
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                            borderRadius: 3,
                                            mt: 1,
                                        }}
                                    ></Box>
                                </Box>
                            }
                            placement="right"
                        >
                            <InfoOutlined
                                sx={{
                                    flexShrink: 0,
                                    fontSize: { xs: 18, md: 22 },
                                    color: 'grey.400'
                                }}
                            />
                        </StyledTooltip>
                    </Box>
                    {
                        promotionActive ?
                            <Box
                                sx={{
                                    borderRadius: 3,
                                    background: '#22C55F',
                                    color: 'common.black',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    px: 1.8,
                                }}
                            >
                                On
                            </Box>
                            :
                            <Box
                                sx={{
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: "#282D29",
                                    background: 'none',
                                    color: 'common.white',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    px: 1.8,
                                }}
                            >
                                Off
                            </Box>
                    }
                </Box>
                {promotionLoading ?
                    <CircularProgress size={20} sx={{ marginTop: 1.5 }} />
                    :
                    promotionActive ?
                        <Box>
                            <Typography
                                sx={{
                                    color: 'grey.600',
                                    my: 0.5
                                }}
                            >
                                ID: {promotionId} | End date: {promotionEnd}
                            </Typography>
                            <Switch checked={promotionActive || false} onChange={handlePromotionActiveToggle} />
                        </Box>
                        :
                        <Box>
                            <TextField
                                label={'Duration (in days)'}
                                variant="outlined"
                                size="small"
                                value={promotionDuration}
                                onChange={handlePromotionInputChange}
                                fullWidth
                                sx={{
                                    my: 2,
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: "rgba(255,255,255,0.03)",
                                        color: "#fff",
                                        borderRadius: "16px",
                                        "& fieldset": {
                                            borderColor: "#282D29",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: "#22C55F",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: "#22C55F",
                                        },
                                        "& input": {
                                            fontFeatureSettings: "'tnum' on, 'lnum' on", // 啟用數字等寬特性
                                            textAlign: "right",
                                            paddingRight: "8px",
                                            fontSize: "1rem",
                                            letterSpacing: "0.5px",
                                        },
                                    },
                                    "& .MuiFormLabel-root": {
                                        color: "rgba(255, 255, 255, 0.7)",
                                    },
                                    "& .MuiFormHelperText-root": {
                                        fontSize: "0.75rem",
                                    },
                                }}
                            />
                            <Switch checked={promotionActive || false} onChange={handlePromotionActiveToggle} />
                        </Box>
                }
                <Dialog
                    open={promotionActiveDialogOpen}
                    PaperProps={{
                        sx: {
                            backgroundColor: 'rgba(9, 12, 11, 0.96)',
                            border: '1px solid #282D29',
                            borderRadius: 3,
                            minWidth: { xs: 280, sm: 520 },
                            px: 1,
                            py: 0.5,
                            backdropFilter: 'blur(6px)',
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            color: 'common.white',
                            fontWeight: 600,
                            fontSize: { xs: 16, sm: 18 },
                            textAlign: 'left',
                        }}
                    >
                        {promotionActiveDialogTitle}
                    </DialogTitle>
                    <DialogActions
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            px: 2,
                            pb: 2,
                            gap: 2,
                        }}
                    >
                        <Button
                            onClick={async () => await handlePromotionActiveDialogResponse(false)}
                            variant="outlined"
                            sx={{
                                borderColor: '#282D29',
                                color: 'common.white',
                                borderRadius: 999,
                                px: 3,
                                textTransform: 'none',
                                '&:hover': { borderColor: '#22C55F', backgroundColor: 'rgba(34,197,95,0.08)' },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => await handlePromotionActiveDialogResponse(true)}
                            variant="contained"
                            disableElevation
                            sx={{
                                borderRadius: 999,
                                px: 3.5,
                                textTransform: 'none',
                                color: 'common.black',
                                background: 'linear-gradient(90deg, #12B980 0%, #22C55F 100%)',
                                '&:hover': { opacity: 0.9, background: 'linear-gradient(90deg, #12B980 0%, #22C55F 100%)' },
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    )
}

export default PlanPromotion;
