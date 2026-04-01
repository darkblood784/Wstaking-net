/**
 * ReferralClaimsPanel — Admin component
 *
 * Shows all referral claim requests submitted by inviters.
 * Admin can:
 *   - Filter by status (all / pending / approved / sent / rejected)
 *   - Mark a request as Approved, Rejected, or Sent (with optional txnHash)
 *   - View per-invitee reward breakdown details
 *
 * Security model:
 *   All status changes go through POST /api/referral/process-claim which verifies
 *   the admin session cookie server-side and uses the Firebase Admin SDK to write
 *   to Firestore. Direct client writes to claim collections are blocked by
 *   Firestore security rules.
 */

import { Box, Typography, Chip, CircularProgress, Divider, useMediaQuery, useTheme } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useUserDetails } from "@/contexts/UserDetailsContext";
import type { AdminClaimsListResponse, ReferralClaimRequest } from "@shared/referral";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "sent";

const STATUS_COLORS: Record<string, "warning" | "info" | "error" | "success" | "default"> = {
  pending: "warning",
  approved: "info",
  rejected: "error",
  sent: "success",
};

function formatDate(ms: number | null) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString();
}

function shortenWallet(w: string) {
  if (!w || w.length < 10) return w;
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin action modal (internal)
// ─────────────────────────────────────────────────────────────────────────────
interface ActionModalProps {
  request: ReferralClaimRequest;
  adminWallet: string;
  onClose: () => void;
  onDone: () => void;
}

function ActionModal({ request, adminWallet, onClose, onDone }: ActionModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | "sent">("approve");
  const [note, setNote] = useState("");
  const [txnHash, setTxnHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const mappedAction =
        action === "approve" ? "approved" :
        action === "reject"  ? "rejected" : "sent";

      const res = await fetch("/api/referral/process-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send admin session cookie
        body: JSON.stringify({
          claimId: request.id,
          action: mappedAction,
          adminNote: note || undefined,
          txnHash: action === "sent" ? txnHash || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Request failed.");
      }

      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.75)",
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          width: "min(96vw, 520px)",
          bgcolor: "#0B0F0D",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 3,
          p: 3,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ color: "white", mb: 1, fontWeight: 700 }}>
          Process Claim Request
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, mb: 2 }}>
          Inviter: <strong style={{ color: "white" }}>{shortenWallet(request.inviterWallet)}</strong>
          {" "} · Requested: <strong style={{ color: "#12B980" }}>
            ${request.requestedAmountUSD.toFixed(2)} {request.tokenSymbol || request.currency || "USD"}
          </strong>
        </Typography>

        {/* Action selector */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          {(["approve", "reject", "sent"] as const).map((a) => (
            <button
              key={a}
              type="button"
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: action === a ? "1px solid #12B980" : "1px solid rgba(255,255,255,0.2)",
                background: action === a ? "rgba(18,185,128,0.1)" : "transparent",
                color: action === a ? "#12B980" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
              onClick={() => setAction(a)}
            >
              {a === "sent" ? "Mark Sent" : a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </Box>

        {/* Txn hash (shown when marking sent) */}
        {action === "sent" && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11, mb: 0.5 }}>
              Transaction Hash (optional)
            </Typography>
            <input
              value={txnHash}
              onChange={(e) => setTxnHash(e.target.value)}
              placeholder="0x..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.4)",
                color: "white",
                fontSize: 12,
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </Box>
        )}

        {/* Admin note */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11, mb: 0.5 }}>
            Admin Note (optional)
          </Typography>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Internal note visible to the inviter..."
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.4)",
              color: "white",
              fontSize: 12,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Box>

        {error && (
          <Typography sx={{ color: "#f87171", fontSize: 12, mb: 1 }}>
            ⚠ {error}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: loading ? "rgba(18,185,128,0.3)" : "#12B980",
              color: loading ? "rgba(255,255,255,0.5)" : "black",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading && <CircularProgress size={12} sx={{ color: "inherit" }} />}
            {loading ? "Processing…" : "Confirm"}
          </button>
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown row (expandable)
// ─────────────────────────────────────────────────────────────────────────────
function BreakdownTable({ request }: { request: ReferralClaimRequest }) {
  if (!request.rewardBreakdown || request.rewardBreakdown.length === 0) {
    return (
      <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
        No breakdown data.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ color: "rgba(255,255,255,0.35)" }}>
            <th style={{ textAlign: "left", paddingBottom: 4 }}>Invitee</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Active Stake</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Months</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Per Month</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {request.rewardBreakdown.map((row) => (
            <tr key={row.inviteeWallet} style={{ color: "rgba(255,255,255,0.7)" }}>
              <td style={{ paddingBottom: 2, fontFamily: "monospace" }}>
                {shortenWallet(row.inviteeWallet)}
              </td>
              <td style={{ textAlign: "right", paddingBottom: 2 }}>
                ${row.activeStakedUSD.toFixed(2)}
              </td>
              <td style={{ textAlign: "right", paddingBottom: 2 }}>
                {row.monthsElapsed}
              </td>
              <td style={{ textAlign: "right", paddingBottom: 2 }}>
                ${row.rewardPerMonthUSD.toFixed(4)}
              </td>
              <td style={{ textAlign: "right", color: "#12B980", fontWeight: 700, paddingBottom: 2 }}>
                ${row.totalRewardUSD.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────
export default function ReferralClaimsPanel() {
  const theme = useTheme();
  const isCompactScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const { isAdmin } = useUserDetails();
  const [claims, setClaims] = useState<ReferralClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<ReferralClaimRequest | null>(null);

  // Admin wallet from the admin page context
  // We read it from sessionStorage where the admin-auth flow stores it
  const [adminWallet, setAdminWallet] = useState("");

  useEffect(() => {
    // Retrieved from admin-auth session endpoint
    fetch("/api/admin-auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.walletAddress) setAdminWallet(d.walletAddress);
      })
      .catch(() => {});
  }, []);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referral/admin-claims", {
        credentials: "include",
      });
      const data: AdminClaimsListResponse = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok || !data.claims) {
        throw new Error(data.error || "Failed to load claim requests.");
      }
      setClaims(data.claims);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadClaims();
  }, [isAdmin, loadClaims]);

  const filtered =
    statusFilter === "all"
      ? claims
      : claims.filter((c) => c.status === statusFilter);

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const sentCount = claims.filter((c) => c.status === "sent").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;

  const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Sent", value: "sent" },
    { label: "Rejected", value: "rejected" },
  ];

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
      {/* Action modal */}
      {activeRequest && adminWallet && (
        <ActionModal
          request={activeRequest}
          adminWallet={adminWallet}
          onClose={() => setActiveRequest(null)}
          onDone={loadClaims}
        />
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 2.5 }}>
        <Box>
          <Typography fontWeight={700} color="white">
            Referral Claim Queue
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mt: 0.5 }}>
            Review payout requests from inviters, inspect the reward snapshot, and move claims through approval and sent states.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(72px, auto))" },
            gap: 1,
            width: { xs: "100%", md: "auto" },
          }}
        >
          {[
            { label: "Pending", value: pendingCount, color: "#f59e0b" },
            { label: "Approved", value: approvedCount, color: "#38bdf8" },
            { label: "Sent", value: sentCount, color: "#12B980" },
            { label: "Rejected", value: rejectedCount, color: "#f87171" },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2.5,
                px: 1.5,
                py: 1.25,
                background: "rgba(255,255,255,0.02)",
                minWidth: 0,
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {item.label}
              </Typography>
              <Typography sx={{ color: item.color, fontSize: 18, fontWeight: 700, mt: 0.35 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Filter tabs */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        {FILTERS.map((f) => {
          const count = f.value === "all"
            ? claims.length
            : claims.filter((c) => c.status === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: statusFilter === f.value
                  ? "1px solid #12B980"
                  : "1px solid rgba(255,255,255,0.15)",
                background: statusFilter === f.value
                  ? "rgba(18,185,128,0.1)"
                  : "transparent",
                color: statusFilter === f.value ? "#12B980" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {f.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
        <button
          type="button"
          onClick={loadClaims}
          style={{
            marginLeft: isCompactScreen ? undefined : "auto",
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 12,
            width: isCompactScreen ? "100%" : undefined,
          }}
        >
          ↻ Refresh
        </button>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} sx={{ color: "#12B980" }} />
        </Box>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            textAlign: "center",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
          }}
        >
          <Box
            sx={{
              width: 54,
              height: 54,
              marginX: "auto",
              borderRadius: "50%",
              border: "1px solid rgba(18,185,128,0.22)",
              background: "rgba(18,185,128,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#12B980",
              fontSize: 24,
              mb: 1.5,
            }}
          >
            $
          </Box>
          <Typography sx={{ color: "white", fontSize: 16, fontWeight: 700 }}>
            {statusFilter === "all" ? "No claim requests yet" : `No ${statusFilter} claim requests`}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: 13, mt: 0.8, maxWidth: 520, marginX: "auto" }}>
            This queue will populate when inviters submit referral payout claims. Once claims arrive, admins can review the request, inspect the breakdown, and process it from here.
          </Typography>
        </Box>
      )}

      {/* Claim list */}
      {!loading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filtered.map((req) => (
            <Box
              key={req.id}
              sx={{
                border: "1px solid",
                borderColor:
                  req.status === "pending"
                    ? "rgba(245,158,11,0.3)"
                    : req.status === "sent"
                    ? "rgba(18,185,128,0.3)"
                    : "rgba(255,255,255,0.1)",
                borderRadius: 2,
                p: 2,
                bgcolor: "rgba(255,255,255,0.02)",
              }}
            >
              {/* Header row */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" } }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Chip
                      label={req.status.toUpperCase()}
                      size="small"
                      color={STATUS_COLORS[req.status] ?? "default"}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                      {formatDate(req.requestedAt)}
                    </Typography>
                  </Box>

                  <Typography sx={{ color: "white", fontWeight: 700, fontSize: 15 }}>
                    ${req.requestedAmountUSD.toFixed(2)}{" "}
                    <span style={{ color: "#12B980" }}>{req.tokenSymbol || req.currency || "USD"}</span>
                  </Typography>

                  <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12, mt: 0.5 }}>
                    From:{" "}
                    <span style={{ color: "white", fontFamily: "monospace" }}>
                      {shortenWallet(req.inviterWallet)}
                    </span>{" "}
                    → {(req.network || req.receivingNetwork)} ·{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {shortenWallet(req.receivingWallet)}
                    </span>
                  </Typography>

                  {req.adminNote && (
                    <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 11, mt: 0.5, fontStyle: "italic" }}>
                      Note: {req.adminNote}
                    </Typography>
                  )}
                  {req.txnHash && (
                    <Typography sx={{ color: "#12B980", fontSize: 11, mt: 0.5, fontFamily: "monospace", wordBreak: "break-all" }}>
                      Txn: {req.txnHash}
                    </Typography>
                  )}
                  {req.processedAt && (
                    <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: 11, mt: 0.5 }}>
                      Processed: {formatDate(req.processedAt)} by{" "}
                      {shortenWallet(req.processedBy ?? "")}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0, width: { xs: "100%", sm: "auto" } }}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === req.id ? null : req.id!)
                    }
                    style={{
                      flex: isCompactScreen ? 1 : undefined,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {expandedId === req.id ? "Hide" : "Details"}
                  </button>
                  {(req.status === "pending" || req.status === "approved") && adminWallet && (
                    <button
                      type="button"
                      onClick={() => setActiveRequest(req)}
                      style={{
                        flex: isCompactScreen ? 1 : undefined,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#12B980",
                        color: "black",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Process
                    </button>
                  )}
                </Box>
              </Box>

              {/* Expandable breakdown */}
              {expandedId === req.id && (
                <>
                  <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      mb: 1,
                    }}
                  >
                    Reward Breakdown (snapshot at request time)
                  </Typography>
                  <BreakdownTable request={req} />
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.3)", fontSize: 10, mt: 1.5, fontStyle: "italic" }}
                  >
                    Snapshot claimable at request: ${req.snapshotClaimableUSD?.toFixed(2) ?? "—"}
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
