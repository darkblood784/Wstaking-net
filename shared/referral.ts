/**
 * Shared referral schemas and API contracts.
 *
 * IMPORTANT:
 * - This file is safe to import from both client and server.
 * - Keep this file limited to types/interfaces/constants that are safe for the client bundle.
 * - Do NOT place server-only helpers, secrets, routing logic, or master-wallet logic here.
 */

// Firestore document schemas

export interface ReferralCode {
  code: string;
  inviterWallet: string;
  createdAt: number;
  isActive: boolean;
}

export interface ReferralBinding {
  inviteeWallet: string;
  inviterWallet: string;
  referralCode: string;
  boundAt: number;
  ip: string | null;
  country: string | null;
  network: string;
  isNewUser: boolean;
  env: string;
  verifiedByServer?: boolean;
}

export interface RewardBreakdownItem {
  inviteeWallet: string;
  activeStakedUSD?: number;
  monthsElapsed?: number;
  rewardPerMonthUSD?: number;
  totalRewardUSD?: number;
  earnedUSD?: number;
}

export interface ReferralClaimRequest {
  id?: string;
  inviterWallet?: string;
  beneficiaryWallet?: string;
  requestedAt?: number;
  createdAt?: number;
  updatedAt?: number;
  requestedAmountUSD?: number;
  requestedAmount?: number;
  snapshotClaimableUSD?: number;
  serverCalculatedClaimableUSD?: number;
  totalEarnedUSD?: number;
  currency?: "USDT" | "USDC";
  network?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  receivingNetwork: string;
  receivingWallet: string;
  rewardBreakdown: RewardBreakdownItem[];
  status: "pending" | "approved" | "rejected" | "sent";
  adminNote?: string | null;
  processedAt?: number | null;
  processedBy?: string | null;
  processedByAdmin?: string | null;
  txnHash?: string | null;
}

export interface ReferralPayoutHistory {
  id?: string;
  claimRequestId?: string;
  claimId?: string;
  inviterWallet?: string;
  beneficiaryWallet?: string;
  amountUSD?: number;
  amount?: number;
  currency?: "USDT" | "USDC";
  network?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  receivingNetwork: string;
  receivingWallet: string;
  txnHash: string | null;
  sentAt?: number;
  processedAt?: number;
  confirmedBy?: string;
  processedByAdmin?: string;
}

export interface ReferralMonthlySnapshot {
  id?: string;
  inviteeWallet: string;
  inviterWallet: string;
  beneficiaryWallet?: string;
  network?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  epochStartMs: number;
  monthIndex: number;
  periodStartMs: number;
  periodEndMs: number;
  capturedAt: number;
  activeStakedUSD?: number;
  activeStakedAmount?: number;
  rewardForMonthUSD?: number;
  rewardForMonth?: number;
  captureMethod: "cron" | "claim-trigger" | "manual";
}

// API request / response contracts

export interface ClaimNonceResponse {
  ok: boolean;
  challengeToken: string;
  message: string;
  error?: string;
}

export interface SubmitClaimRequest {
  walletAddress: string;
  signature: string;
  challengeToken: string;
  requestedAmountUSD: number;
  receivingNetwork: string;
  receivingWallet: string;
  tokenAddress: string;
}

export interface SubmitClaimResponse {
  ok: boolean;
  claimId?: string;
  serverCalculatedClaimableUSD?: number;
  message?: string;
  error?: string;
}

export interface ProcessClaimRequest {
  claimId: string;
  action: "approved" | "rejected" | "sent";
  adminNote?: string;
  txnHash?: string;
}

export interface ProcessClaimResponse {
  ok: boolean;
  claimId?: string;
  newStatus?: "approved" | "rejected" | "sent";
  message?: string;
  error?: string;
}

export interface AdminClaimsListResponse {
  ok: boolean;
  claims?: ReferralClaimRequest[];
  error?: string;
}

export interface ReferralAdminTopInviter {
  inviterWallet: string;
  referralCode: string | null;
  inviteeCount: number;
  totalRequestedUSD: number;
  totalPaidUSD: number;
}

export interface ReferralAdminRecentBinding {
  inviteeWallet: string;
  inviterWallet: string;
  referralCode: string;
  network: string;
  boundAt: number;
}

