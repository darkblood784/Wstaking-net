# Security & Deployment Guide for Public Repository

## 🔒 Why This Matters

Your private repository contains sensitive credentials that would compromise your production systems if exposed. This guide helps you safely share the codebase with recruiters, contributors, and the community without exposing secrets.

**Real-world impact of exposed credentials:**
- AWS keys → $6,000+ cloud bill in 15 minutes
- Firebase credentials → Complete database access
- Admin secrets → Full platform compromise
- RPC endpoints with API keys → Rate limit attacks
- Email credentials → Spam/phishing campaigns

## ✅ What's Safe to Commit (Public-Ready)

### Source Code
- ✅ All `.ts`, `.tsx`, `.js`, `.jsx` files (client, server, shared, api)
- ✅ Type definitions and interfaces
- ✅ Component code and business logic
- ✅ Helper functions and utilities

### Configuration Files
- ✅ `.tsconfig.json` - TypeScript configuration
- ✅ `vite.config.ts` - Build configuration
- ✅ `vite.config.server.ts` - Server build config
- ✅ `tailwind.config.ts` - Styling configuration
- ✅ `postcss.config.js` - CSS processing
- ✅ `components.json` - Component registry
- ✅ `.prettierrc` - Code formatting
- ✅ `.editorconfig` - Editor settings
- ✅ `package.json` - Dependencies (values are public)
- ✅ `pnpm-lock.yaml` - Dependency lock file

### Smart Contracts & ABIs
- ✅ `abi/` directory - Contract ABIs are public data
- ✅ `*.sol` files - Smart contract source code
- ✅ Contract addresses - Public information from blockchain
- ✅ `firestore.rules` - Can be reviewed for security (no secrets)
- ✅ `firestore.indexes.json` - Database indexing (public metadata)

### Deployment Configs
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `netlify.toml` - Netlify deployment configuration
- ✅ `.dockerignore` - Docker build exclusions
- ✅ Dockerfile patterns - Shows deployment strategy

### Documentation
- ✅ `README.md` - General project information
- ✅ `README_RECRUITER.md` - Your polished recruiter version
- ✅ `SETUP_PUBLIC_REPO.md` - Setup instructions
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `LICENSE` - Open source license

### Template Files
- ✅ `.env.example` - Environment variable TEMPLATE
- ✅ `.env.preprod.example` - Preprod TEMPLATE
- ✅ `.env.prod.example` - Production TEMPLATE
- ✅ These ONLY contain placeholder values, not real credentials

### Public Assets
- ✅ `public/` directory - Static assets, images, fonts
- ✅ `docs/` directory - Documentation files

## ❌ What to NEVER Commit (Private Repo Only)

### Environment Files with Real Values
- ❌ `.env` - Contains real credentials
- ❌ `.env.local` - Local development with real keys
- ❌ `.env.preprod` - Preprod credentials
- ❌ `.env.prod` - Production credentials
- ❌ `.env.staging` - Staging credentials
- ❌ Any `.env.*` file with actual values

### Credentials & Keys
- ❌ Firebase service account JSON (contains private key)
- ❌ AWS credentials or config
- ❌ Private blockchain keys
- ❌ Admin authentication secrets
- ❌ API keys (Etherscan, CoinGecko, etc.)
- ❌ RPC endpoints with API keys embedded
- ❌ Email server passwords
- ❌ SMTP credentials
- ❌ Wallet private keys
- ❌ Database passwords

### Generated Files
- ❌ `node_modules/` - Reinstalled from package.json
- ❌ `dist/` - Rebuilt from source
- ❌ Build artifacts and outputs
- ❌ `.next/` - Next.js build output
- ❌ `.cache/` - Temporary cache files

### Sensitive Directories
- ❌ `.data/` - Local data or database dumps
- ❌ `.aws/` - AWS credentials directory
- ❌ `.ssh/` - SSH keys

### Sensitive Files
- ❌ `*-firebase-adminsdk-*.json` - Firebase admin credentials
- ❌ `credentials.json` - Service credentials
- ❌ `*.key` - Private key files
- ❌ `*.pem` - Encryption key files
- ❌ `*.keystore` - Wallet keystores

## 🚀 Step-by-Step: Create Safe Public Repo

### Step 1: Verify Your .gitignore

Ensure `.gitignore` includes:
```bash
.env
.env.local
.env.*.local
.env.preprod
.env.prod
node_modules/
dist/
```

Check current tracked files:
```bash
# See all files tracked by git
git ls-files

# Search for secrets in tracked files
git ls-files | xargs grep -l "PRIVATE_KEY\|SECRET\|API_KEY"

# This command should return nothing if properly configured
```

### Step 2: Clean Git History (if needed)

If you accidentally committed secrets previously:

```bash
# Option A: Using git-filter-repo (recommended)
pip install git-filter-repo

# Remove .env files from entire history
git filter-repo --invert-paths --path .env --path .env.preprod --path .env.prod

# Force push (careful - affects all clones)
git push --force-with-lease


# Option B: Using BFG Repo-Cleaner (faster for large repos)
bfg --delete-files .env --no-blob-protection

# Option C: Rotate all compromised credentials immediately
# Even if removed from history, assume they're compromised
```

### Step 3: Create Environment Templates

Already provided:
- `.env.example` - Development template
- `.env.preprod.example` - Pre-production template
- `.env.prod.example` - Production template

These contain ONLY placeholder values and descriptions.

### Step 4: Final Security Audit

Before pushing publicly:

