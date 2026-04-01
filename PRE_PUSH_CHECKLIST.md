# 🚀 Pre-Launch Checklist for Public Repository

Use this checklist before pushing your code to a public GitHub repository. This ensures no sensitive credentials are exposed.

## 📋 Before You Push to Public Repo

### 1. Code Verification
- [ ] All source code reviewed for hardcoded secrets
- [ ] No `.env` files in git tracking: `git ls-files | grep .env`
- [ ] No private keys visible: `git ls-files | xargs grep -l "PRIVATE_KEY"`
- [ ] No API keys visible: `git ls-files | xargs grep -l "API_KEY\|sk_"`
- [ ] No Firebase credentials: `git ls-files | grep -i firebase`
- [ ] No database passwords in code: `grep -r "password\|PASSWORD" --include="*.ts" --include="*.js" . | grep -v node_modules`

### 2. Environment Files
- [ ] `.env` is in `.gitignore` (local development secrets)
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.preprod` is in `.gitignore`
- [ ] `.env.prod` is in `.gitignore`
- [ ] `.env.example` exists with placeholder values
- [ ] `.env.preprod.example` exists with placeholder values
- [ ] `.env.prod.example` exists with placeholder values

### 3. Credentials & Keys
- [ ] No Firebase service account JSON files in repo
- [ ] No AWS credentials files (`.aws/` directory excluded)
- [ ] No SSH/private keys (`*.pem`, `*.key`, `id_rsa`)
- [ ] No wallet keystores or private keys
- [ ] No SMTP passwords in code
- [ ] No hardcoded admin secrets

### 4. Generated & Temporary Files
- [ ] `node_modules/` in `.gitignore`
- [ ] `dist/` in `.gitignore`
- [ ] `build/` in `.gitignore`
- [ ] `.data/` in `.gitignore`
- [ ] `logs/` in `.gitignore`
- [ ] `.cache/` in `.gitignore`
- [ ] `tmp/` in `.gitignore`

### 5. Sensitive Directories
- [ ] `_old-staking-frontend/` is in `.gitignore` or removed (archived)
- [ ] `.audit_docx_unpacked/` excluded
- [ ] `.audit_report.zip` excluded
- [ ] `.builder/` excluded
- [ ] Any backup files excluded

### 6. Git History Check
```bash
# Run these commands to verify:

# Check all tracked files
git ls-files

# Search entire history for secrets
git log -p --all -S 'PRIVATE_KEY' | head -50  # Should return nothing
git log -p --all -S 'SECRET' | head -50       # Should return nothing

# Count env commits
git log --all --name-only | grep '.env' | wc -l  # Should be 0

# See what will be committed
git status
```

### 7. Pre-Push Verification
```bash
# Final check before push
git diff --cached --name-only | grep '.env'  # Should return nothing
git diff --cached --name-only | grep '*.key' # Should return nothing
git diff --cached --name-only | grep 'credentials' # Should return nothing
```

### 8. Remote Repository Setup
- [ ] New public GitHub repository created (empty)
- [ ] No existing commits that should be hidden
- [ ] Repository is PUBLIC (after initial push, can request to display)
- [ ] Branch protection rules configured (optional but recommended)
- [ ] README.md is comprehensive and professional

### 9. Documentation
- [ ] `README.md` explains the project clearly
- [ ] `README_RECRUITER.md` highlights key achievements
- [ ] `SETUP_PUBLIC_REPO.md` provides setup instructions
- [ ] `SECURITY_GUIDE.md` explains secret management  
- [ ] `CONTRIBUTING.md` or guidelines provided (if accepting contributions)
- [ ] `LICENSE` file present (MIT, Apache 2.0, etc.)

### 10. Configuration Files
- [ ] `package.json` - all dependencies are public
- [ ] `pnpm-lock.yaml` or `package-lock.json` - lock files present
- [ ] `tsconfig.json` - TypeScript configuration safe
- [ ] `vite.config.ts` - build config doesn't expose secrets
- [ ] `tailwind.config.ts` - styling config present
- [ ] `.prettierrc` - code format config
- [ ] `.gitignore` - comprehensive exclusions
- [ ] `vercel.json` - deployment config (no credentials)
- [ ] `netlify.toml` - deployment config (no credentials)

### 11. Sensitive Comments Removed
- [ ] No TODO comments pointing to private files
- [ ] No debugging logs with sensitive info
- [ ] No comments with example credentials
- [ ] No comments referencing production endpoints with keys
- [ ] No deployment notes with actual credentials

### 12. Smart Contracts & ABIs
- [ ] Contract ABIs in `abi/` directory are public (safe to share)
- [ ] Smart contract `.sol` files present
- [ ] ABI JSON files present
- [ ] Contract addresses documented (public info)
- [ ] No compiled bytecode with private data

### 13. Firestore Configuration
- [ ] `firestore.rules` reviewed - doesn't expose secrets
- [ ] `firestore.indexes.json` safe to share (metadata only)
- [ ] No embedded API keys in rules
- [ ] Security rules properly restrict access

### 14. Public Assets
- [ ] `public/` directory contains only public assets
- [ ] No auth tokens in public files
- [ ] No API keys in JavaScript files accessed by browser
- [ ] Images, fonts, and static files are appropriate

### 15. Client-Side Code Review
- [ ] No sensitive API calls hardcoded with keys
- [ ] All API keys use environment variables (VITE_*)
- [ ] Firebase config is public (client-side only)
- [ ] Wallet connect project ID is public (by design)
- [ ] No localStorage storing sensitive credentials

### 16. Server-Side Code Review
- [ ] All secrets accessed from environment variables
- [ ] No hardcoded IP addresses of private servers (if possible)
- [ ] No database connection strings in code
- [ ] Private key handling is documented
- [ ] Admin routes require proper authentication

### 17. Deployment Configs
- [ ] `vercel.json` - environment variables set in Vercel UI, not here
- [ ] `netlify.toml` - environment variables documented as separate
- [ ] `.dockerignore` - excludes secrets if Docker images built
- [ ] No deployment scripts with embedded credentials

## 🔑 Critical Security Questions

Answer YES to all of these:

- [ ] Are all real credentials stored in GitHub Secrets, not in code?
- [ ] Are all `.env` files with real values excluded from git?
- [ ] Is Firebase service account JSON securely stored outside repo?
- [ ] Would I be comfortable if a stranger downloaded this repo?
- [ ] Are all API keys injected at runtime, not in source code?
- [ ] Would exposing the code hurt the business/security?
- [ ] Have I rotated any credentials that might have been exposed?

## 📝 Commit Message Before Push

```bash
git log --oneline | head -5  # Review last 5 commits

