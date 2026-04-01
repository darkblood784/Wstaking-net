import { Box, CircularProgress, Typography } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { useNotification } from "@/components/NotificationProvider";
import type { ReferralAdminCodePolicyResponse } from "@shared/referral";

interface FormState {
  code: string;
  inviterWallet: string;
  createdAt: number | null;
  isActive: boolean;
  isKOL: boolean;
  contractEndDate: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
};

function toLocalDateTimeInput(timestamp: number | null | undefined) {
  if (!timestamp || !Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function splitContractEndInput(value: string) {
  if (!value) {
    return { contractEndDate: "" };
  }
  const [contractEndDate = ""] = value.split("T");
  return { contractEndDate };
}

function joinContractEndInput(date: string) {
  if (!date) return "";
  return `${date}T00:00`;
}

function normalizeTypedDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return trimmed;
}

function isValidDateOnlyInput(value: string) {
  if (!value) return false;
  const normalized = normalizeTypedDateInput(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day)
  );
}

function formatDisplayDate(value: string) {
  if (!isValidDateOnlyInput(value)) return value;
  return new Date(`${normalizeTypedDateInput(value)}T00:00:00`).toLocaleDateString();
}

function buildPresetDate(monthsAhead: number) {
  const next = new Date();
  next.setHours(0, 0, 0, 0);
  next.setMonth(next.getMonth() + monthsAhead);
  return next.toISOString().slice(0, 10);
}

const CONTRACT_PRESETS = [
  { label: "1 Month", months: 1 },
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "12 Months", months: 12 },
];

function shortenWallet(value?: string | null) {
  if (!value) return "-";
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function buildInitialState(): FormState {
  return {
    code: "",
    inviterWallet: "",
    createdAt: null,
    isActive: true,
    isKOL: false,
    contractEndDate: "",
  };
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        p: { xs: 1.5, md: 2 },
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ color: "white", fontSize: { xs: 13, md: 14 }, fontWeight: 700 }}>{label}</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12, mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          minWidth: 110,
          padding: "8px 12px",
          borderRadius: 999,
          border: checked ? "1px solid #12B980" : "1px solid rgba(255,255,255,0.16)",
          background: checked ? "rgba(18,185,128,0.14)" : "transparent",
          color: checked ? "#12B980" : "rgba(255,255,255,0.62)",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          alignSelf: "flex-start",
        }}
      >
        {checked ? "Enabled" : "Disabled"}
      </button>
    </Box>
  );
}

