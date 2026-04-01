# Referral Security Boundary

## Public
- referral code string itself
- wallet nonce challenges and sign messages
- safe success or error messages
- code-owner response fields needed by the code owner:
  - `code`
  - `inviterWallet`
  - `createdAt`
  - `isActive`

## Server-only
- global default master wallet
- per-code master wallet override
- protected bucket logic and counters
- allocation mode decision logic
- beneficiary resolution
- hidden invitee routing
- raw snapshot ledger
- raw claim and payout accounting

## Admin-only
- future admin summaries
- future allocation mode changes
- future KOL/master configuration
- future payout processing details

## Never expose to browser
- `REFERRAL_DEFAULT_MASTER_WALLET`
- `masterWallet`
- beneficiary routing internals
- protected bucket counters
- hidden invitee ownership
- raw accounting ledgers unless later explicitly redesigned as safe views

## Logging restriction
- do not log master wallet values
- do not log raw routing decisions
- do not log protected bucket counters
- keep error messages generic on public endpoints
