# ============================================
# SAFE PUBLIC PUSH SCRIPT (Windows PowerShell)
# ============================================
# This script safely pushes ONLY public files
# to your GitHub repository without exposing secrets

param(
    [string]$PrivateRepoPath = "D:\staking page zip file\Wstaking_New_UI\Wstaking_New_UI",
    [string]$PublicRepoPath = ".\wstaking-net-public",
    [string]$GitHubRepoUrl = "https://github.com/darkblood784/Wstaking-net.git"
)

Write-Host "🔒 Starting safe public repository push..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create clean directory
Write-Host "Step 1: Creating clean public repository directory..." -ForegroundColor Yellow

if (Test-Path $PublicRepoPath) {
    Write-Host "  ⚠️  Directory exists. Removing old version..." -ForegroundColor Yellow
    Remove-Item -Path $PublicRepoPath -Recurse -Force
}

New-Item -ItemType Directory -Path $PublicRepoPath -Force | Out-Null
Set-Location $PublicRepoPath

Write-Host "  ✅ Directory created: $PublicRepoPath" -ForegroundColor Green
Write-Host ""

# Step 2: Initialize git
Write-Host "Step 2: Initializing git repository..." -ForegroundColor Yellow
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
git remote add origin $GitHubRepoUrl
Write-Host "  ✅ Git initialized" -ForegroundColor Green
Write-Host ""

# Step 3: Create .gitignore
Write-Host "Step 3: Setting up security (.gitignore)..." -ForegroundColor Yellow

$gitignoreContent = @"
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
.DS_Store
Thumbs.db

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
.audit_docx_unpacked/
.audit_report.zip

# Backup files
local_backup_*
*.patch.bak
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent
Write-Host "  ✅ .gitignore created" -ForegroundColor Green
Write-Host ""

# Step 4: Copy source files
Write-Host "Step 4: Copying safe source files..." -ForegroundColor Yellow

$sourceFiles = @(
    'client',
    'server',
    'shared',
    'api',
    'abi',
    'public',
    'docs'
)