# Make sure commit messages don't reveal sensitive info
# e.g., "Add Firebase credentials" is bad
# "Set up Firebase authentication" is fine
```

## 🚀 Final Steps

### 1. Create Remote Repository
```bash
# On GitHub:
# - Create new repository named 'wstaking' (or your choice)
# - Do NOT initialize with README (you'll push yours)
# - Set to Public
```

### 2. Push to Public Repo
```bash
# From your working directory
git remote add origin https://github.com/yourusername/wstaking.git
git branch -M main  # Ensure main branch
git push -u origin main
```

### 3. Verify Public Push
```bash
# Visit: https://github.com/yourusername/wstaking
# Verify:
# [ ] Code is visible
# [ ] No .env files present
# [ ] README.md displays properly
# [ ] File structure looks correct
# [ ] No sensitive data in file preview
```

### 4. GitHub Repository Configuration
- [ ] Add description: "Multi-chain DeFi staking platform"
- [ ] Add topics: `web3`, `defi`, `blockchain`, `staking`, `react`, `typescript`
- [ ] Add link to live demo (if public)
- [ ] Enable GitHub Discussions (for community)
- [ ] Add CODEOWNERS file for security-critical paths

### 5. Share with Recruiters
- [ ] Copy repository URL
- [ ] Create short bio pointing to repo
- [ ] Share README_RECRUITER.md separately (via email)
- [ ] Highlight key achievements in cover letter
- [ ] Include architecture diagram from README
- [ ] Reference specific features and tech stack

## ⚠️ If Something Goes Wrong

### Accidentally Pushed Secrets

1. **First**: Assume they're compromised (rotate immediately)
   ```bash
   # Change Firebase service account
   # Change admin secret
   # Change API keys
   # Change SMTP password
   ```

2. **Second**: Remove from history
   ```bash
   # Install git-filter-repo if not present
   pip install git-filter-repo
   
   # Remove sensitive files
   git filter-repo --invert-paths --path .env --path .env.prod
   
   # Force push (after backup of working branch)
   git push --force-with-lease
   ```

3. **Third**: Verify cleanup
   ```bash
   git log --all -p --follow -- .env | head -100  # Should be empty
   ```

4. **Fourth**: Notify team
   - Inform any collaborators of cleanup
   - Ensure they understand they need to re-clone

## 📞 Questions to Ask Yourself

**Before hitting that push button:**

1. ✅ "Would I be concerned if a competitor had this code?" → If NO, push
2. ✅ "Are all my credentials in environment variables?" → If YES, safe
3. ✅ "Can someone use this code to access my production system?" → If NO, safe
4. ✅ "Does .gitignore exclude all .env files?" → If YES, safe
5. ✅ "Have I run the security checks?" → If YES, safe

If you answer NO to any of these, **STOP** and fix before pushing.

---

## ✅ Final Sign-Off

Before pushing, sign off on this:

```
Today's Date: ___________

I certify that:
☐ I have reviewed all code for hardcoded secrets
☐ I have verified .gitignore excludes all .env files
☐ I have verified no credentials in git history
☐ I have updated all documentation
☐ I am comfortable sharing this publicly
☐ All sensitive data is properly protected

Signed: ___________________
```

---

**Ready to push?** 
```bash
git push -u origin main
```

**Not ready?** Review the sections above before pushing.

---

**Last Updated:** April 2026  
**Remember:** It's better to over-check than under-check. Take your time!
