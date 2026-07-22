# 🤖 DATABASE SETUP AUTOMATION - WINDOWS

## 🚀 **Windows PowerShell Script**

### **Save as `setup-database.ps1`**
```powershell
# Fluentive CRM Database Setup Automation for Windows
# Usage: .\setup-database.ps1 [provider] [db-connection-string] [jwt-secret]

param(
    [Parameter(Mandatory=$true)]
    [string]$Provider,
    
    [Parameter(Mandatory=$true)]
    [string]$DbConnection,
    
    [Parameter(Mandatory=$true)]
    [string]$JwtSecret
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    NoColor = ""
}

Write-Host "🚀 Fluentive CRM Database Setup" -ForegroundColor $Colors.Blue

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "Green"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

# Validate provider
$ValidProviders = @("supabase", "railway", "neon", "aws")
if ($Provider -notin $ValidProviders) {
    Write-ColorOutput "❌ Invalid provider: $Provider" -Color $Colors.Red
    Write-ColorOutput "Valid providers: $($ValidProviders -join ', ')" -Color $Colors.Yellow
    exit 1
}

Write-ColorOutput "✅ Provider: $Provider" -Color $Colors.Green
Write-ColorOutput "✅ Database connection received" -Color $Colors.Green

# Step 1: Check Vercel CLI
Write-ColorOutput "🔧 Step 1: Checking Vercel CLI..." -Color $Colors.Blue
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-ColorOutput "❌ Vercel CLI not found. Installing..." -Color $Colors.Red
    npm install -g vercel
}

# Step 2: Login to Vercel
Write-ColorOutput "🔧 Step 2: Logging into Vercel..." -Color $Colors.Blue
try {
    $null = vercel login
} catch {
    Write-ColorOutput "❌ Failed to login to Vercel" -Color $Colors.Red
    exit 1
}

# Step 3: Set environment variables
Write-ColorOutput "🔧 Step 3: Setting environment variables..." -Color $Colors.Blue

# Set DATABASE_URL
Write-ColorOutput "   Setting DATABASE_URL..." -Color $Colors.Yellow
vercel env add DATABASE_URL $DbConnection

# Set JWT_SECRET
Write-ColorOutput "   Setting JWT_SECRET..." -Color $Colors.Yellow
vercel env add JWT_SECRET $JwtSecret

# Set production variables
Write-ColorOutput "   Setting production variables..." -Color $Colors.Yellow
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_URL https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app

# Step 4: Deploy to production
Write-ColorOutput "🔧 Step 4: Deploying to production..." -Color $Colors.Blue
try {
    $null = vercel --prod
} catch {
    Write-ColorOutput "❌ Failed to deploy to Vercel" -Color $Colors.Red
    exit 1
}

# Step 5: Run database migration
Write-ColorOutput "🔧 Step 5: Running database migration..." -Color $Colors.Blue
try {
    $null = npx prisma db push --accept-data-loss
} catch {
    Write-ColorOutput "❌ Database migration failed" -Color $Colors.Red
    exit 1
}

# Step 6: Verify setup
Write-ColorOutput "🔧 Step 6: Verifying setup..." -Color $Colors.Blue

# Test database connection
try {
    $null = npx prisma db pull
    Write-ColorOutput "✅ Database connection successful" -Color $Colors.Green
} catch {
    Write-ColorOutput "❌ Database connection failed" -Color $Colors.Red
    exit 1
}

# Generate Prisma client
Write-ColorOutput "🔧 Generating Prisma client..." -Color $Colors.Yellow
npx prisma generate

# Test health endpoint
Write-ColorOutput "🔧 Testing health endpoint..." -Color $Colors.Blue
$HealthResponse = Invoke-RestMethod -Uri "https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app/api/health" -Method GET

if ($HealthResponse.StatusCode -eq 200) {
    Write-ColorOutput "✅ Health endpoint working (200)" -Color $Colors.Green
} else {
    Write-ColorOutput "❌ Health endpoint failed ($($HealthResponse.StatusCode))" -Color $Colors.Red
    exit 1
}

Write-ColorOutput "🎉 Database setup complete!" -Color $Colors.Green
Write-ColorOutput "🌐 Production URL: https://fluentive-auilxs4au-yassin-1142003s-projects.vercel.app" -Color $Colors.Blue
Write-ColorOutput "📊 Next steps: Test user registration and CRM functionality" -Color $Colors.Yellow
```

## 🚀 **Usage Examples**

### **For Supabase:**
```powershell
.\setup-database.ps1 supabase "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres" "your_jwt_secret_here"
```

### **For Railway:**
```powershell
.\setup-database.ps1 railway "postgresql://postgres:[PASSWORD]@[HOST].railway.app:5432/railway" "your_jwt_secret_here"
```

### **For Neon:**
```powershell
.\setup-database.ps1 neon "postgresql://[USERNAME]:[PASSWORD]@[HOST].neon.tech:5432/neondb" "your_jwt_secret_here"
```

## 🔐 **Security Notes**

1. **Never commit `.env` files** to git
2. **Use different database** for production vs development
3. **Rotate secrets regularly** - especially JWT_SECRET
4. **Test with sample data** before going live
5. **Backup database** regularly

---

**Ready to automate your database setup on Windows!** 🚀
