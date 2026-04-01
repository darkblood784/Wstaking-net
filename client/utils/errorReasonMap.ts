/**
 * Maps custom contract error names to user-friendly messages
 * Used when contract reverts with custom errors instead of events
 */

export const ERROR_REASON_MAP: Record<string, string> = {
  // Hot wallet / Liquidity errors (Critical for users)
  InsufficientHotWalletLiquidity:
    "Network congestion, please wait a few hours and try again.",

  // Staking amount / token errors
  ZeroDuration: "Staking duration must be greater than zero.",
  UnsupportedToken: "This token is not supported for staking.",
  InvalidToken:
    "Invalid token for this operation. Please check and try again.",

  // Duration / Time configuration errors
  Invalidtimerange:
    "Invalid staking duration selected. Please choose a valid duration.",

  // Promotion / Status errors
  Promotionnotactive:
    "The promotion period is not currently active. Please use regular staking.",

  // Access / Authorization errors
  UnauthorizedAccess: "You are not authorized for this action or the system is under maintenance.",

  // Hot wallet configuration errors
  InvalidHotWallet: "Hot wallet configuration error. Please contact support.",
  InvalidAddress: "Invalid wallet address provided.",
  InvalidAPRCalculation:
    "Reward calculation failed. Please try again shortly.",

  // Allowance errors
  InsufficientAllowance:
    "You have not approved enough tokens for this transaction.",

  // Other errors
  TransferFailed: "Token transfer failed. Please try again.",
  Nolockedstakesfound: "No locked stakes found.",
  Nounlockedstakesfound: "No unlocked stakes found.",
  OutOfBounds: "Index out of range.",
  Alreadyadmin: "Address is already an admin.",
  Notadmin: "Address is not an admin.",
  indexoutofrange: "Index out of range.",
  InvalidOwner: "Invalid owner address.",
  InvalidSecondOwner: "Invalid second owner address.",
  EmptyName: "Name cannot be empty.",
};

/**
 * Maps custom error selectors (4-byte codes) to error names
 * These are the Keccak256 hashes of error signatures
 * 
 * To calculate selector for an error:
 * bytes4(keccak256(abi.encodePacked("ErrorName()")))
 * or
 * bytes4(keccak256(abi.encodePacked("ErrorName(type1,type2,...)")))
 */
export const ERROR_SELECTOR_MAP: Record<string, string> = {
  // User-facing operations
  "0xff6ce809": "InsufficientHotWalletLiquidity", // Hot wallet insufficient funds
  "0xc1ab6dc1": "InvalidToken", // Fee-on-transfer tokens not supported
  "0x74e7226d": "Invalidtimerange", // Invalid time range for operations
  "0xddb6f689": "Promotionnotactive", // Promotion not active
  "0x6a1ae748": "ZeroDuration", // Zero duration provided
  "0xff0cce1d": "UnsupportedToken", // Token not supported
  "0xe6c4afe1": "InvalidAddress", // Invalid address (0x0)
  "0xd78a5797": "InvalidHotWallet", // Invalid hot wallet address
  "0x8fcbbee3": "UnauthorizedAccess", // Unauthorized or system maintenance
  "0x1c96c844": "InsufficientAllowance", // Insufficient token allowance
  "0xc6e6a23d": "TransferFailed", // ERC20 transfer failed
};

/**
 * Get user-friendly error message from contract error name
 * @param errorName - The custom error name from contract revert
 * @param fallback - Default message if error name not mapped
 * @returns User-friendly error message
 */
export const getErrorMessage = (errorName: string, fallback: string): string => {
  return ERROR_REASON_MAP[errorName] || fallback;
};
