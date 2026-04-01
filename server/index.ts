import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handlePrice } from "./routes/price";
import { handleAdminAccessLog } from "./routes/admin-access";
import adminAuthChallengeHandler from "../api/admin-auth/challenge";
import adminAuthVerifyHandler from "../api/admin-auth/verify";
import adminAuthSessionHandler from "../api/admin-auth/session";
import adminAuthLogoutHandler from "../api/admin-auth/logout";
import adminLogoutHandler from "../api/admin/logout";
import walletConnectHandler from "../api/wallet-connect";
import walletConnectDailyReportHandler from "../api/wallet-connect/daily-report";
import walletConnectRecentReportHandler from "../api/wallet-connect/recent-report";
import partialUnstakeHistoryHandler from "../api/partial-unstake-history";
import referralClaimNonceHandler from "../api/referral/claim-nonce";
import referralSubmitClaimHandler from "../api/referral/submit-claim";
import referralProcessClaimHandler from "../api/referral/process-claim";
import referralSnapshotCronHandler from "../api/referral/snapshot-cron";
import referralBindHandler, { handleGetNonce as referralBindNonceHandler } from "../api/referral/bind";
import referralGetOrCreateCodeHandler from "../api/referral/get-or-create-code";
import referralSetCustomCodeHandler from "../api/referral/set-custom-code";
import referralCheckCodeHandler from "../api/referral/check-code";
import referralSetupNonceHandler from "../api/referral/setup-nonce";
import referralAdminClaimsHandler from "../api/referral/admin-claims";
import referralAdminSummaryHandler from "../api/referral/admin-summary";
import referralAdminActivityHandler from "../api/referral/admin-activity";
import referralAdminCodePolicyHandler from "../api/referral/admin-code-policy";
import referralCaptureHandler from "../api/referral/capture";
import referralDashboardHandler from "../api/referral/dashboard";
import { handleStakingShortfallAlert } from "./routes/staking-shortfall";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/price", handlePrice);
  app.post("/api/staking/liquidity-shortfall-alert", handleStakingShortfallAlert);
  app.post("/api/admin/access", handleAdminAccessLog);
  app.post("/api/admin-auth/challenge", adminAuthChallengeHandler as any);
  app.post("/api/admin-auth/verify", adminAuthVerifyHandler as any);
  app.get("/api/admin-auth/session", adminAuthSessionHandler as any);
  app.post("/api/admin-auth/logout", adminAuthLogoutHandler as any);
  app.post("/api/admin/logout", adminLogoutHandler as any);
  app.post("/api/wallet-connect", walletConnectHandler as any);
  app.get("/api/wallet-connect/recent-report", walletConnectRecentReportHandler as any);
  app.post("/api/wallet-connect/recent-report", walletConnectRecentReportHandler as any);
  app.get("/api/wallet-connect/daily-report", walletConnectDailyReportHandler as any);
  app.post("/api/wallet-connect/daily-report", walletConnectDailyReportHandler as any);
  app.get("/api/partial-unstake-history", partialUnstakeHistoryHandler as any);
  app.get("/api/referral/claim-nonce", referralClaimNonceHandler as any);
  app.post("/api/referral/get-or-create-code", referralGetOrCreateCodeHandler as any);
  app.put("/api/referral/set-custom-code", referralSetCustomCodeHandler as any);
  app.get("/api/referral/check-code", referralCheckCodeHandler as any);
  app.post("/api/referral/capture", referralCaptureHandler as any);
  app.get("/api/referral/dashboard", referralDashboardHandler as any);
  app.get("/api/referral/setup-nonce", referralSetupNonceHandler as any);
  app.post("/api/referral/submit-claim", referralSubmitClaimHandler as any);
  app.post("/api/referral/process-claim", referralProcessClaimHandler as any);
  app.get("/api/referral/admin-claims", referralAdminClaimsHandler as any);
  app.get("/api/referral/admin-summary", referralAdminSummaryHandler as any);
  app.get("/api/referral/admin-activity", referralAdminActivityHandler as any);
  app.get("/api/referral/admin-code-policy", referralAdminCodePolicyHandler as any);
  app.post("/api/referral/admin-code-policy", referralAdminCodePolicyHandler as any);
  app.post("/api/referral/snapshot-cron", referralSnapshotCronHandler as any);
  app.get("/api/referral/bind-nonce", referralBindNonceHandler as any);
  app.post("/api/referral/bind", referralBindHandler as any);

  return app;
}


