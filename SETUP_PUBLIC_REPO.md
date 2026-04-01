# Setting Up WStaking Public Repository

This guide helps you safely share the WStaking codebase publicly while protecting sensitive credentials.

## ✅ What's Safe to Commit

- ✅ All source code (`client/`, `server/`, `shared/`, `api/`)
- ✅ Smart contract ABIs (`abi/`, `*.abi.json`)
- ✅ Configuration files (`vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`)
- ✅ Documentation (`.md` files)
- ✅ Public Firebase config (client-side, can be reverse-engineered anyway)
- ✅ Deployment configs (`vercel.json`, `netlify.toml`, `vite.config.server.ts`)

## ❌ What to NEVER Commit

- ❌ `.env` files with real credentials
- ❌ Firebase service account JSON (private keys)
- ❌ Admin authentication secrets
- ❌ API keys (Etherscan, Infura, Alchemy, etc.)
- ❌ Database credentials
- ❌ RPC endpoint URLs with API keys
- ❌ Wallet private keys
- ❌ `node_modules/` directory
- ❌ `dist/` build output
- ❌ `.data/` directory
- ❌ `.env*` files (all variations)

## 📁 Public Repository Structure

```
wstaking-public/
├── client/                    # ✅ Safe - source code only
├── server/                    # ✅ Safe - source code only
├── shared/                    # ✅ Safe - type definitions
├── api/                       # ✅ Safe - API handlers
├── abi/                       # ✅ Safe - contract ABIs (public)
├── public/                    # ✅ Safe - static assets
├── docs/                      # ✅ Safe - documentation
│
├── .env.example               # ✅ SAFE - Template with placeholders
├── .env.preprod.example       # ✅ SAFE - Template for preprod
├── .env.prod.example          # ✅ SAFE - Template for production
│
├── .gitignore                 # ✅ Essential - Exclude secrets
├── package.json               # ✅ Safe - dependencies list
├── pnpm-lock.yaml            # ✅ Safe - lock file
├── tsconfig.json              # ✅ Safe - TypeScript config
├── vite.config.ts             # ✅ Safe - build config
├── vite.config.server.ts      # ✅ Safe - server build config
├── tailwind.config.ts         # ✅ Safe - styling config
├── postcss.config.js          # ✅ Safe - CSS processing
├── netlify.toml               # ✅ Safe - netlify deployment config
├── vercel.json                # ✅ Safe - vercel deployment config
├── components.json            # ✅ Safe - shadcn components
├── firestore.rules            # ⚠️  Review - may expose DB structure
├── firestore.indexes.json     # ⚠️  Review - may expose DB structure
│
├── README.md                  # ✅ Safe - general info
├── README_RECRUITER.md        # ✅ Safe - recruiter-focused version
├── .git/                      # ✅ Safe - git history (configure filters)
└── SETUP.md                   # ✅ New - local development setup
```

## 📋 Step-by-Step: Creating Safe Public Repo

### 1. Create New Public Repository on GitHub

```bash
# Create new empty repo named 'wstaking' or 'wstaking-public'
# Do NOT initialize with README (we'll push our own)
```

### 2. Copy Safe Files to Public Folder

Already done! This folder contains:
- All source code
- Configuration files
- Documentation
- Template `.env` files

### 3. Verify `.gitignore` is Comprehensive

The `.gitignore` file should include:

```
# Environment variables - CRITICAL
.env
.env.local
.env.*.local
.env.preprod
.env.prod

# Secrets and credentials
*.key
*.pem
*.crt
firebase-admin.json
credentials.json

# Build outputs
dist/
build/
.next/

# Dependencies
node_modules/
.pnpm-store/

# IDE
.vscode/
.idea/
*.swp
*.swo

# System
.DS_Store
Thumbs.db

# Database and data
.data/
*.db
*.sqlite3

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# OS
.env.local.bak
```

### 4. Create `.env` Templates

For each deployment environment, create a template file:

