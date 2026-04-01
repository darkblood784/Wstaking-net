import { Box, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { ReferralAdminActivityItem, ReferralAdminActivityResponse } from "@shared/referral";

type ActivityFilter = "all" | "binding" | "claim" | "payout";

function shortenWallet(value?: string | null) {
	if (!value) return "-";
	if (value.length < 12) return value;
	return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatAmount(item: ReferralAdminActivityItem) {
	if (item.amountUSD == null) return "-";
	return `$${item.amountUSD.toFixed(2)} ${item.tokenSymbol || ""}`.trim();
}

const TransactionDataPanel: React.FC = () => {
	const theme = useTheme();
	const isCompactScreen = useMediaQuery(theme.breakpoints.down("lg"));
	const [filter, setFilter] = useState<ActivityFilter>("all");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [items, setItems] = useState<ReferralAdminActivityItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		const handle = window.setTimeout(() => {
			setPage(1);
			setSearch(searchInput.trim());
		}, 250);
		return () => window.clearTimeout(handle);
	}, [searchInput]);

	useEffect(() => {
		let active = true;
		async function load() {
			setLoading(true);
			setError("");
			try {
				const params = new URLSearchParams({
					type: filter,
					page: String(page),
					pageSize: String(pageSize),
				});
				if (search) params.set("search", search);
				const res = await fetch(`/api/referral/admin-activity?${params.toString()}`, {
					credentials: "include",
				});
				const data: ReferralAdminActivityResponse = await res.json().catch(() => ({ ok: false }));
				if (!res.ok || !data.ok || !data.items) {
					throw new Error(data.error || "Failed to load referral activity.");
				}
				if (active) {
					setItems(data.items);
					setTotal(Number(data.total || 0));
				}
			} catch (err: any) {
				if (active) {
					setItems([]);
					setTotal(0);
					setError(err?.message || "Failed to load referral activity.");
				}
			} finally {
				if (active) setLoading(false);
			}
		}
		load();
		return () => {
			active = false;
		};
	}, [filter, search, page, pageSize]);

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total]);

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
			<Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} mb={2}>
				<Box sx={{ minWidth: { xs: 0, md: 240 }, flex: 1 }}>
					<Typography fontWeight={700} color="white">
						Referral Activity Search
					</Typography>
					<Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mt: 0.5 }}>
						Backend activity feed for bindings, claims, and confirmed payouts.
					</Typography>
				</Box>

				<input
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder="Search wallet, code, network, token, txn hash"
					style={{
						minWidth: 0,
						flex: 1,
						width: isCompactScreen ? "100%" : undefined,
						padding: "10px 12px",
						borderRadius: 10,
						border: "1px solid rgba(255,255,255,0.14)",
						background: "rgba(0,0,0,0.25)",
						color: "white",
						outline: "none",
						boxSizing: "border-box",
					}}
				/>
			</Box>

			<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
				{(["all", "binding", "claim", "payout"] as const).map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => {
							setPage(1);
							setFilter(value);
						}}
						style={{
							padding: "6px 14px",
							borderRadius: 20,
							border: filter === value ? "1px solid #12B980" : "1px solid rgba(255,255,255,0.14)",
							background: filter === value ? "rgba(18,185,128,0.1)" : "transparent",
							color: filter === value ? "#12B980" : "rgba(255,255,255,0.55)",
							cursor: "pointer",
							fontSize: 12,
							textTransform: "capitalize",
						}}
					>
						{value}
					</button>
				))}
			</Box>

			{loading && (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress size={28} sx={{ color: "#12B980" }} />
				</Box>
			)}

			{!loading && error && <Typography sx={{ color: "#f87171", fontSize: 13 }}>{error}</Typography>}

			{!loading && !error && (
				<>
					{items.length === 0 ? (
						<Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No activity matched this filter.</Typography>
					) : isCompactScreen ? (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
							{items.map((item) => (
								<Box
									key={item.id}
									sx={{
										border: "1px solid rgba(255,255,255,0.08)",
										borderRadius: 2,
										p: 1.5,
										background: "rgba(0,0,0,0.2)",
									}}
								>
									<Typography sx={{ color: "white", fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>{item.type}</Typography>
									<Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 11, mt: 0.4 }}>
										{item.timestamp ? new Date(item.timestamp).toLocaleString() : "-"}
									</Typography>
									<Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, mt: 0.75 }}>
										Inviter <span style={{ fontFamily: "monospace" }}>{shortenWallet(item.inviterWallet)}</span>
									</Typography>
									<Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12, mt: 0.3 }}>
										Counterparty <span style={{ fontFamily: "monospace" }}>{shortenWallet(item.inviteeWallet || item.receivingWallet)}</span>
									</Typography>
									<Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11, mt: 0.6 }}>
										{[item.referralCode, item.network, item.txnHash ? `txn:${item.txnHash.slice(0, 10)}...` : null]
											.filter(Boolean)
											.join(" · ") || "-"}
									</Typography>
									<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
										<Typography sx={{ color: item.amountUSD ? "#12B980" : "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700 }}>
											{formatAmount(item)}
										</Typography>
										<Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{item.status || "-"}</Typography>
									</Box>
								</Box>
							))}
						</Box>
					) : (
						<Box sx={{ overflowX: "auto" }}>
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
								<thead>
									<tr style={{ color: "rgba(255,255,255,0.4)" }}>
										<th style={{ textAlign: "left", paddingBottom: 10 }}>Type</th>
										<th style={{ textAlign: "left", paddingBottom: 10 }}>Time</th>
										<th style={{ textAlign: "left", paddingBottom: 10 }}>Inviter</th>
										<th style={{ textAlign: "left", paddingBottom: 10 }}>Counterparty</th>
										<th style={{ textAlign: "left", paddingBottom: 10 }}>Context</th>
										<th style={{ textAlign: "right", paddingBottom: 10 }}>Amount</th>
										<th style={{ textAlign: "left", paddingBottom: 10 }}>Status</th>
									</tr>
								</thead>
								<tbody>
									{items.map((item) => (
										<tr key={item.id} style={{ color: "rgba(255,255,255,0.78)" }}>
											<td style={{ paddingBottom: 10, textTransform: "capitalize" }}>{item.type}</td>
											<td style={{ paddingBottom: 10 }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "-"}</td>
											<td style={{ paddingBottom: 10, fontFamily: "monospace" }}>{shortenWallet(item.inviterWallet)}</td>
											<td style={{ paddingBottom: 10, fontFamily: "monospace" }}>{shortenWallet(item.inviteeWallet || item.receivingWallet)}</td>
											<td style={{ paddingBottom: 10 }}>
												{[item.referralCode, item.network, item.txnHash ? `txn:${item.txnHash.slice(0, 10)}...` : null]
													.filter(Boolean)
													.join(" · ") || "-"}
											</td>
											<td style={{ paddingBottom: 10, textAlign: "right", color: item.amountUSD ? "#12B980" : "inherit" }}>
												{formatAmount(item)}
											</td>
											<td style={{ paddingBottom: 10 }}>{item.status || "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</Box>
					)}

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: { xs: "flex-start", md: "center" },
							flexDirection: { xs: "column", md: "row" },
							mt: 2,
							gap: 1.5,
						}}
					>
						<Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
							Showing {items.length} of {total} records
						</Typography>
						<Box sx={{ display: "flex", gap: 1, width: { xs: "100%", md: "auto" } }}>
							<button
								type="button"
								onClick={() => setPage((value) => Math.max(1, value - 1))}
								disabled={page <= 1}
								style={{
									padding: "6px 12px",
									borderRadius: 8,
									border: "1px solid rgba(255,255,255,0.14)",
									background: "transparent",
									color: page <= 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)",
									cursor: page <= 1 ? "not-allowed" : "pointer",
									flex: isCompactScreen ? 1 : undefined,
								}}
							>
								Prev
							</button>
							<Typography sx={{ color: "white", fontSize: 12, alignSelf: "center", minWidth: 70, textAlign: "center" }}>
								Page {page}/{totalPages}
							</Typography>
							<button
								type="button"
								onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
								disabled={page >= totalPages}
								style={{
									padding: "6px 12px",
									borderRadius: 8,
									border: "1px solid rgba(255,255,255,0.14)",
									background: "transparent",
									color: page >= totalPages ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)",
									cursor: page >= totalPages ? "not-allowed" : "pointer",
									flex: isCompactScreen ? 1 : undefined,
								}}
							>
								Next
							</button>
						</Box>
					</Box>
				</>
			)}
		</Box>
	);
};

export default TransactionDataPanel;
