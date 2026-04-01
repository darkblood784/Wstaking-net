# WStaking New UI

## Vercel Deployment (Team Guide)

This project is a Vite SPA with a small serverless API (`/api/price`).  
Vercel must be configured to output **`dist/spa`**.

### 1) Vercel Project Settings
**Build & Output**
- **Framework Preset:** Vite
- **Build Command:** `pnpm build`
- **Output Directory:** `dist/spa`
- **Install Command:** `pnpm install`

### 2) Environment Variables
Add all `VITE_*` variables from your local `.env` into Vercel → **Project → Settings → Environment Variables**.

Minimum required:
- `VITE_PROJECT_ID`
- `VITE_SUPPORTED_CHAINS`
- `VITE_MAINNET_CHAINS`
- `VITE_BSC_CONTRACT_ADDRESS`
- `VITE_XLAYER_CONTRACT_ADDRESS`
- `VITE_BASE_CONTRACT_ADDRESS`
- `VITE_BSC_TESTNET_CONTRACT_ADDRESS` (pre-prod)
- `VITE_BASE_SEPOLIA_CONTRACT_ADDRESS` (pre-prod)
- `VITE_FIREBASE_API_KEY`

### 3) Deploy
Push to `main`, then click **Deploy** in Vercel.

### 4) Common Errors
**404: NOT_FOUND**
- This happens if Vercel is looking for `dist` instead of `dist/spa`.
- Ensure Output Directory is `dist/spa` or keep `vercel.json` in repo.

---

If you’re unsure, ask a teammate to verify the Vercel settings:
**Project → Settings → Build & Output**.
