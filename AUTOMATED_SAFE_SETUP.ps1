#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "AUTOMATED SAFE PUBLIC REPO SETUP"
Write-Host "========================================"
Write-Host ""

# Configuration
$PRIVATE_REPO = "D:\staking page zip file\Wstaking_New_UI\Wstaking_New_UI"
$PUBLIC_REPO = "D:\staking page zip file\Wstaking_New_UI\wstaking-public"
$GITHUB_URL = "https://github.com/darkblood784/Wstaking-net.git"

# Step 1: Verify we're in the right location
Write-Host "Step 1: Verifying repository path..."
if (-not (Test-Path $PUBLIC_REPO)) {
    Write-Host "ERROR: Public repo folder not found at $PUBLIC_REPO"
    exit 1
}
Set-Location $PUBLIC_REPO
Write-Host "OK: Location verified: $PUBLIC_REPO"
Write-Host ""

# Step 2: Reset git (optional - for fresh start)
Write-Host "Step 2: Cleaning up git..."
if (Test-Path ".git") {
    Write-Host "  Removing old git setup..."
    Remove-Item -Path ".git" -Recurse -Force
}
Write-Host "OK: Git cleaned"
Write-Host ""

# Step 3: Remove old folders (keep docs only)
Write-Host "Step 3: Preparing directory..."
$foldersToRemove = @("client", "server", "shared", "api", "abi", "public", "dist", "node_modules", "netlify", ".data")
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "OK: Directory cleaned"
Write-Host ""

# Step 4: Copy ALL source code folders
Write-Host "Step 4: Copying all source code folders..."

$sourceFolders = @(
    'client',
    'server', 
    'shared',
    'api',
    'abi',
    'public',
    'docs',
    'netlify'
)

foreach ($folder in $sourceFolders) {
    $source = Join-Path $PRIVATE_REPO $folder
    if (Test-Path $source) {
        Write-Host "  Copying $folder..."
        Copy-Item -Path $source -Destination $folder -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    OK: $folder copied"
    } else {
        Write-Host "    (not found: $folder)"
    }
}
Write-Host ""

# Step 5: Copy configuration files
Write-Host "Step 5: Copying configuration files..."

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
    'components.json',
    'index.html'
)

foreach ($file in $configFiles) {
    $source = Join-Path $PRIVATE_REPO $file
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $file -Force
        Write-Host "  OK: $file"
    }
}
Write-Host ""

# Step 6: Copy smart contracts and ABIs
Write-Host "Step 6: Copying smart contracts..."

Get-ChildItem -Path $PRIVATE_REPO -Filter "*.sol" -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Copy-Item -Path $_.FullName -Destination . -Force
        Write-Host "  OK: $($_.Name)"
    }

Get-ChildItem -Path $PRIVATE_REPO -Filter "*.abi.json" -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Copy-Item -Path $_.FullName -Destination . -Force
        Write-Host "  OK: $($_.Name)"
    }

Get-ChildItem -Path $PRIVATE_REPO -Filter "*.json" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -notmatch "^package|tsconfig|components|firebase|.env" } |
    Select-Object -First 5 |
    ForEach-Object {
        Copy-Item -Path $_.FullName -Destination . -Force
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    }
Write-Host ""

# Step 7: Copy documentation
Write-Host "Step 7: Copying documentation..."

$docFiles = @(
    'README.md',
    'README_RECRUITER.md',
    'AGENTS.md',
    'LICENSE'
)

foreach ($doc in $docFiles) {
    $source = Join-Path $PRIVATE_REPO $doc
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $doc -Force
        Write-Host "  OK: $doc"
    }
}
Write-Host ""

# Step 8: Create comprehensive .gitignore (CRITICAL FOR SECURITY)
Write-Host "Step 8: Setting up .gitignore (security)..."

$gitignore = @'
# Environment variables
.env
.env.local
.env.*.local
.env.preprod
.env.prod

# Credentials
*.pem
*.key
*.crt
firebase-admin.json
firebase-service-account.json
*-firebase-adminsdk-*.json
credentials.json
secrets.json
private_key

# Build output
dist/
build/
node_modules/

# IDE
.vscode/
.idea/

# Logs and temp
logs/
*.log
.cache/

# Database
.data/
*.db
*.sqlite3

# Old files
_old-staking-frontend/
.audit_docx_unpacked/
local_backup_*

.DS_Store
Thumbs.db
'@

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "OK: .gitignore created"
Write-Host ""

# Step 9: Security verification
Write-Host "Step 9: SECURITY VERIFICATION..."
Write-Host ""

$securityPassed = $true

# Check 1: .env files
Write-Host "  Checking for .env files..."
$envFiles = @()
Get-ChildItem -Force -Name ".env*" -ErrorAction SilentlyContinue | 
    Where-Object { $_ -notmatch '\.example' } | 
    ForEach-Object { $envFiles += $_ }

if ($envFiles.Count -gt 0) {
    Write-Host "  ERROR: Found .env files!"
    $securityPassed = $false
} else {
    Write-Host "  OK: No .env files"
}

# Check 2: node_modules
if (Test-Path "node_modules") {
    Write-Host "  ERROR: node_modules found!"
    $securityPassed = $false
} else {
    Write-Host "  OK: No node_modules"
}

if (-not $securityPassed) {
    Write-Host ""
    Write-Host "SECURITY CHECK FAILED!"
    exit 1
}

Write-Host ""
Write-Host "OK: SECURITY PASSED!"
Write-Host ""

# Step 10: Initialize git and show status
Write-Host "Step 10: Initializing git..."
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
git remote add origin $GITHUB_URL
git add .
Write-Host "OK: Git initialized"
Write-Host ""

# Show files that will be committed
Write-Host "Step 11: Files ready to commit:"
Write-Host ""
git status --short | Select-Object -First 30
Write-Host ""

Write-Host "=========================================="
Write-Host "SETUP COMPLETE - READY TO PUSH!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Next - Run these commands:"
Write-Host ""
Write-Host "  git commit -m 'Initial commit: WStaking complete public repository'"
Write-Host "  git branch -M main"
Write-Host "  git push -u origin main --force"
Write-Host ""
Write-Host "Your repo will be at: $GITHUB_URL"
Write-Host ""
