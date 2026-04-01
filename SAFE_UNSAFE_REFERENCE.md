# Public Repository Safe/Unsafe Quick Reference

## ⚡ TL;DR

**Push to public:** ✅ All source code, configs, documentation, contract ABIs  
**Never push:** ❌ `.env` files with real values, Firebase keys, private keys, API keys  
**Push as template:** 📝 `.env.example` with ONLY placeholder values

---

## 📊 Quick Reference Matrix

### SAFE TO COMMIT ✅

| File/Folder | Notes | Example |
|---|---|---|
| **Source Code** | All `.ts`, `.tsx`, `.js` files | `client/components/Header.tsx` |
| **Type Definitions** | TypeScript interfaces and types | `shared/api.ts` |
| **React Components** | All UI components | `client/pages/Stake.tsx` |
| **API Routes** | Express route handlers | `server/routes/staking.ts` |
| **Smart Contract ABIs** | JSON ABI files are public data | `abi/BASESecureStakingV3.abi.json` |
| **Smart Contract Code** | `.sol` files (can be public) | `BASESecureStakingV3.sol` |
| **Build Config** | Vite, webpack, etc. | `vite.config.ts` |
| **TypeScript Config** | TS compiler settings | `tsconfig.json` |
| **Tailwind Config** | Styling configuration | `tailwind.config.ts` |
| **PostCSS Config** | CSS processing | `postcss.config.js` |
| **Package Files** | Dependencies list | `package.json`, `pnpm-lock.yaml` |
| **Deployment Configs** | Vercel, Netlify configs | `vercel.json`, `netlify.toml` |
| **Firebase Rules** | Database rules (no secrets) | `firestore.rules` |
| **Firebase Indexes** | Database indexing | `firestore.indexes.json` |
| **Static Assets** | Images, fonts, public files | `public/`, `assets/` |
| **Documentation** | README, guides, comments | `README.md`, `*.md` files |
| **License** | Open source license | `LICENSE` |
| **Git Configuration** | `.gitignore`, `.gitattributes` | `.gitignore` |
| **Code Formatting** | Prettier, ESLint configs | `.prettierrc`, `.eslintrc` |

### NEVER COMMIT ❌

