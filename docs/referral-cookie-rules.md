# Referral Cookie Capture Rules

## Batch 1 status
- Not implemented yet.
- Frozen here so Batch 2 has a fixed contract.

## Target cookie design
- signed cookie
- `HttpOnly`
- `Secure`
- `SameSite=Lax`

## Expiry
- 30 days

## Overwrite behavior
- newest referral link overwrites the pending captured code
- applies only until a successful bind happens

## Clear behavior
- clear the cookie after successful bind

## Wallet switching
- capture is browser-level
- bind is wallet-level
- changing connected wallet does not change the pending code by itself

## Already-bound wallet behavior
- rebinding is not allowed
- API should return a generic safe message only
- no routing details exposed

## Expired cookie behavior
- no bind should proceed from an expired capture cookie
