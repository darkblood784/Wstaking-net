# Referral Batch 1 Leak Audit

## Scope
- Batch 1 only
- No referral flow redesign
- Focus on leak surfaces, Firestore access, shared contracts, and response auditing

## Sensitive data inventory
- `REFERRAL_DEFAULT_MASTER_WALLET`
- per-code `masterWallet`
- future `allocationMode`
- protected bucket counters/rules
- beneficiary routing decisions
- hidden invitee ownership
- claim and payout accounting details

## Reviewed surfaces
- Frontend bundle and client imports
- Browser storage
- Firestore client reads
- Public API responses
- Environment loading
- Error/log output

## Findings

### Critical
1. `firestore.rules`
   - Current state before Batch 1: broad read access to all referral collections.
   - Risk: any browser client could inspect raw referral mappings, claim records, payout history, and snapshot ledger.
   - Batch 1 action: deny direct reads/writes on all referral collections.

2. `client/utils/referralFirestore.ts`
   - Current state: direct client helpers for `referralCodes`, `referrals`, `referralClaimRequests`, `referralPayoutHistory`, and `referralMonthlySnapshots`.
   - Risk: client-side referral ownership resolution and raw ledger access.
   - Batch 1 action: deprecate unsafe helpers and document breakpoints.

3. `client/utils/referralCapture.ts`
   - Current state: referral capture persists in `localStorage`.
   - Risk: browser-owned state instead of signed server-owned capture.
   - Batch 1 action: deprecation note only; Batch 2 will replace this with signed cookie capture.

### Medium
1. `api/referral/bind.ts`
   - Current state: response included `inviterWallet`.
   - Risk: unnecessary code-meaning exposure.
   - Batch 1 action: remove `inviterWallet` from response now.

2. `api/referral/get-or-create-code.ts`
   - Current state: returns raw document via spread.
   - Risk: future sensitive fields would leak automatically.
   - Batch 1 action: explicit safe response whitelist.

3. `api/referral/set-custom-code.ts`
   - Current state: returns raw document via spread, including ownership proof metadata.
   - Risk: unnecessary field leakage.
   - Batch 1 action: explicit safe response whitelist.

## Current UI breakpoints expected from Batch 1 Firestore rules
- Referral code lookup by client Firestore helper
- Existing referral code lookup by wallet from client
- Client-side invitee list reads
- Client-side claim history reads
- Client-side payout history reads
- Client-side snapshot reads

These breakpoints are expected and are resolved in Batch 2 and later by backend-owned APIs.

## API response audit

### `GET /api/referral/check-code`
- `ok`: safe public
- `code`: safe public
- `available`: safe public
- `error`: safe public

### `GET /api/referral/claim-nonce`
- `ok`: safe public
- `challengeToken`: safe public
- `message`: safe public
- `error`: safe public

### `GET /api/referral/setup-nonce`
- `ok`: safe public
- `challengeToken`: safe public
- `message`: safe public
- `error`: safe public

### `GET|POST /api/referral/bind`
- `ok`: safe public
- `message`: safe public
- `error`: safe public
- `challengeToken` on GET: safe public
- `inviterWallet`: unsafe remove now

### `POST /api/referral/get-or-create-code`
- `ok`: safe public
- `code`: safe public
- `inviterWallet`: safe public for code owner response
- `createdAt`: safe public for code owner response
- `isActive`: safe public for code owner response
- any extra future raw document field from spread: unsafe remove now

### `PUT /api/referral/set-custom-code`
- `ok`: safe public
- `code`: safe public
- `inviterWallet`: safe public for code owner response
- `createdAt`: safe public for code owner response
- `isActive`: safe public for code owner response
- `replaced`: safe public
- `ownershipSignature`: unsafe remove now
- `ownershipVerifiedAt`: unsafe remove now
- any future raw document field from spread: unsafe remove now

### `POST /api/referral/submit-claim`
- `ok`: safe public
- `claimId`: safe public
- `serverCalculatedClaimableUSD`: unsafe remove later
- `message`: safe public
- `error`: safe public

### `POST /api/referral/process-claim`
- `ok`: safe public
- `claimId`: safe public
- `newStatus`: safe public
- `message`: safe public
- `error`: safe public

### `POST /api/referral/snapshot-cron`
- `success`: admin/cron only, safe in restricted context
- `snapshotsWritten`: admin/cron only, safe in restricted context
- `skipped`: admin/cron only, safe in restricted context
- `errors`: unsafe remove later from public-like surfaces, keep restricted to admin/cron only
- `processedBindings`: admin/cron only, safe in restricted context

## Batch 1 outputs
- Firestore rules hardened
- unsafe API spreads removed
- shared contracts frozen
- deprecation notes added to insecure client helpers
