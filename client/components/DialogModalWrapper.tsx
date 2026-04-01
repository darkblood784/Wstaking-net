import { Dialog, DialogProps } from "@mui/material";

interface DialogModalWrapperProps extends DialogProps {
    paperSx?: object; // additional styles for the paper component
}

const DialogModalWrapper: React.FC<DialogModalWrapperProps> = ({ paperSx, children, ...rest }) => {
    return (
        <Dialog
            {...rest}
            slotProps={{
                paper: {
                    sx: {
                        backdropFilter: 'blur(16px)',
                        backgroundColor: 'rgba(8, 10, 9, 0.94)',
                        borderRadius: 20,
                        border: '1px solid #1E2A24',
                        boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.35)',
                        color: 'common.white',
                        paddingX: { xs: 3, sm: 4, md: 6 },
                        paddingTop: { xs: 2, sm: 2.5 },
                        paddingBottom: { xs: 2.5, sm: 3 },
                        width: { xs: "92vw", sm: 460, md: 520 },
                        maxWidth: "92vw",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        ...paperSx,
                    }
                }
            }}
        >
            {children}
        </Dialog>
    )
}

export default DialogModalWrapper;
