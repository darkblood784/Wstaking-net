import type {
  ReferralBinding,
  ReferralClaimRequest,
  ReferralCode,
  ReferralMonthlySnapshot,
  ReferralPayoutHistory,
} from "@shared/referral";

function blockedReferralClientAccess(operation: string): never {
  throw new Error(
    `Missing or insufficient permissions for client referral Firestore access (${operation}). Use backend-owned referral APIs instead.`
  );
}

export function generateReferralCode(_walletAddress: string): string {
  blockedReferralClientAccess("referralCodes:generateReferralCode");
}

export async function getReferralCodeByWallet(
  _walletAddress: string,
): Promise<ReferralCode | null> {
  blockedReferralClientAccess("referralCodes:getReferralCodeByWallet");
}

export async function getOrCreateReferralCode(
  _walletAddress: string,
): Promise<ReferralCode> {
  blockedReferralClientAccess("referralCodes:getOrCreateReferralCode");
}

export async function getExistingReferralCode(
  _walletAddress: string,
): Promise<ReferralCode | null> {
  blockedReferralClientAccess("referralCodes:getExistingReferralCode");
}

export async function setCustomReferralCode(
  _walletAddress: string,
  _code: string,
  _signature: string,
  _challengeToken: string,
): Promise<ReferralCode> {
  blockedReferralClientAccess("referralCodes:setCustomReferralCode");
}

export async function getInviterByCode(_code: string): Promise<string | null> {
  blockedReferralClientAccess("referralCodes:getInviterByCode");
}

export async function getBinding(
  _inviteeWallet: string,
): Promise<ReferralBinding | null> {
  blockedReferralClientAccess("referrals:getBinding");
}

export async function createBinding(
  _inviteeWallet: string,
  _referralCode: string,
  _network: string,
  _isNewUser: boolean,
  _env: string,
  _ip: string | null = null,
  _country: string | null = null,
): Promise<"bound" | "already-bound" | "self-referral" | "invalid-code" | "error"> {
  blockedReferralClientAccess("referrals:createBinding");
}

export async function getInvitees(
  _inviterWallet: string,
): Promise<ReferralBinding[]> {
  blockedReferralClientAccess("referrals:getInvitees");
}

export async function createClaimRequest(
  _claim: Omit<ReferralClaimRequest, "id" | "requestedAt" | "status" | "adminNote" | "processedAt" | "processedBy" | "txnHash">,
): Promise<string | null> {
  blockedReferralClientAccess("referralClaimRequests:createClaimRequest");
}

export async function getClaimRequestsByInviter(
  _inviterWallet: string,
): Promise<ReferralClaimRequest[]> {
  blockedReferralClientAccess("referralClaimRequests:getClaimRequestsByInviter");
}

export async function getAllClaimRequests(): Promise<ReferralClaimRequest[]> {
  blockedReferralClientAccess("referralClaimRequests:getAllClaimRequests");
}

export async function updateClaimRequestStatus(
  _requestId: string,
  _status: ReferralClaimRequest["status"],
  _adminWallet: string,
  _adminNote?: string,
  _txnHash?: string,
): Promise<boolean> {
  blockedReferralClientAccess("referralClaimRequests:updateClaimRequestStatus");
}

export async function createPayoutRecord(
  _payout: Omit<ReferralPayoutHistory, "id">,
): Promise<string | null> {
  blockedReferralClientAccess("referralPayoutHistory:createPayoutRecord");
}

export async function getPayoutHistory(
  _inviterWallet: string,
): Promise<ReferralPayoutHistory[]> {
  blockedReferralClientAccess("referralPayoutHistory:getPayoutHistory");
}

export async function getAllPayoutHistory(): Promise<ReferralPayoutHistory[]> {
  blockedReferralClientAccess("referralPayoutHistory:getAllPayoutHistory");
}

export async function getSnapshotsForInvitee(
  _inviteeWallet: string,
): Promise<ReferralMonthlySnapshot[]> {
  blockedReferralClientAccess("referralMonthlySnapshots:getSnapshotsForInvitee");
}

export async function getSnapshotsForInviter(
  _inviterWallet: string,
): Promise<ReferralMonthlySnapshot[]> {
  blockedReferralClientAccess("referralMonthlySnapshots:getSnapshotsForInviter");
}
