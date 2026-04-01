import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { ReferralAdminSummaryData, ReferralAdminSummaryResponse } from "@shared/referral";

function shortenWallet(value: string) {
	if (!value || value.length < 12) return value;
	return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function StatCard({
	label,
	value,
	accent,
	active,
	onClick,
	children,
}: {
	label: string;
	value: string;
	accent?: boolean;
	active?: boolean;
	onClick?: () => void;
	children?: React.ReactNode;
}) {
	return (
		<Box
			sx={{
				minWidth: 0,
			}}
		>
			<Box
				onClick={onClick}
				sx={{
					border: active ? "1px solid rgba(18,185,128,0.55)" : "1px solid rgba(255,255,255,0.08)",
					borderRadius: 3,
					p: { xs: 1.5, md: 2 },
					background: active ? "rgba(18,185,128,0.08)" : "rgba(255,255,255,0.02)",
					cursor: onClick ? "pointer" : "default",
					transition: "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease",
					"&:hover": onClick
						? {
								borderColor: "rgba(18,185,128,0.4)",
								transform: "translateY(-1px)",
						  }
						: undefined,
				}}
			>
				<Typography
					sx={{
						color: "rgba(255,255,255,0.45)",
						fontSize: { xs: 10, md: 12 },
						textTransform: "uppercase",
						letterSpacing: "0.08em",
					}}
				>
					{label}
				</Typography>
				<Typography sx={{ color: accent ? "#12B980" : "white", fontSize: { xs: 20, md: 24 }, fontWeight: 700, mt: 0.6 }}>
					{value}
				</Typography>
			</Box>
			{children}
		</Box>
	);
}

function CodeDropdown({
	title,
	codeSearch,
	setCodeSearch,
	filteredCodes,
	onCollapse,
}: {
	title: string;
	codeSearch: string;
	setCodeSearch: (value: string) => void;
	filteredCodes: ReferralAdminSummaryData["codes"];
	onCollapse: () => void;
}) {
	return (
		<Box
			sx={{
				mt: 1,
				border: "1px solid rgba(18,185,128,0.22)",
				borderRadius: 3,
				p: 1.5,
				background: "rgba(13,20,17,0.98)",
			}}
		>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
				<Typography sx={{ color: "white", fontWeight: 700, fontSize: 14 }}>{title}</Typography>
				<Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
					<input
						value={codeSearch}
						onChange={(event) => setCodeSearch(event.target.value)}
						placeholder="Search code or wallet"
						style={{
							padding: "10px 12px",
							borderRadius: 10,
							border: "1px solid rgba(255,255,255,0.14)",
							background: "rgba(0,0,0,0.25)",
							color: "white",
							outline: "none",
							boxSizing: "border-box",
							width: "100%",
							flex: 1,
						}}
					/>
					<button
						type="button"
						onClick={onCollapse}
						style={{
							padding: "10px 14px",
							borderRadius: 10,
							border: "1px solid rgba(255,255,255,0.14)",
							background: "transparent",
							color: "rgba(255,255,255,0.7)",
							cursor: "pointer",
							width: "100%",
							maxWidth: "120px",
						}}
					>
						Collapse
					</button>
				</Box>
			</Box>

			<Box sx={{ display: "flex", flexDirection: "column", gap: 1.1, mt: 1.25, maxHeight: 320, overflowY: "auto", pr: 0.25 }}>
				{filteredCodes.length === 0 ? (
					<Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
						No referral codes matched that search.
					</Typography>
				) : (
					filteredCodes.map((item) => (
						<Box
							key={item.code}
							sx={{
								border: "1px solid rgba(255,255,255,0.08)",
								borderRadius: 2,
								p: 1.25,
								background: "rgba(0,0,0,0.2)",
							}}
						>
							<Typography sx={{ color: "white", fontSize: 14, fontWeight: 700 }}>{item.code}</Typography>
							<Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, mt: 0.4, fontFamily: "monospace" }}>
								{shortenWallet(item.inviterWallet)}
							</Typography>
							<Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, mt: 0.45 }}>
								Created {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
							</Typography>
							<Typography sx={{ color: item.isActive ? "#12B980" : "#f87171", fontSize: 12, fontWeight: 700, mt: 0.65 }}>
								{item.isActive ? "Active" : "Inactive"}
							</Typography>
						</Box>
					))
				)}
			</Box>
		</Box>
	);
}