**`.env.example`** (Development template)
```env
# ============================================
# FRONTEND CONFIG
# ============================================

# Get from https://wagmi.sh/react/config
VITE_WALLET_CONNECT_ID=your_wallet_connect_project_id

# Firebase Web Config (can be public, but change values)
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# Blockchain RPC URLs (get free from Infura, Alchemy, or QuickNode)
VITE_BASE_RPC=https://mainnet.base.org
VITE_BSC_RPC=https://bsc-dataseed.binance.org
VITE_XLAYER_RPC=https://rpc.xlayer.tech

# ============================================
# BACKEND CONFIG (Server-side only)
# ============================================

# Express server
PORT=3000
NODE_ENV=development

# Firebase Admin SDK (KEEP PRIVATE - never commit actual JSON)
FIREBASE_SERVICE_ACCOUNT_JSON={}

# Admin authentication
ADMIN_AUTH_SECRET=your_long_random_secret_here

# Staking contract addresses by chain
BASE_MAINNET_STAKING_ADDRESS=0x...
BASE_SEPOLIA_STAKING_ADDRESS=0x...
BSC_MAINNET_STAKING_ADDRESS=0x...
BSC_TESTNET_STAKING_ADDRESS=0x...
XLAYER_MAINNET_STAKING_ADDRESS=0x...

# Private signer for backend operations (if needed)
# BACKEND_SIGNER_PRIVATE_KEY=leave_empty_in_public_repos

# Email configuration
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@wstaking.net

# Third-party APIs
ETHERSCAN_API_KEY=your_etherscan_api_key
COINGECKO_API_KEY=your_coingecko_api_key

# CORS & Security
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**`.env.preprod.example`** (Pre-production template)
```env
# Pre-production environment template
# Ensure all values are set before deployment

VITE_WALLET_CONNECT_ID=your_wallet_connect_project_id
VITE_FIREBASE_API_KEY=YOUR_PREPROD_FIREBASE_API_KEY
VITE_BASE_RPC=https://sepolia.base.org
VITE_BSC_RPC=https://data-seed-prebsc-1-1.bnbchain.org:8545
VITE_XLAYER_RPC=https://testrpc.xlayer.tech

NODE_ENV=production
PORT=3000

# Firebase Admin - populate with actual JSON
FIREBASE_SERVICE_ACCOUNT_JSON={}

# Contracts on testnet
BASE_SEPOLIA_STAKING_ADDRESS=0x...
BSC_TESTNET_STAKING_ADDRESS=0x...

# Admin secret for preprod
ADMIN_AUTH_SECRET=your_preprod_secret

# Email & APIs
SMTP_HOST=smtp.office365.com
SMTP_USER=preprod-email@example.com

CORS_ALLOWED_ORIGINS=https://preprod.wstaking.net
```

**`.env.prod.example`** (Production template)
```env
# Production environment template
# CRITICAL: Use secrets vault (GitHub Secrets, AWS Secrets Manager, etc.)

VITE_WALLET_CONNECT_ID=your_wallet_connect_project_id
VITE_FIREBASE_API_KEY=YOUR_PROD_FIREBASE_API_KEY
VITE_BASE_RPC=https://mainnet.base.org
VITE_BSC_RPC=https://bsc-dataseed.binance.org
VITE_XLAYER_RPC=https://rpc.xlayer.tech

NODE_ENV=production
PORT=3000

# Firebase Admin - use hosted secrets
FIREBASE_SERVICE_ACCOUNT_JSON={}

# Mainnet contracts
BASE_MAINNET_STAKING_ADDRESS=0x...
BSC_MAINNET_STAKING_ADDRESS=0x...
XLAYER_MAINNET_STAKING_ADDRESS=0x...

# Production auth secret
ADMIN_AUTH_SECRET=generate_new_strong_secret

# Email & APIs
SMTP_HOST=smtp.office365.com
SMTP_USER=prod-email@example.com

