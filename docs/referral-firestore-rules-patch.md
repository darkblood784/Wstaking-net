# Firestore Rules Patch

## Exact rule diff
```diff
-    match /referralCodes/{code} {
-      allow read: if true;
-      allow write: if false;
-    }
+    match /referralCodes/{code} {
+      allow read: if false;
+      allow write: if false;
+    }

-    match /referrals/{inviteeWallet} {
-      allow read: if true;
-      allow create: if false;
-      allow update: if false;
-      allow delete: if false;
-    }
+    match /referrals/{inviteeWallet} {
+      allow read: if false;
+      allow create: if false;
+      allow update: if false;
+      allow delete: if false;
+    }

-    match /referralClaimRequests/{docId} {
-      allow read: if true;
-      allow write: if false;
-    }
+    match /referralClaimRequests/{docId} {
+      allow read: if false;
+      allow write: if false;
+    }

-    match /referralPayoutHistory/{docId} {
-      allow read: if true;
-      allow write: if false;
-    }
+    match /referralPayoutHistory/{docId} {
+      allow read: if false;
+      allow write: if false;
+    }

-    match /referralMonthlySnapshots/{docId} {
-      allow read: if true;
-      allow write: if false;
-    }
+    match /referralMonthlySnapshots/{docId} {
+      allow read: if false;
+      allow write: if false;
+    }
```

## Why this patch exists
- Browser users currently can inspect raw referral data through direct Firestore reads.
- Batch 1 closes that path before the backend-owned replacements arrive in Batch 2+.

## Likely current UI breakpoints
- code lookup helpers that query `referralCodes` from the browser
- existing code lookup by wallet from browser
- browser invitee list reads
- browser claim history reads
- browser payout history reads
- browser snapshot reads

## Manual verification
1. Open the referral UI and watch the browser console/network.
2. Trigger screens that currently use client Firestore reads.
3. Confirm Firestore requests now fail with permission errors.
4. Confirm server API routes still work where they use Admin SDK.
5. Confirm no browser user can directly fetch docs from:
   - `referralCodes`
   - `referrals`
   - `referralClaimRequests`
   - `referralPayoutHistory`
   - `referralMonthlySnapshots`