export default function ReferralCodePolicyPanel() {
  const { showNotification } = useNotification();
  const calendarInputRef = useRef<HTMLInputElement | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [form, setForm] = useState<FormState>(buildInitialState);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const contractEndInput = useMemo(() => joinContractEndInput(form.contractEndDate), [form.contractEndDate]);

  const contractPreview = useMemo(() => {
    if (!contractEndInput) return "No contract end is set. New bindings continue using the active routing rules.";
    const timestamp = new Date(contractEndInput).getTime();
    if (!Number.isFinite(timestamp)) return "Enter a valid contract end date and time.";
    return `After ${new Date(timestamp).toLocaleString()}, new bindings on this code will no longer route to inviter wallet.`;
  }, [contractEndInput]);

  const contractDateError = useMemo(() => {
    if (!form.contractEndDate) return "";
    return isValidDateOnlyInput(form.contractEndDate) ? "" : "Enter a valid date in YYYY-MM-DD or MM/DD/YYYY format.";
  }, [form.contractEndDate]);

  function applyResponse(data: ReferralAdminCodePolicyResponse) {
    const contractParts = splitContractEndInput(toLocalDateTimeInput(data.contractEnd));
    setForm({
      code: data.code || "",
      inviterWallet: data.inviterWallet || "",
      createdAt: data.createdAt ?? null,
      isActive: data.isActive !== false,
      isKOL: Boolean(data.isKOL),
      contractEndDate: contractParts.contractEndDate,
    });
    setLoaded(true);
  }

  async function handleLookup() {
    const code = lookupCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a referral code first.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ code });
      const res = await fetch(`/api/referral/admin-code-policy?${params.toString()}`, {
        credentials: "include",
      });
      const data: ReferralAdminCodePolicyResponse = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok || !data.code) {
        throw new Error(data.error || "Failed to load referral code settings.");
      }
      applyResponse(data);
      setLookupCode(data.code);
      showNotification(`Referral code ${data.code} loaded.`, "success");
    } catch (err: any) {
      setLoaded(false);
      setError(err?.message || "Failed to load referral code settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!loaded || !form.code) {
      setError("Load a referral code before saving changes.");
      return;
    }

    let contractEnd: number | null | undefined = undefined;
    if (contractEndInput.trim()) {
      if (!isValidDateOnlyInput(form.contractEndDate)) {
        setError("Contract end must be a valid date.");
        return;
      }
      const parsed = new Date(contractEndInput).getTime();
      if (!Number.isFinite(parsed)) {
        setError("Contract end must be a valid date and time.");
        return;
      }
      contractEnd = parsed;
    } else {
      contractEnd = null;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/referral/admin-code-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: form.code,
          isActive: form.isActive,
          isKOL: form.isKOL,
          contractEnd,
        }),
      });
      const data: ReferralAdminCodePolicyResponse = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok || !data.code) {
        throw new Error(data.error || "Failed to save referral code settings.");
      }
      applyResponse(data);
      showNotification(`Referral code ${data.code} updated successfully.`, "success");
    } catch (err: any) {
      const message = err?.message || "Failed to save referral code settings.";
      setError(message);
      showNotification(message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleResetLoadedValues() {
    if (!form.code) return;
    setLookupCode(form.code);
    handleLookup();
  }

  function openCalendarPicker() {
    const input = calendarInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
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
      <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={2.5}>
        <Box sx={{ minWidth: { xs: 0, md: 240 }, flex: 1 }}>
          <Typography fontWeight={700} color="white">
            Referral Code Management
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mt: 0.5 }}>
            Search any referral code, review its current policy, then update KOL, active status, contract expiry.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            width: { xs: "100%", md: "auto" },
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
          }}
        >
          <input
            value={lookupCode}
            onChange={(event) => setLookupCode(event.target.value.toUpperCase())}
            placeholder="Enter referral code"
            style={{ ...INPUT_STYLE, minWidth: 0, width: "auto", flex: 1 }}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: loading ? "rgba(18,185,128,0.35)" : "#12B980",
              color: loading ? "rgba(0,0,0,0.55)" : "black",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              width: "100%",
              minHeight: 44,
            }}
          >
            {loading ? "Loading..." : "Load Code"}
          </button>
        </Box>
      </Box>

    

      {error && (
        <Typography sx={{ color: "#f87171", fontSize: 13, mb: 2 }}>{error}</Typography>
      )}

      {!loaded && !loading && (
        <Box
          sx={{
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 3,
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: 13 }}>
            Load a referral code to manage its admin policy settings.
          </Typography>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} sx={{ color: "#12B980" }} />
        </Box>
      )}

      {loaded && !loading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <Box sx={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: { xs: 1.5, md: 2 }, background: "rgba(255,255,255,0.02)" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Referral Code
              </Typography>
              <Typography sx={{ color: "white", fontSize: 22, fontWeight: 700, mt: 0.75 }}>
                {form.code}
              </Typography>
            </Box>
            <Box sx={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: { xs: 1.5, md: 2 }, background: "rgba(255,255,255,0.02)" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Owner Wallet
              </Typography>
              <Typography sx={{ color: "white", fontSize: { xs: 14, md: 16 }, fontWeight: 700, mt: 0.75, fontFamily: "monospace", wordBreak: "break-all" }}>
                {shortenWallet(form.inviterWallet)}
              </Typography>
            </Box>
            <Box sx={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: { xs: 1.5, md: 2 }, background: "rgba(255,255,255,0.02)" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Created
              </Typography>
              <Typography sx={{ color: "white", fontSize: { xs: 14, md: 16 }, fontWeight: 700, mt: 0.75 }}>
                {form.createdAt ? new Date(form.createdAt).toLocaleString() : "-"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            <ToggleCard
              label="Code Active"
              description="Turn this off to prevent new bindings from using this code."
              checked={form.isActive}
              onChange={(next) => setForm((current) => ({ ...current, isActive: next }))}
            />
            <ToggleCard
              label="KOL Mode"
              description="KOL codes keep the first 5 successful bindings in the owner-protected bucket."
              checked={form.isKOL}
              onChange={(next) => setForm((current) => ({ ...current, isKOL: next }))}
            />
          </Box>

          <Box
            sx={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              p: 2,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Typography sx={{ color: "white", fontSize: 14, fontWeight: 700, mb: 1.5 }}>
              Contract End
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                mb: 1.25,
              }}
            >
              {CONTRACT_PRESETS.map((preset) => (
                <button
                  key={preset.months}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      contractEndDate: buildPresetDate(preset.months),
                    }))
                  }
                  style={{
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.75)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    flex: "0 0 auto",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "stretch",
                gap: 1,
                width: "100%",
                maxWidth: { xs: "100%", md: 420 },
                position: "relative",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.contractEndDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contractEndDate: normalizeTypedDateInput(event.target.value),
                    }))
                  }
                  placeholder="YYYY-MM-DD or MM/DD/YYYY"
                  style={{ ...INPUT_STYLE, width: "100%" }}
                />
              </Box>
              <button
                type="button"
                onClick={openCalendarPicker}
                style={{
                  height: 42,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.78)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  width: "100%",
                  maxWidth: "120px",
                  flexShrink: 0,
                  alignSelf: "stretch",
                }}
              >
                Calendar
              </button>
              <input
                ref={calendarInputRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                value={isValidDateOnlyInput(form.contractEndDate) ? normalizeTypedDateInput(form.contractEndDate) : ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contractEndDate: event.target.value,
                  }))
                }
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            </Box>
            {form.contractEndDate && !contractDateError && (
              <Typography sx={{ color: "#12B980", fontSize: 12, mt: 1 }}>
                Selected date: {formatDisplayDate(form.contractEndDate)}
              </Typography>
            )}
            {contractDateError && (
              <Typography sx={{ color: "#f87171", fontSize: 12, mt: 1 }}>
                {contractDateError}
              </Typography>
            )}
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12, mt: 1 }}>
              {contractPreview} Use a month shortcut, pick from the calendar, or type the date manually.
            </Typography>
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, contractEndDate: "" }))}
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "transparent",
                color: "rgba(255,255,255,0.68)",
                cursor: "pointer",
              }}
            >
              Clear Contract End
            </button>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleResetLoadedValues}
              disabled={saving}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "transparent",
                color: "rgba(255,255,255,0.68)",
                cursor: saving ? "not-allowed" : "pointer",
                width: "100%",
                maxWidth: "220px",
              }}
            >
              Reset To Saved Values
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: saving ? "rgba(18,185,128,0.35)" : "#12B980",
                color: saving ? "rgba(0,0,0,0.55)" : "black",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                width: "100%",
                maxWidth: "180px",
                minHeight: 44,
              }}
            >
              {saving ? "Saving..." : "Save Policy"}
            </button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