```bash
# Search for common patterns
grep -r "PRIVATE_KEY\|sk_live_\|sk_test_" --include="*.js" --include="*.ts" --include="*.json" .
# Should return ZERO results (except in .example files)

# Check for Firebase SDK credentials
grep -r "firebase-admin\|serviceAccount\|private_key" . --include="*.json" --include="*.js"
# Should only appear in marked template files

# Verify no .env files will be pushed
git status | grep .env
# Should show nothing

# List files that will be committed
git diff --cached --name-only
# Verify no sensitive files are listed

# Commit and push to public repo (only after audit passes)
git push origin main
```

## 🔐 Production Deployments with GitHub Secrets

### For GitHub Actions CI/CD

1. **Add Secrets to GitHub**
   ```
   Repository Settings → Secrets and Variables → Actions → New Repository Secret
   ```

2. **Create GitHub Actions Workflow**
   ```yaml
   name: Deploy to Production

   on:
     push:
       branches:
         - main

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Install dependencies
           run: pnpm install

         - name: Build
           env:
             FIREBASE_SERVICE_ACCOUNT_JSON: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}
             ADMIN_AUTH_SECRET: ${{ secrets.ADMIN_AUTH_SECRET }}
             ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
           run: pnpm build

         - name: Deploy to Vercel
           uses: vercel/action@v4
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
   ```

### For Vercel Deployment

1. Go to **Project Settings → Environment Variables**
2. Add each variable for Production environment
3. Variables will be injected at build time and runtime

### For Self-Hosted Deployment

```bash
# On server, create .env with real values (not in Git!)
ssh user@server.com
cd /app/wstaking
nano .env  # Fill with actual credentials
chmod 600 .env  # Restrict permissions

# Restart application
systemctl restart wstaking
```

## 🛡️ Security Best Practices

### Credential Rotation
- [ ] Rotate Firebase service account keys quarterly
- [ ] Rotate admin authentication secrets bi-annually
- [ ] Rotate API keys if ever exposed
- [ ] Rotate SMTP password when personnel changes
- [ ] Use temporary credentials for developer access

### Access Control
- [ ] Limit who has access to production .env files
- [ ] Use principle of least privilege - only grant needed permissions
- [ ] Use SSH keys instead of passwords for server access
- [ ] Enable MFA (Multi-Factor Authentication) on all accounts
- [ ] Audit who accessed production credentials (logs)

### Monitoring & Alerts
- [ ] Enable AWS CloudTrail for AWS resource access
- [ ] Monitor Firebase Admin SDK access through Cloud Audit Logs
- [ ] Set up alerts for failed authentication attempts
- [ ] Monitor for unusual API key usage patterns
- [ ] Enable GitHub's secret scanning alerts

### Git Hygiene
- [ ] Enable branch protection - require PR reviews
- [ ] Require status checks to pass before merging
- [ ] Use commit signing (GPG keys) for production deployments
- [ ] Audit git commit history regularly
- [ ] Archive old branches safely

### Development Machine Security
- [ ] Use password manager (1Password, LastPass) for credentials
- [ ] Never commit `.env` to version control
- [ ] Use `.env.local` for machine-specific overrides (gitignored)
- [ ] Keep local .env files restricted (chmod 600)
- [ ] Use hardware security keys for accounts with secrets access

## 📋 Secret Types & Safe Handling

| Secret Type | Safe to Commit | How to Manage |
|---|---|---|
| **Firebase Service Account** | ❌ NO | GitHub Secrets |
| **Firebase Web Config** | ✅ YES | Can be public |
| **API Keys (Etherscan, etc)** | ❌ NO | GitHub Secrets |
| **Admin Auth Secret** | ❌ NO | GitHub Secrets |
| **RPC Endpoint URL** | ✓ Maybe | If no API key embedded |
| **Smart Contract ABI** | ✅ YES | Public blockchain data |
| **Contract Address** | ✅ YES | Public blockchain data |
| **Email Password** | ❌ NO | Vault/Secrets Manager |
| **SMTP Credentials** | ❌ NO | Vault/Secrets Manager |
| **Database Password** | ❌ NO | Vault/Secrets Manager |

## 🚨 If You Accidentally Expose Credentials

1. **Immediately rotate** the compromised credential
   - Generate new Firebase service account
   - Create new admin secret
   - Reset API keys

2. **Remove from history** using git-filter-repo

3. **Force push** (only if private repo is small)
   ```bash
   git filter-repo --invert-paths --path .env
   git push --force-with-lease
   ```

4. **Notify team** - anyone who cloned before cleanup has the old credentials

5. **Search external sources** - check if password was used elsewhere

6. **Monitor** - watch for unauthorized usage of the exposed credential

## ✨ Example: Secure Deployment Flow

```
Local Development:
  ↓
  .env (with real credentials) - NEVER COMMITTED
  ↓
Create PR with feature code
  ↓
GitHub Actions CI sees:
  - .env not in repo ✓
  - Uses GitHub Secrets instead ✓
  - Builds and tests ✓
  ↓
Code Review & Approval
  ↓
Merge to main
  ↓
Deploy Job runs with:
  - Real credentials from GitHub Secrets ✓
  - Builds production artifacts
  - Deploys to Vercel/Server ✓
  ↓
Production Running Safely ✓
```

## 📚 Additional Resources

- [GitHub: Removing sensitive data from history](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App: Store config in environment](https://12factor.net/config)
- [Git-Filter-Repo Documentation](https://github.com/newren/git-filter-repo)
- [GitHub: Managing secrets for your organization](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-secrets-for-your-codespaces)

---

**Remember:** Security is not a feature, it's a requirement. When in doubt, treat something as sensitive. It's better to over-protect than under-protect.

**Last Updated:** April 2026
