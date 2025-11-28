# ⚠️ Backend Errors - Fix Instructions

## Current Issues

### 1. Prisma Client Generation Blocked ❌
**Problem**: Windows file lock preventing Prisma from regenerating  
**Impact**: TypeScript doesn't recognize new database models (Facility, updated Referral, etc.)

### 2. Type Mismatches ✅ FIXED
**Problem**: TypeScript types didn't match new schema  
**Status**: Fixed in `backend/src/types/index.ts`

---

## Quick Fix Steps

### Option 1: Run PowerShell Script (Easiest)
```powershell
cd backend
.\fix-prisma.ps1
```

This script will:
1. Stop all Node processes
2. Delete `.prisma` folder
3. Regenerate Prisma client
4. Push schema to database

### Option 2: Manual Steps
```powershell
# 1. Close VS Code completely

# 2. Open new PowerShell as Administrator
cd C:\Users\ochie\Documents\DawaLink\backend

# 3. Kill Node processes
taskkill /F /IM node.exe

# 4. Delete .prisma folder
Remove-Item .\node_modules\.prisma -Recurse -Force

# 5. Generate Prisma
npx prisma generate

# 6. Push to database
npx prisma db push
```

### Option 3: Fresh Install
```powershell
cd backend

# Delete node_modules
Remove-Item .\node_modules -Recurse -Force

# Reinstall
npm install

# Generate Prisma
npx prisma generate

# Push to database  
npx prisma db push --force-reset
```

---

## What Was Changed

### ✅ Database Schema (`schema.prisma`)
- **Removed**: Pharmacy, Medicine, Order, Payment, Delivery models
- **Added**: Facility model for healthcare facilities
- **Enhanced**: Referral model with QR codes, urgency, clinical data
- **Enhanced**: MedicalRecord model with vital signs, lab results
- **Added**: PatientAuthorization model for consent management
- **Updated**: User roles to: patient, healthcare_provider, facility_admin, admin

### ✅ Types (`src/types/index.ts`)
- Updated UserRole type
- Added Facility interface
- Enhanced Referral interface
- Enhanced MedicalRecord interface
- Added PatientAuthorization interface
- Updated AuthRequest with facilityId

### ✅ Controllers
- **New**: `facilitiesController.ts` - Manage healthcare facilities
- **New**: `authorizationsController.ts` - Patient consent management
- **Updated**: `referralsController.ts` - QR codes, enhanced data
- **Updated**: `recordsController.ts` - QR codes, vital signs

### ✅ Routes
- **New**: `/api/facilities` - Facility management
- **New**: `/api/authorizations` - Access control
- **Updated**: `/api/referrals` - Added QR verification
- **Updated**: `/api/records` - Added QR verification
- **Removed**: `/api/medicines`, `/api/orders`, `/api/pharmacy`, `/api/delivery`, `/api/payments`

### ✅ Documentation
- **Created**: `SRS_DOCUMENT.md` - Complete requirements spec
- **Created**: `REFACTOR_SUMMARY.md` - Change summary
- **Created**: `MIGRATION_GUIDE.md` - Migration instructions
- **Updated**: `README.md` - New project description

---

## Verification Steps

After fixing Prisma, verify everything works:

### 1. Check Prisma Generation
```powershell
cd backend
npx prisma generate
# Should complete without errors
```

### 2. Check Database Push
```powershell
npx prisma db push
# Should create/update MongoDB collections
```

### 3. Check TypeScript Compilation
```powershell
npm run build
# Should compile without errors
```

### 4. Start Backend
```powershell
npm run dev
# Should start on port 5000
```

### 5. Test Health Endpoint
```powershell
curl http://localhost:5000/health
# Should return: {"status":"ok","message":"DawaLink Patient Referral & Records System API is running"}
```

---

## Expected Errors (Until Prisma Generates)

You'll see these TypeScript errors until Prisma client regenerates:
- ❌ Property 'facility' does not exist on type 'PrismaClient'
- ❌ Property 'referralNumber' does not exist
- ❌ Type '"facility_admin"' is not assignable
- ❌ Property 'facilityId' does not exist
- ❌ Property 'specialization' does not exist

**These will ALL disappear** once `npx prisma generate` succeeds.

---

## Still Stuck?

### Last Resort: Nuclear Option
```powershell
# 1. Close ALL VS Code windows
# 2. Open Task Manager (Ctrl+Shift+Esc)
# 3. End all "Node.js" processes
# 4. Navigate to project
cd C:\Users\ochie\Documents\DawaLink\backend

# 5. Full clean
Remove-Item .\node_modules -Recurse -Force
Remove-Item .\package-lock.json -Force

# 6. Fresh install
npm install

# 7. Generate
npx prisma generate
npx prisma db push

# 8. Test
npm run dev
```

---

## Summary

✅ **Backend Code**: Fully refactored for referral system  
✅ **Database Schema**: Updated for healthcare workflows  
✅ **Types**: Fixed to match new schema  
❌ **Prisma Client**: Needs regeneration (blocked by file lock)  
⏳ **Frontend**: Needs updating to match new backend  

**Next Step**: Fix Prisma generation using one of the options above, then the backend will be ready to run!

---

*Last Updated: November 20, 2025*
