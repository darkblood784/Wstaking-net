/**
 * POST /api/referral/snapshot-cron
 *
 * Triggers a full snapshot sweep across all active referral bindings.
 * Intended to be called periodically (e.g., daily) by Vercel Cron, an
 * external scheduler, or manually by an admin.
 *
 * Authentication:
 *   Authorization: Bearer <CRON_SECRET>
 *   (or) valid wstaking_admin_session cookie (for manual admin trigger)
 *
 * The endpoint is idempotent — re-running it will not overwrite existing
 * finalized snapshots; it only fills in missing ones.
 */

import {
  getDb,
  verifyAdminSession,
  writeInviteeSnapshotsIfMissing,
} from "./_lib";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth: bearer CRON_SECRET or admin session ────────────────────────────
  const authHeader = String(req.headers.authorization || "");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // Misconfiguration — refuse to run so the missing var is obvious in logs
    console.error("[snapshot-cron] CRON_SECRET env var is not set. Aborting.");
    return res.status(500).json({ error: "Server misconfiguration: CRON_SECRET is not set." });
  }

  const isCronAuthed =
    authHeader.toLowerCase().startsWith("bearer ") &&
    authHeader.slice(7) === cronSecret;

  const isAdminAuthed = !isCronAuthed && verifyAdminSession(req) !== null;

  if (!isCronAuthed && !isAdminAuthed) {
    return res.status(401).json({ error: "Unauthorised." });
  }

  const db = await getDb();

  // ── Fetch all active referral bindings ───────────────────────────────────
  let bindingsSnap: any;
  try {
    bindingsSnap = await db.collection("referrals").get();
  } catch (err: any) {
    console.error("[snapshot-cron] Failed to fetch bindings:", err.message);
    return res.status(500).json({ error: "Failed to fetch bindings." });
  }

  let snapshotsWritten = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of bindingsSnap.docs) {
    const binding = doc.data();

    // Skip if missing required fields
    if (
      !binding.inviteeWallet ||
      !binding.inviterWallet ||
      !binding.boundAt ||
      !binding.network
    ) {
      skipped++;
      continue;
    }

    try {
      const result = await writeInviteeSnapshotsIfMissing(
        db,
        {
          inviteeWallet: binding.inviteeWallet,
          inviterWallet: binding.inviterWallet,
          boundAt: binding.boundAt,
          network: binding.network,
        },
        "cron"
      );
      snapshotsWritten += result.snapshotsWritten;
    } catch (err: any) {
      console.error(
        `[snapshot-cron] Error snapshotting ${binding.inviteeWallet}:`,
        err.message
      );
      errors.push(`${binding.inviteeWallet}: ${err.message}`);
    }
  }

  return res.status(200).json({
    success: true,
    snapshotsWritten,
    skipped,
    errors,
    processedBindings: bindingsSnap.docs.length,
  });
}