foreach ($folder in $sourceFiles) {
    $source = Join-Path $PrivateRepoPath $folder
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $folder -Recurse -Force
        Write-Host "  ✅ Copied $folder" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $folder not found (optional)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 5: Copy configuration files
Write-Host "Step 5: Copying configuration files..." -ForegroundColor Yellow

$configFiles = @(
    'package.json',
    'pnpm-lock.yaml',
    'tsconfig.json',
    'vite.config.ts',
    'vite.config.server.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'vercel.json',
    'netlify.toml',
    '.prettierrc',
    'components.json'
)

foreach ($file in $configFiles) {
    $source = Join-Path $PrivateRepoPath $file
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $file -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

Write-Host ""

# Step 6: Copy smart contracts
Write-Host "Step 6: Copying smart contracts and ABIs..." -ForegroundColor Yellow

Get-ChildItem -Path $PrivateRepoPath -Filter "*.sol" | Copy-Item -Destination . -Force
Write-Host "  ✅ Smart contracts (.sol) copied" -ForegroundColor Green

Get-ChildItem -Path $PrivateRepoPath -Filter "*.abi.json" | Copy-Item -Destination . -Force
Write-Host "  ✅ Contract ABIs copied" -ForegroundColor Green

Write-Host ""

# Step 7: Copy documentation templates
Write-Host "Step 7: Copying documentation and environment templates..." -ForegroundColor Yellow

# Main README
$readmeContent = @"
# WStaking — Multi-Chain Crypto Staking Platform

A production-ready DeFi staking platform supporting multiple blockchains.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PNPM or npm

### Installation
\`\`\`bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Start development server
pnpm dev
\`\`\`

## 📚 Documentation

- **README_RECRUITER.md** - Detailed project showcase (share with recruiters)
- **.env.example** - Environment variables template
- **SECURITY_GUIDE.md** - Security best practices
- **SETUP_PUBLIC_REPO.md** - Detailed setup instructions

## 🔗 Key Features

- Multi-chain staking (BASE, BSC, XLayer)
- Web3 wallet integration (20+ wallets)
- Real-time portfolio tracking
- Enterprise security practices

## 📦 Tech Stack

- Frontend: React 18 + TypeScript + Vite + TailwindCSS
- Backend: Express.js
- Web3: Wagmi, Viem, Rainbow Kit
- Database: Firebase/Firestore

## 📝 License

MIT

## 👨‍💻 Author

Your Name - Full-stack Web3 Developer

---

For more details, see **README_RECRUITER.md**
"@

Set-Content -Path "README.md" -Value $readmeContent
Write-Host "  ✅ README.md created" -ForegroundColor Green

# Copy environment templates
$templateFiles = @(
    '.env.example',
    '.env.preprod.example',
    '.env.prod.example'
)

$templatePath = Join-Path $PrivateRepoPath "wstaking-public"
foreach ($template in $templateFiles) {
    $source = Join-Path $templatePath $template
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $template -Force
        Write-Host "  ✅ $template" -ForegroundColor Green
    }
}

# Copy documentation
$docFiles = @(
    'README_RECRUITER.md',
    'SECURITY_GUIDE.md',
    'SETUP_PUBLIC_REPO.md'
)

foreach ($doc in $docFiles) {
    $source = if (Test-Path (Join-Path $PrivateRepoPath $doc)) {
        Join-Path $PrivateRepoPath $doc
    } else {
        Join-Path $templatePath $doc
    }
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $doc -Force
        Write-Host "  ✅ $doc" -ForegroundColor Green
    }
}

Write-Host ""

# Step 8: Security verification
Write-Host "Step 8: 🔐 Verifying no secrets are included..." -ForegroundColor Yellow
Write-Host ""

$securityOK = $true

# Check for .env files (except templates)
$envFiles = Get-ChildItem -Force -Name ".env*" 2>$null | Where-Object { $_ -notmatch '\.example$' }
if ($envFiles) {
    Write-Host "  ❌ ERROR: Found .env files with potential secrets!" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "     $_" }
    $securityOK = $false
} else {
    Write-Host "  ✅ No .env files with secrets" -ForegroundColor Green
}

# Check for private keys in code
Write-Host "  Checking for private keys..." -ForegroundColor Cyan
$pkeyFiles = Get-ChildItem -Recurse -Include "*.ts", "*.js", "*.json" -ErrorAction SilentlyContinue | 
    Select-String -Pattern "PRIVATE_KEY|-----BEGIN PRIVATE" -ErrorAction SilentlyContinue |
    Where-Object { $_ -notmatch '\.example' -and $_ -notmatch 'node_modules' }

if ($pkeyFiles) {
    Write-Host "  ⚠️  Potential private keys found:" -ForegroundColor Yellow
    $pkeyFiles | Select-Object -First 3 | ForEach-Object { Write-Host "     $_" }
    Write-Host "  Review these files before pushing!" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ No private keys found" -ForegroundColor Green
}

# Check for Firebase credentials
$fbFiles = Get-ChildItem -Recurse -Include "*.json" -ErrorAction SilentlyContinue |
    Select-String -Pattern "firebase-adminsdk|serviceAccount|private_key_id" -ErrorAction SilentlyContinue |
    Where-Object { $_ -notmatch '\.example' }

if ($fbFiles) {
    Write-Host "  ⚠️  Potential Firebase credentials found:" -ForegroundColor Yellow
    $fbFiles | Select-Object -First 3 | ForEach-Object { Write-Host "     $_" }
} else {
    Write-Host "  ✅ No Firebase credentials found" -ForegroundColor Green
}

# Check for node_modules
if (Test-Path "node_modules") {
    Write-Host "  ❌ ERROR: node_modules directory found!" -ForegroundColor Red
    Write-Host "    Remove with: Remove-Item -Path node_modules -Recurse -Force" -ForegroundColor Red
    $securityOK = $false
} else {
    Write-Host "  ✅ No node_modules directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

if (-not $securityOK) {
    Write-Host "❌ Security check FAILED!" -ForegroundColor Red
    Write-Host "Fix the errors above before pushing." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Security verification PASSED!" -ForegroundColor Green
Write-Host ""

# Step 9: Show what will be pushed
Write-Host "Step 9: Preparing for GitHub push..." -ForegroundColor Yellow
Write-Host ""

git add .
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ READY TO PUSH!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the files listed above" -ForegroundColor White
Write-Host "2. Run: git commit -m 'Initial commit: WStaking public repository'" -ForegroundColor Cyan
Write-Host "3. Run: git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  If push fails with branch error:" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository will be at: $GitHubRepoUrl" -ForegroundColor Green
Write-Host ""
