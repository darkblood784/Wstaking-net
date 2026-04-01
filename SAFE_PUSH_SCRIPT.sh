#!/bin/bash

# ============================================
# SAFE PUBLIC PUSH SCRIPT
# ============================================
# This script safely pushes ONLY public files
# to your GitHub repository without exposing secrets

# Configuration
PUBLIC_REPO_URL="https://github.com/darkblood784/Wstaking-net.git"
PRIVATE_REPO_PATH="D:\staking page zip file\Wstaking_New_UI\Wstaking_New_UI"
PUBLIC_REPO_PATH="./wstaking-net-public"

echo "🔒 Starting safe public repository push..."
echo "=========================================="

# Step 1: Create a clean public directory
echo ""
echo "Step 1: Creating clean public repository directory..."
if [ -d "$PUBLIC_REPO_PATH" ]; then
  echo "  ⚠️  Directory exists. Removing old version..."
  rm -rf "$PUBLIC_REPO_PATH"
fi
mkdir -p "$PUBLIC_REPO_PATH"
cd "$PUBLIC_REPO_PATH"

# Step 2: Initialize git
echo ""
echo "Step 2: Initializing git repository..."
git init
git config user.email "you@example.com"
git config user.name "Your Name"
git remote add origin "$PUBLIC_REPO_URL"

# Step 3: Create .gitignore FIRST
echo ""
echo "Step 3: Setting up security (.gitignore)..."
cat > .gitignore << 'EOF'
# Environment variables - CRITICAL
.env
.env.local
.env.*.local
.env.preprod
.env.prod
.env.staging
.env.test
.env.backup
.env.*.backup
.env*.bak

# Credentials & Private Keys
*.pem
*.key
*.crt
*.cert
id_rsa
id_rsa.pub
known_hosts
firebase-admin.json
firebase-service-account.json
*-firebase-adminsdk-*.json
firebaseConfig.js
firebaseKey.json
credentials.json
secrets.json
private_key
private_keys.json
*.wallet
*.keystore
wallet.json
keystore*.json

# Build & Distribution
dist/
build/
.next/
out/
node_modules/
pnpm-store/

# IDE & Editor
.vscode/
.idea/
*.code-workspace
*.swp
*.swo
*~

# OS Files
.DS_Store
Thumbs.db
.directory

# Temporary & Logs
logs/
tmp/
temp/
.tmp/
.cache/
*.log

# Database & Data
.data/
*.db
*.sqlite
*.sqlite3

# Testing
coverage/
.nyc_output/

# Old versions
_old-staking-frontend/
staking-frontend-main.zip

# Audit & Backup
.audit_docx_unpacked/
.audit_report.zip
local_backup_*
*.patch.bak
EOF

echo "  ✅ .gitignore created"

# Step 4: Copy safe source files
echo ""
echo "Step 4: Copying safe source files..."

# Create directory structure
mkdir -p client server shared api abi public docs

# Copy essential files - modify paths as needed
echo "  Copying client files..."
cp -r "../Wstaking_New_UI/client" . 2>/dev/null || echo "    ⚠️  Check path"

echo "  Copying server files..."
cp -r "../Wstaking_New_UI/server" . 2>/dev/null || echo "    ⚠️  Check path"

echo "  Copying shared types..."
cp -r "../Wstaking_New_UI/shared" . 2>/dev/null || echo "    ⚠️  Check path"

echo "  Copying API handlers..."
cp -r "../Wstaking_New_UI/api" . 2>/dev/null || echo "    ⚠️  Check path"

echo "  Copying smart contract ABIs..."
cp -r "../Wstaking_New_UI/abi" . 2>/dev/null || echo "    ⚠️  Check path"

echo "  Copying public assets..."
cp -r "../Wstaking_New_UI/public" . 2>/dev/null || echo "    ⚠️  Check path"

echo "  Copying documentation..."
cp -r "../Wstaking_New_UI/docs" . 2>/dev/null || echo "    ⚠️  Check path"

# Step 5: Copy configuration files (safe ones)
echo ""
echo "Step 5: Copying configuration files..."