| File/Folder | Why Dangerous | Example |
|---|---|---|
| **.env** | Contains real credentials | ADMIN_AUTH_SECRET=actual_secret |
| **.env.local** | Local development secrets | FIREBASE_KEY=real_key |
| **.env.preprod** | Pre-production credentials | RPC_URL_WITH_API_KEY=... |
| **.env.prod** | Production credentials | DATABASE_PASSWORD=... |
| **Firebase Service Account** | Private key included | firebase-adminsdk-*.json |
| **Private Keys** | Wallet/SSH keys | *.pem, *.key, id_rsa |
| **AWS Credentials** | Full cloud access | .aws/ directory |
| **API Keys** | Rate limit abuse possible | ETHERSCAN_API_KEY=... |
| **Database Passwords** | Full DB access | DB_PASSWORD=... |
| **SMTP Credentials** | Email spoofing | SMTP_PASSWORD=... |
| **Admin Secrets** | System compromise | ADMIN_AUTH_SECRET=... |
| **RPC Endpoints with Keys** | API rate limits | https://rpc.url?key=abc123 |
| **JWT Secrets** | Session hijacking | JWT_SECRET=... |
| **node_modules/** | Reinstalled from package.json | huge directory |
| **dist/** | Rebuilt from source | production build files |
| **.git/hooks/** | Can steal secrets | custom git hooks |
| **.data/** | Database dumps | local development data |

### TEMPLATE FILES (Placeholders Only) 📝

| File | Purpose | Content |
|---|---|---|
| **.env.example** | Development template | `VITE_API_KEY=your_api_key_here` |
| **.env.preprod.example** | Preprod template | `VITE_API_KEY=your_preprod_key_here` |
| **.env.prod.example** | Production template | `VITE_API_KEY=your_prod_key_here` |

**CRITICAL:** Only placeholder values, NO real credentials!

---

## 🔍 File-by-File Checklist

```bash
# Run these to verify safety:

# 1. Check for .env files
git ls-files | grep '.env'
# ↑ Should only show: .env.example, .env.preprod.example, .env.prod.example

# 2. Check for private keys
git ls-files | xargs grep -l 'PRIVATE_KEY\|private_key'
# ↑ Should return NOTHING

# 3. Check for API keys
git ls-files | xargs grep -l 'API_KEY=\|api_key='
# ↑ Should return NOTHING (except in comments/examples)

# 4. Check for Firebase credentials
git ls-files | grep -i 'firebase.*\.json'
# ↑ Should return NOTHING

# 5. Check for secrets in history
git log --all -S 'PRIVATE_KEY' --source --remotes
# ↑ Should return NOTHING

# All checks pass? Safe to push! ✅
```

---

## 📁 Directory Structure Reference

```
wstaking-public/
│
├── ✅ client/                    # React SPA (SAFE)
│   ├── ✅ components/            # UI components (SAFE)
│   ├── ✅ pages/                 # Route pages (SAFE)
│   ├── ✅ hooks/                 # Custom hooks (SAFE)
│   ├── ✅ contexts/              # React context (SAFE)
│   ├── ✅ abi/                   # Contract ABIs (SAFE)
│   ├── ✅ configs/               # Public configs (SAFE*)
│   ├── ✅ assets/                # Images, fonts (SAFE)
│   ├── ✅ global.css             # Theme (SAFE)
│   └── ✅ App.tsx                # Main component (SAFE)
│
├── ✅ server/                    # Express backend (SAFE*)
│   ├── ✅ routes/                # API endpoints (SAFE*)
│   └── ✅ index.ts               # Server setup (SAFE*)
│
├── ✅ shared/                    # Shared types (SAFE)
│   ├── ✅ api.ts                 # API interfaces (SAFE)
│   └── ✅ types.ts               # Domain types (SAFE)
│
├── ✅ api/                       # API handlers (SAFE*)
│
├── ✅ abi/                       # Contract ABIs (SAFE)
│   └── ✅ *.json                 # Public contract ABIs (SAFE)
│
├── ✅ public/                    # Static assets (SAFE)
│   ├── ✅ images/
│   ├── ✅ fonts/
│   └── ✅ manifest.json
│
├── ✅ docs/                      # Documentation (SAFE)
│   └── ✅ *.md                   # Markdown files (SAFE)
│
├── ✅ smart_contracts/           # Source contracts (SAFE)
│   └── ✅ *.sol                  # Solidity files (SAFE)
│
├── ✅ Configuration Files:
│   ├── ✅ package.json           # Dependencies (SAFE)
│   ├── ✅ pnpm-lock.yaml        # Lock file (SAFE)
│   ├── ✅ tsconfig.json          # TS config (SAFE)
│   ├── ✅ vite.config.ts         # Build config (SAFE)
│   ├── ✅ vite.config.server.ts  # Server build (SAFE)
│   ├── ✅ tailwind.config.ts     # Tailwind config (SAFE)
│   ├── ✅ postcss.config.js      # CSS processing (SAFE)
│   ├── ✅ .prettierrc            # Formatting (SAFE)
│   ├── ✅ tsconfig.json          # Config (SAFE)
│   ├── ✅ vercel.json            # Vercel config (SAFE)
│   └── ✅ netlify.toml           # Netlify config (SAFE)
│
├── ✅ Documentation:
│   ├── ✅ README.md              # Main README (SAFE)
│   ├── ✅ README_RECRUITER.md    # Recruiter version (SAFE)
│   ├── ✅ GETTING_STARTED.md     # Quick start (SAFE)
│   ├── ✅ SETUP_PUBLIC_REPO.md   # Setup guide (SAFE)
│   ├── ✅ SECURITY_GUIDE.md      # Security best practices (SAFE)
│   ├── ✅ PRE_PUSH_CHECKLIST.md  # Verification list (SAFE)
│   ├── ✅ CONTRIBUTING.md        # If adding (SAFE)
│   └── ✅ LICENSE                # License (SAFE)
│
├── 📝 Environment Templates (SAFE but templates only):
│   ├── 📝 .env.example           # Dev template (SAFE)
│   ├── 📝 .env.preprod.example   # Preprod template (SAFE)
│   └── 📝 .env.prod.example      # Prod template (SAFE)
│
└── ✅ .gitignore                 # Security exclusions (SAFE)

Legend:
✅ = Safe to commit
📝 = Template (placeholders only, no real values)
✅* = Safe if no hardcoded secrets

NEVER COMMIT:
❌ .env (any variant)
❌ firebase-admin.json
❌ *.key, *.pem files
❌ node_modules/, dist/
❌ .env.local
❌ Firebase private keys
```

---

## 🚨 What to Do If You Spot Something Unsafe

### If You Haven't Pushed Yet
1. Remove the file: `git rm --cached filename`
2. Add to .gitignore: `echo "filename" >> .gitignore`
3. Commit: `git commit -m "Remove unsafe file"`
4. Proceed with pushing

### If You Already Pushed
1. **Immediately rotate** the compromised credential
2. Use `git-filter-repo` to remove from history
3. Force push: `git push --force-with-lease`
4. Follow steps in SECURITY_GUIDE.md

---

## ✨ Golden Rules

### Rule 1: ENVIRONMENT FILES
- ❌ Never commit `.env` with real values
- ✅ Always commit `.env.example` with placeholders
- ✅ Always add `.env` to .gitignore

### Rule 2: PRIVATE KEYS
- ❌ Never commit private keys, API keys, or secrets
- ✅ Always use environment variables
- ✅ Always inject at runtime

### Rule 3: THIRD-PARTY CREDENTIALS
- ❌ Never hardcode Firebase credentials, AWS keys, etc.
- ✅ Always use GitHub Secrets for CI/CD
- ✅ Always use environment variables in code

### Rule 4: SOURCE CODE
- ✅ Always commit high-quality, clean source code
- ✅ Always include documentation
- ✅ Always use TypeScript/proper types

### Rule 5: BUILD ARTIFACTS
- ❌ Never commit `node_modules/`, `dist/`, `.next/`
- ✅ Always add to .gitignore
- ✅ Always let recipients build themselves

---

## 📋 One-Minute Safety Check

```bash
#!/bin/bash
# Run before pushing to public repo

echo "🔐 Checking repository safety..."

# Check 1: .env files
if git ls-files | grep -q "\.env[^.]"; then
  echo "❌ ERROR: .env files found"
  exit 1
fi

# Check 2: Private keys
if git ls-files | xargs grep -l "PRIVATE_KEY\|private_key" 2>/dev/null; then
  echo "❌ ERROR: Private keys found"
  exit 1
fi

# Check 3: Firebase credentials
if git ls-files | grep -q "firebase-admin\|serviceAccount"; then
  echo "❌ ERROR: Firebase credentials found"
  exit 1
fi

# Check 4: API keys
if git ls-files | xargs grep -E "api_key\s*=\s*['\"][a-zA-Z0-9]" 2>/dev/null; then
  echo "❌ ERROR: API keys found"
  exit 1
fi

echo "✅ All safety checks passed!"
echo "Safe to push to public repository 🚀"
```

Save as `check-safety.sh` and run: `bash check-safety.sh`

---

## 🎓 When in Doubt

**If you're unsure whether something is safe to commit, ask:**

1. **Would this expose sensitive data?** → NO
2. **Would this let someone access my systems?** → NO
3. **Is this code I'm proud to show?** → YES
4. **Is this something anyone can find in the blockchain?** → Maybe OK

If the answer is uncertain, **don't commit it** and store it securely instead.

---

**Last Updated:** April 2026  
**Review Frequency:** Before every push  
**Confidence Level:** 🛡️ High Security
