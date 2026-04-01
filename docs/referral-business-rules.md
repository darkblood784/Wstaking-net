# Referral Business Rules Freeze

## Core rules
- No migration.
- Existing bindings remain immutable.
- Future policy changes affect new bindings only.

## Code configuration
- Each code has an `inviterWallet`.
- Each code may later have:
  - `isKOL`
  - `masterWallet`
  - `contractEnd`
  - `allocationMode`

## Effective master wallet
- Use code-level `masterWallet` if present.
- Otherwise use `REFERRAL_DEFAULT_MASTER_WALLET`.
- If missing or invalid, bind fails.

## Protected bucket
- Normal code: first 2 successful bindings go to owner.
- KOL code: first 5 successful bindings go to owner.
- Counting is:
  - successful bindings only
  - per referral code
  - ordered by `boundAt`

## Allocation modes
- Launch mode: `owner_master_80_20`
- Future-supported mode: `owner_only`

### `owner_master_80_20`
- After protected bucket:
  - `hash(inviteeWallet + referralCode) % 5`
  - `0 => master`
  - `1-4 => owner`

### `owner_only`
- After protected bucket:
  - new bindings go to owner only
- Old bindings stay unchanged.

## Contract expiry
- If `contractEnd` is expired, new bindings route to master.

## Token accounting
- Reward identity is `network + tokenAddress`.
- `tokenSymbol` is display-only.

## Claims
- One claim = one beneficiary + one network + one tokenAddress.
- No mixed token or mixed chain claim requests.
