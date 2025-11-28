# Stop any Node processes
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Remove the .prisma folder
Write-Host "Removing .prisma folder..." -ForegroundColor Yellow
Remove-Item -Path ".\node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 1

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Green
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Now pushing to database..." -ForegroundColor Green
    npx prisma db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nAll done! Backend is ready." -ForegroundColor Green
        Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
    }
} else {
    Write-Host "`nFailed to generate Prisma client." -ForegroundColor Red
    Write-Host "Try closing VS Code and running this script again." -ForegroundColor Yellow
}