const WalletSummaryPanel: React.FC = () => {
	const theme = useTheme();
	const isCompactScreen = useMediaQuery(theme.breakpoints.down("lg"));
	const [summary, setSummary] = useState<ReferralAdminSummaryData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [codeSearch, setCodeSearch] = useState("");
	const [openCodeFilter, setOpenCodeFilter] = useState<"all" | "active" | null>(null);

	useEffect(() => {
		let active = true;
		async function load() {
			setLoading(true);
			setError("");
			try {
				const res = await fetch("/api/referral/admin-summary", { credentials: "include" });
				const data: ReferralAdminSummaryResponse = await res.json().catch(() => ({ ok: false }));
				if (!res.ok || !data.ok || !data.summary) {
					throw new Error(data.error || "Failed to load referral summary.");
				}
				if (active) setSummary(data.summary);
			} catch (err: any) {
				if (active) {
					setSummary(null);
					setError(err?.message || "Failed to load referral summary.");
				}
			} finally {
				if (active) setLoading(false);
			}
		}
		load();
		return () => {
			active = false;
		};
	}, []);

	const filteredCodes = useMemo(() => {
		if (!summary) return [];
		const query = codeSearch.trim().toLowerCase();
		const base = openCodeFilter === "active" ? summary.codes.filter((item) => item.isActive) : summary.codes;
		if (!query) return base;
		return base.filter(
			(item) => item.code.toLowerCase().includes(query) || item.inviterWallet.toLowerCase().includes(query),
		);
	}, [codeSearch, openCodeFilter, summary]);

	function toggleCodeFilter(next: "all" | "active") {
		setCodeSearch("");
		setOpenCodeFilter((current) => (current === next ? null : next));
	}

	return (
		<Box
			sx={{
				border: "1px solid",
				borderColor: "#282D29",
				borderRadius: 4,
				background: "rgba(255,255,255,0.03)",
				backdropFilter: "blur(10px)",
				padding: { xs: 2, md: 3 },
			}}
		>
			<Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
				<Box>
					<Typography fontWeight={700} color="white">
						Referral Wallet Summary
					</Typography>
					<Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mt: 0.5 }}>
						Authenticated backend totals for referral codes, bindings, payouts, and top inviters.
					</Typography>
				</Box>
			</Box>

			{loading && (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress size={28} sx={{ color: "#12B980" }} />
				</Box>
			)}

			{!loading && error && <Typography sx={{ color: "#f87171", fontSize: 13 }}>{error}</Typography>}

			{!loading && summary && (
				<Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
							gap: { xs: 1.25, md: 2 },
							alignItems: "start",
						}}
					>
						<StatCard label="Total Codes" value={String(summary.totalCodes)} active={openCodeFilter === "all"} onClick={() => toggleCodeFilter("all")}>
							{openCodeFilter === "all" && (
								<CodeDropdown
									title="All Referral Codes"
									codeSearch={codeSearch}
									setCodeSearch={setCodeSearch}
									filteredCodes={filteredCodes}
									onCollapse={() => {
										setOpenCodeFilter(null);
										setCodeSearch("");
									}}
								/>
							)}
						</StatCard>
						<StatCard label="Active Codes" value={String(summary.activeCodes)} active={openCodeFilter === "active"} onClick={() => toggleCodeFilter("active")}>
							{openCodeFilter === "active" && (
								<CodeDropdown
									title="Active Referral Codes"
									codeSearch={codeSearch}
									setCodeSearch={setCodeSearch}
									filteredCodes={filteredCodes}
									onCollapse={() => {
										setOpenCodeFilter(null);
										setCodeSearch("");
									}}
								/>
							)}
						</StatCard>
						<StatCard label="Total Bindings" value={String(summary.totalBindings)} />
						<StatCard label="Unique Inviters" value={String(summary.uniqueInviters)} />
						<StatCard label="Pending Claims" value={String(summary.pendingClaims)} />
						<StatCard label="Approved Claims" value={String(summary.approvedClaims)} />
						<StatCard label="Total Requested" value={`$${summary.totalRequestedUSD.toFixed(2)}`} accent />
						<StatCard label="Total Paid" value={`$${summary.totalPaidUSD.toFixed(2)}`} accent />
					</Box>

					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr" },
							gap: 2,
						}}
					>
						<Box
							sx={{
								border: "1px solid rgba(255,255,255,0.08)",
								borderRadius: 3,
								p: { xs: 1.5, md: 2 },
								background: "rgba(255,255,255,0.02)",
							}}
						>
							<Typography sx={{ color: "white", fontWeight: 700, mb: 1.5 }}>Top Inviters</Typography>
							{summary.topInviters.length === 0 ? (
								<Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
									No referral inviter data yet.
								</Typography>
							) : isCompactScreen ? (
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
									{summary.topInviters.map((item) => (
										<Box
											key={item.inviterWallet}
											sx={{
												border: "1px solid rgba(255,255,255,0.08)",
												borderRadius: 2,
												p: 1.5,
												background: "rgba(0,0,0,0.2)",
											}}
										>
											<Typography sx={{ color: "white", fontSize: 13, fontWeight: 700 }}>
												{item.referralCode || "-"}
											</Typography>
											<Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, mt: 0.5, fontFamily: "monospace" }}>
												{shortenWallet(item.inviterWallet)}
											</Typography>
											<Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, mt: 0.5 }}>
												Invitees {item.inviteeCount} · Requested ${item.totalRequestedUSD.toFixed(2)}
											</Typography>
											<Typography sx={{ color: "#12B980", fontSize: 12, fontWeight: 700, mt: 0.6 }}>
												Paid ${item.totalPaidUSD.toFixed(2)}
											</Typography>
										</Box>
									))}
								</Box>
							) : (
								<Box sx={{ overflowX: "auto" }}>
									<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
										<thead>
											<tr style={{ color: "rgba(255,255,255,0.38)" }}>
												<th style={{ textAlign: "left", paddingBottom: 10 }}>Inviter</th>
												<th style={{ textAlign: "left", paddingBottom: 10 }}>Code</th>
												<th style={{ textAlign: "right", paddingBottom: 10 }}>Invitees</th>
												<th style={{ textAlign: "right", paddingBottom: 10 }}>Requested</th>
												<th style={{ textAlign: "right", paddingBottom: 10 }}>Paid</th>
											</tr>
										</thead>
										<tbody>
											{summary.topInviters.map((item) => (
												<tr key={item.inviterWallet} style={{ color: "rgba(255,255,255,0.78)" }}>
													<td style={{ paddingBottom: 8, fontFamily: "monospace" }}>{shortenWallet(item.inviterWallet)}</td>
													<td style={{ paddingBottom: 8 }}>{item.referralCode || "-"}</td>
													<td style={{ textAlign: "right", paddingBottom: 8 }}>{item.inviteeCount}</td>
													<td style={{ textAlign: "right", paddingBottom: 8 }}>${item.totalRequestedUSD.toFixed(2)}</td>
													<td style={{ textAlign: "right", paddingBottom: 8, color: "#12B980" }}>${item.totalPaidUSD.toFixed(2)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</Box>
							)}
						</Box>

						<Box
							sx={{
								border: "1px solid rgba(255,255,255,0.08)",
								borderRadius: 3,
								p: { xs: 1.5, md: 2 },
								background: "rgba(255,255,255,0.02)",
							}}
						>
							<Typography sx={{ color: "white", fontWeight: 700, mb: 1.5 }}>Recent Bindings</Typography>
							{summary.recentBindings.length === 0 ? (
								<Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
									No referral bindings have been recorded yet.
								</Typography>
							) : (
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
									{summary.recentBindings.map((item) => (
										<Box
											key={`${item.inviteeWallet}-${item.boundAt}`}
											sx={{
												border: "1px solid rgba(255,255,255,0.06)",
												borderRadius: 2,
												p: 1.5,
												background: "rgba(0,0,0,0.2)",
											}}
										>
											<Typography sx={{ color: "white", fontSize: { xs: 12, md: 13 }, fontWeight: 600 }}>
												{item.referralCode} · {item.network}
											</Typography>
											<Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, mt: 0.5 }}>
												{shortenWallet(item.inviteeWallet)} bound to {shortenWallet(item.inviterWallet)}
											</Typography>
											<Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 11, mt: 0.5 }}>
												{item.boundAt ? new Date(item.boundAt).toLocaleString() : "-"}
											</Typography>
										</Box>
									))}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default WalletSummaryPanel;
