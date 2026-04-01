import { Box, Container, Typography } from "@mui/material";
import React, { useState } from "react";

import ControlPanel from "@/components/indonesia/admin/ControlPanel";
import PlanPromotion from "@/components/indonesia/admin/PlanPromotion";
import DataPanel from "@/components/indonesia/admin/DataPanel";
import { SupportedToken } from "@/configs/tokenConfigs";
import WalletSummaryPanel from "@/components/indonesia/admin/WalletSummaryPanel";
import TransactionDataPanel from "@/components/indonesia/admin/TransactionDataPanel";
import ReferralClaimsPanel from "@/components/indonesia/admin/ReferralClaimsPanel";
import ReferralCodePolicyPanel from "@/components/indonesia/admin/ReferralCodePolicyPanel";

const SECTION_TITLE_SX = {
	fontSize: { xs: 24, sm: 32, md: 42, lg: 48 },
	fontWeight: 700,
	mt: { xs: 2.5, md: 4 },
	mb: { xs: 1.25, md: 0 },
	color: "common.white",
	fontFamily: "var(--font-grotesk, Inter, sans-serif)",
} as const;

const AdminHome: React.FC = () => {
	const [selectedNetworks, setSelectedNetworks] = useState<number[]>([]);
	const [selectedToken, setSelectedToken] = useState<SupportedToken | "">("");

	return (
		<Container
			sx={{
				width: "100%",
				maxWidth: "1200px",
				marginTop: { xs: 9, md: 12 },
				marginX: "auto",
				boxSizing: "border-box",
				display: "block",
			}}
		>
			<Box
				sx={{
					px: { xs: 1.5, sm: 3, md: 4 },
					pb: { xs: 7, md: 8 },
				}}
			>
				<DataPanel
					selectedNetworks={selectedNetworks}
					selectedToken={selectedToken}
					setSelectedNetworks={setSelectedNetworks}
					setSelectedToken={setSelectedToken}
				/>

				<Typography sx={SECTION_TITLE_SX}>
					Control Panel
				</Typography>

				<ControlPanel />

				<Typography sx={SECTION_TITLE_SX}>
					Plan Promotion
				</Typography>

				<PlanPromotion />

				<Typography sx={SECTION_TITLE_SX}>
					Wallet Summary
				</Typography>

				<WalletSummaryPanel />

				<Typography sx={SECTION_TITLE_SX}>
					Referral Code Management
				</Typography>

				<ReferralCodePolicyPanel />

				<Typography sx={SECTION_TITLE_SX}>
					Transaction Data
				</Typography>

				<TransactionDataPanel />

				<Typography sx={SECTION_TITLE_SX}>
					Referral Claims
				</Typography>

				<ReferralClaimsPanel />
			</Box>
		</Container>
	);
};

export default AdminHome;
