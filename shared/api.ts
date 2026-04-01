/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface AdminAccessLogRequest {
  walletAddress: string;
  path?: string;
  chainId?: number;
  chainName?: string;
}

export interface AdminAccessLogResponse {
  ok: boolean;
  notified: boolean;
  message: string;
}

export interface AdminAuthChallengeRequest {
  walletAddress: string;
  chainId: number;
}

export interface AdminAuthChallengeResponse {
  ok: boolean;
  message: string;
  challengeToken?: string;
}

export interface AdminAuthVerifyRequest {
  walletAddress: string;
  chainId: number;
  message: string;
  signature: string;
  challengeToken: string;
}

export interface AdminAuthVerifyResponse {
  ok: boolean;
  authenticated: boolean;
  message: string;
}

export interface AdminAuthSessionResponse {
  ok: boolean;
  authenticated: boolean;
  walletAddress?: string;
  chainId?: number;
  expiresAt?: number;
  message: string;
}

export interface WalletConnectLogRequest {
  walletAddress: string;
  chainId?: number | null;
  chainName?: string;
  path?: string;
}

export interface WalletConnectLogResponse {
  ok: boolean;
  message: string;
}

export type StakingShortfallAction = "claim" | "unstake" | "partial_unstake";

export interface StakingLiquidityShortfallAlertRequest {
  source: string;
  chain: string;
  chainId: number;
  action: StakingShortfallAction;
  userWallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  stakeTxnHash?: string;
  requiredAmount: string;
  availableAmount: string;
  shortfallAmount: string;
  contractAddress: string;
  timestamp: string;
}

export interface StakingLiquidityShortfallAlertResponse {
  ok: boolean;
  forwarded: boolean;
  skipped?: boolean;
  id?: string;
  message: string;
}