export interface ReferralAdminCodeDirectoryItem {
  code: string;
  inviterWallet: string;
  createdAt: number;
  isActive: boolean;
}

export interface ReferralAdminSummaryData {
  totalCodes: number;
  activeCodes: number;
  totalBindings: number;
  uniqueInviters: number;
  pendingClaims: number;
  approvedClaims: number;
  sentClaims: number;
  totalRequestedUSD: number;
  totalPaidUSD: number;
  topInviters: ReferralAdminTopInviter[];
  recentBindings: ReferralAdminRecentBinding[];
  codes: ReferralAdminCodeDirectoryItem[];
}

export interface ReferralAdminSummaryResponse {
  ok: boolean;
  summary?: ReferralAdminSummaryData;
  error?: string;
}

export type ReferralAdminActivityType = "binding" | "claim" | "payout";

export interface ReferralAdminActivityItem {
  id: string;
  type: ReferralAdminActivityType;
  timestamp: number;
  inviterWallet?: string;
  inviteeWallet?: string;
  referralCode?: string | null;
  network?: string | null;
  receivingWallet?: string | null;
  tokenSymbol?: string | null;
  amountUSD?: number | null;
  status?: string | null;
  txnHash?: string | null;
}

export interface ReferralAdminActivityResponse {
  ok: boolean;
  items?: ReferralAdminActivityItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}

export interface ReferralCaptureRequest {
  code: string;
}

export interface ReferralCaptureResponse {
  ok: boolean;
  accepted?: boolean;
  error?: string;
}

export interface ReferralBindNonceResponse {
  ok: boolean;
  challengeToken?: string;
  message?: string;
  error?: string;
}

export interface ReferralBindRequest {
  walletAddress: string;
  signature: string;
  challengeToken: string;
  network: string;
  isNewUser?: boolean;
}

export interface ReferralBindResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface ReferralCheckCodeResponse {
  ok: boolean;
  code?: string;
  available?: boolean;
  error?: string;
}

export interface ReferralAdminCodePolicyRequest {
  code: string;
  isActive?: boolean;
  isKOL?: boolean;
  allocationMode?: "owner_only" | "owner_master_80_20";
  contractEnd?: number | null;
  masterWallet?: string | null;
}

export interface ReferralAdminCodePolicyResponse {
  ok: boolean;
  code?: string;
  inviterWallet?: string;
  createdAt?: number;
  isActive?: boolean;
  isKOL?: boolean;
  allocationMode?: "owner_only" | "owner_master_80_20";
  contractEnd?: number | null;
  masterWallet?: string | null;
  masterWalletConfigured?: boolean;
  error?: string;
}

export interface ReferralCodeOwnerResponse {
  ok: boolean;
  code?: string;
  inviterWallet?: string;
  createdAt?: number;
  isActive?: boolean;
  error?: string;
}

export interface ReferralSetupNonceResponse {
  ok: boolean;
  challengeToken?: string;
  message?: string;
  error?: string;
}

export interface ReferralInviteeSummary {
  inviteeWallet: string;
  boundAt: number;
  network: string;
  activeStakedUSD: number;
  monthsElapsed: number;
  earnedUSD: number;
}

export interface ReferralClaimBucketSummary {
  key: string;
  network: string;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  currency?: "USDT" | "USDC";
  totalEarnedUSD: number;
  totalRequestedUSD: number;
  pendingRequestedUSD: number;
  approvedRequestedUSD: number;
  totalPaidUSD: number;
  claimableAmountUSD: number;
}

export interface ReferralDashboardData {
  inviterWallet: string;
  referralCode: string | null;
  shareUrl: string;
  invitees: ReferralInviteeSummary[];
  totalEarnedUSD: number;
  totalPaidUSD: number;
  claimableAmountUSD: number;
  claimBuckets: ReferralClaimBucketSummary[];
  pendingClaimRequests: ReferralClaimRequest[];
  payoutHistory: ReferralPayoutHistory[];
}

export interface ReferralDashboardResponse {
  ok: boolean;
  dashboard?: ReferralDashboardData;
  error?: string;
}
