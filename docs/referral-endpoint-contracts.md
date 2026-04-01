# Referral Endpoint Contracts

## `GET /api/referral/check-code?code=XXXX`
Response:
```json
{
  "ok": true,
  "code": "ABCD1234",
  "available": true
}
```
Forbidden response fields:
- `inviterWallet`
- `masterWallet`
- any routing metadata

## `GET /api/referral/claim-nonce?wallet=0x...`
Response:
```json
{
  "ok": true,
  "challengeToken": "signed-token",
  "message": "Sign this message..."
}
```

## `GET /api/referral/setup-nonce?wallet=0x...`
Response:
```json
{
  "ok": true,
  "challengeToken": "signed-token",
  "message": "Sign this message..."
}
```

## `GET /api/referral/bind-nonce?wallet=0x...`
Response:
```json
{
  "ok": true,
  "challengeToken": "signed-token",
  "message": "Sign this message..."
}
```

## `POST /api/referral/bind`
Current Batch 1 request:
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "challengeToken": "signed-token",
  "referralCode": "ABCD1234",
  "network": "Base",
  "isNewUser": false
}
```
Batch 1 safe response:
```json
{
  "ok": true,
  "message": "Wallet successfully bound to referral code."
}
```
Forbidden response fields:
- `inviterWallet`
- `beneficiaryWallet`
- `masterWallet`
- any assignment metadata

## `POST /api/referral/get-or-create-code`
Response:
```json
{
  "ok": true,
  "code": "ABCD1234",
  "inviterWallet": "0x...",
  "createdAt": 1234567890,
  "isActive": true
}
```
Forbidden response fields:
- `masterWallet`
- `ownershipSignature`
- hidden admin metadata

## `PUT /api/referral/set-custom-code`
Response:
```json
{
  "ok": true,
  "code": "ABCD1234",
  "inviterWallet": "0x...",
  "createdAt": 1234567890,
  "isActive": true
}
```
Optional:
```json
{
  "replaced": "OLD1234"
}
```
Forbidden response fields:
- `ownershipSignature`
- `ownershipVerifiedAt`
- `masterWallet`

## `POST /api/referral/submit-claim`
Response:
```json
{
  "ok": true,
  "claimId": "firestore-id",
  "serverCalculatedClaimableUSD": 12.34,
  "message": "Claim request submitted successfully. An admin will process it shortly."
}
```
Note:
- `serverCalculatedClaimableUSD` is tolerated in current flow but should be reconsidered later when bucketed beneficiary claims ship.

## `POST /api/referral/process-claim`
Response:
```json
{
  "ok": true,
  "claimId": "firestore-id",
  "newStatus": "approved",
  "message": "Claim approved successfully."
}
```

## Future endpoints frozen in Batch 1 docs only
- `POST /api/referral/capture`
- `GET /api/referral/dashboard`