cp "../Wstaking_New_UI/package.json" . 2>/dev/null && echo "  ✅ package.json"
cp "../Wstaking_New_UI/pnpm-lock.yaml" . 2>/dev/null && echo "  ✅ pnpm-lock.yaml"
cp "../Wstaking_New_UI/tsconfig.json" . 2>/dev/null && echo "  ✅ tsconfig.json"
cp "../Wstaking_New_UI/vite.config.ts" . 2>/dev/null && echo "  ✅ vite.config.ts"
cp "../Wstaking_New_UI/vite.config.server.ts" . 2>/dev/null && echo "  ✅ vite.config.server.ts"
cp "../Wstaking_New_UI/tailwind.config.ts" . 2>/dev/null && echo "  ✅ tailwind.config.ts"
cp "../Wstaking_New_UI/postcss.config.js" . 2>/dev/null && echo "  ✅ postcss.config.js"
cp "../Wstaking_New_UI/vercel.json" . 2>/dev/null && echo "  ✅ vercel.json"
cp "../Wstaking_New_UI/netlify.toml" . 2>/dev/null && echo "  ✅ netlify.toml"
cp "../Wstaking_New_UI/.prettierrc" . 2>/dev/null && echo "  ✅ .prettierrc"
cp "../Wstaking_New_UI/components.json" . 2>/dev/null && echo "  ✅ components.json"

# Step 6: Copy smart contracts
echo ""
echo "Step 6: Copying smart contracts..."
cp "../Wstaking_New_UI"/*.sol . 2>/dev/null && echo "  ✅ Smart contracts copied"
cp "../Wstaking_New_UI"/*.abi.json . 2>/dev/null && echo "  ✅ Contract ABIs copied"

# Step 7: Copy documentation & templates
echo ""
echo "Step 7: Copying documentation and templates..."

# Main README
cat > README.md << 'FROM_ORIGINAL'
# WStaking — Multi-Chain Crypto Staking Platform

See README_RECRUITER.md for detailed information.

To set up locally:
1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm dev`

More info: See SETUP.md
FROM_ORIGINAL
echo "  ✅ README.md created"

# Copy environment templates
cp "../Wstaking_New_UI/wstaking-public/.env.example" . 2>/dev/null && echo "  ✅ .env.example"
cp "../Wstaking_New_UI/wstaking-public/.env.preprod.example" . 2>/dev/null && echo "  ✅ .env.preprod.example"
cp "../Wstaking_New_UI/wstaking-public/.env.prod.example" . 2>/dev/null && echo "  ✅ .env.prod.example"

# Copy documentation
cp "../Wstaking_New_UI/README_RECRUITER.md" . 2>/dev/null && echo "  ✅ README_RECRUITER.md"
cp "../Wstaking_New_UI/wstaking-public/SECURITY_GUIDE.md" . 2>/dev/null && echo "  ✅ SECURITY_GUIDE.md"
cp "../Wstaking_New_UI/wstaking-public/SETUP_PUBLIC_REPO.md" . 2>/dev/null && echo "  ✅ SETUP_PUBLIC_REPO.md"

# Step 8: Security verification
echo ""
echo "Step 8: 🔐 Verifying no secrets are included..."
echo ""

# Check for .env files
ENV_CHECK=$(find . -name '.env*' -not -name '.env.*.example' 2>/dev/null | wc -l)
if [ "$ENV_CHECK" -gt 0 ]; then
  echo "  ❌ ERROR: Found .env files with potential secrets!"
  find . -name '.env*' -not -name '.env.*.example'
  exit 1
fi
echo "  ✅ No .env files with secrets"

# Check for private keys
if grep -r "PRIVATE_KEY\|private_key\|-----BEGIN" --include="*.ts" --include="*.js" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v ".example" | head -3; then
  echo "  ⚠️  Review code above for hardcoded secrets"
else
  echo "  ✅ No private keys found"
fi

# Check for Firebase credentials
if grep -r "firebase-adminsdk\|serviceAccount" --include="*.json" --include="*.ts" . 2>/dev/null | grep -v ".example" | head -3; then
  echo "  ⚠️  Review code above for Firebase credentials"
else
  echo "  ✅ No Firebase credentials found"
fi

# Check node_modules
if [ -d "node_modules" ]; then
  echo "  ❌ ERROR: node_modules directory found!"
  echo "    Remove with: rm -rf node_modules"
  exit 1
fi
echo "  ✅ No node_modules directory"

echo ""
echo "=========================================="
echo "🎉 Security verification complete!"
echo ""

# Step 9: Prepare for push
echo "Step 9: Preparing for GitHub push..."
git add .
git status

echo ""
echo "=========================================="
echo "✅ READY TO PUSH!"
echo ""
echo "Next steps:"
echo "1. Review the files above"
echo "2. Run: git commit -m 'Initial commit: WStaking public repository'"
echo "3. Run: git push -u origin main"
echo ""
echo "⚠️  If push fails, you may need to:"
echo "   git branch -M main  (rename branch to main)"
echo "   git push -u origin main"
echo ""
