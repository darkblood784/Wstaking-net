import type {
  ReferralBinding,
  ReferralInviteeSummary,
  RewardBreakdownItem,
} from "@shared/referral";

function retiredReferralClientLogic(name: string): never {
  throw new Error(
    `Client-side referral reward logic has been retired (${name}). Use backend-owned referral APIs instead.`
  );
}

export const REFERRAL_MONTHLY_RATE = 0;

export function calcMonthsElapsed(_dateA: number, _dateB: number): number {
  retiredReferralClientLogic("calcMonthsElapsed");
}

export function calcInviteeReward(
  _binding: ReferralBinding,
  _rawStakes: unknown[],
  _precision: number,
): RewardBreakdownItem {
  retiredReferralClientLogic("calcInviteeReward");
}

export function calcTotalRewards(
  _breakdowns: RewardBreakdownItem[],
  _totalPaidUSD: number,
): { totalEarnedUSD: number; claimableAmountUSD: number } {
  retiredReferralClientLogic("calcTotalRewards");
}

export function buildInviteeSummary(
  _binding: ReferralBinding,
  _breakdown: RewardBreakdownItem,
): ReferralInviteeSummary {
  retiredReferralClientLogic("buildInviteeSummary");
}

export function getNetworkInfoByName(
  _networkName: string,
): { chainId: number; precision: number } | null {
  retiredReferralClientLogic("getNetworkInfoByName");
}