CORS_ALLOWED_ORIGINS=https://wstaking.net,https://www.wstaking.net
```

### 5. Update `.gitignore`

Create a comprehensive `.gitignore`:

```bash
# Save as .gitignore in repo root
```

See section above for full `.gitignore` content.

### 6. Create Local Setup Guide

Create a `SETUP.md` or `CONTRIBUTING.md` for developers:

```markdown
# Local Development Setup

## Prerequisites
- Node.js 18+
- PNPM (recommended) or npm
- Git

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/wstaking.git
cd wstaking
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
# Copy template for your environment
cp .env.example .env
# Edit .env with your actual values
nano .env
\`\`\`

4. Start development server:
\`\`\`bash
pnpm dev
\`\`\`

Server runs at `http://localhost:8080`

## Required Environment Variables

See `.env.example` for complete list. At minimum, you need:
- Wallet Connect Project ID
- Firebase credentials
- RPC endpoints (Infura, Alchemy, or QuickNode)

## Deployment

See deployment guides:
- Frontend: `vercel.json` (Vercel setup)
- Backend: Instructions in `server/README.md`
- Database: Firebase Console setup
```

## 🔒 Security Checklist Before Pushing

When you're ready to push:

**Code Review**
- [ ] Search for hardcoded API keys: `grep -r "sk_" .` (Stripe keys format)
- [ ] Search for private keys: `grep -r "PRIVATE_KEY" .`
- [ ] Search for secrets: `grep -r "secret" . | grep -v node_modules`
- [ ] Verify no `.env` files are staged: `git status | grep .env`
- [ ] Check git history: `git log --all --full-history -- .env`

**File Exclusions**
- [ ] `node_modules/` is in `.gitignore`
- [ ] `dist/` is in `.gitignore`
- [ ] `.env*` files are in `.gitignore`
- [ ] `*.key` and `*.pem` files are in `.gitignore`
- [ ] `.data/` directory is in `.gitignore`

**Final Check**
- [ ] Run `git status` - shows only files you intend to commit
- [ ] Run `git ls-files` - verify no secrets in tracked files
- [ ] No Firebase service account JSON visible
- [ ] No RPC URLs with API keys
- [ ] No email credentials

## 📝 Git History Cleanup (Optional)

If you accidentally committed secrets before, clean git history:

```bash
# Use git-filter-repo (recommended)
pip install git-filter-repo

# Remove .env files from history
git filter-repo --invert-paths --path .env --path .env.preprod --path .env.prod

# Force push (be careful!)
git push --force-with-lease
```

## 🚀 GitHub Setup Recommendations

1. **Branch Protection Rules**
   - Require PR reviews before merging
   - Run status checks (CI/CD pipeline)
   - Dismiss stale reviews when new commits pushed

2. **GitHub Secrets for CI/CD**
   ```yaml
   # In GitHub Actions, use:
   FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
   ADMIN_AUTH_SECRET: ${{ secrets.ADMIN_AUTH_SECRET }}
   ```

3. **Code Scanning**
   - Enable GitHub Advanced Security
   - Run tool like `truffleHog` to detect secrets
   - Enable dependency alerts

4. **CODEOWNERS**
   Create `CODEOWNERS` file:
   ```
   # Require review for sensitive paths
   /server/ @owner
   /api/ @owner
   /.env* @owner
   ```

## ❓ Common Questions

**Q: Can I commit the Firebase web config?**
A: Yes, the client-side Firebase config is safe to commit (it's meant to be public). The service account JSON is NOT safe.

**Q: Should I include smart contract ABIs?**
A: Yes, ABIs are public information that anyone can extract from the blockchain.

**Q: What about deployment configs?**
A: Safe to commit. They contain configuration but not credentials (which go in GitHub Secrets).

**Q: Can I share the README_RECRUITER.md publicly?**
A: Absolutely! That's the whole point - it showcases your work to recruiters.

## 📞 Support

If you accidentally commit a secret:
1. Immediately rotate the compromised credential
2. Use `git filter-repo` to remove from history
3. Force push only if repo is small/not widely cloned

---

**Created:** April 2026  
**Last Updated:** April 2026
