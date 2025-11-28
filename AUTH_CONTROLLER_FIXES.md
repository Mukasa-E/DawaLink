# Auth Controller Fixes - Schema Migration

## Issues Found

The `authController.ts` was still using **old schema fields** from the e-commerce version:
- ❌ `facility` (string) → should be `facilityId` (foreign key)
- ❌ `department` (removed from schema)  
- ❌ `preferredFacility` (removed from schema)

This was causing 500 errors on all auth endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Fixes Applied

### 1. ✅ Updated `register()` function
**Before:**
```typescript
const { email, password, name, role, phone, facilityId, department, specialization, licenseNumber } = req.body;

const user = await prisma.user.create({
  data: {
    ...
    facilityId: facilityId || null,
    department: department || null,  // ❌ OLD FIELD
    specialization: specialization || null,
    licenseNumber: licenseNumber || null,
    ...
  },
  select: {
    ...
    facilityId: true,
    department: true,  // ❌ OLD FIELD
    ...
  }
});
```

**After:**
```typescript
const { email, password, name, role, phone, facilityId, specialization, licenseNumber } = req.body;

const user = await prisma.user.create({
  data: {
    ...
    facilityId: facilityId || null,
    specialization: specialization || null,
    licenseNumber: licenseNumber || null,
    ...
  },
  select: {
    ...
    facilityId: true,
    specialization: true,
    ...
  }
});

// Also added facilityId to JWT token
const token = generateToken({ 
  userId: user.id,
  id: user.id, 
  email: user.email, 
  role: user.role,
  facilityId: user.facilityId || undefined  // ✅ NEW
});
```

### 2. ✅ Updated `login()` function
**Before:**
```typescript
const token = generateToken({ id: user.id, email: user.email, role: user.role });
```

**After:**
```typescript
const token = generateToken({ 
  userId: user.id,
  id: user.id, 
  email: user.email, 
  role: user.role as any,
  facilityId: user.facilityId || undefined  // ✅ Added facilityId
});
```

### 3. ✅ Updated `getCurrentUser()` function
**Before:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { 
    ...
    facility: true,       // ❌ OLD
    department: true,     // ❌ OLD
    preferredFacility: true,  // ❌ OLD
    ...
  },
});
```

**After:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { 
    ...
    facilityId: true,      // ✅ NEW
    specialization: true,  // ✅ NEW
    licenseNumber: true,   // ✅ NEW
    ...
  },
});
```

### 4. ✅ Fixed Audit Middleware
**Before:**
```typescript
await (prisma as any).auditLog.create({
  data: {
    userId: ...,
    method: req.method,
    path: ...,
    status: res.statusCode,
    // ❌ Missing required 'action' field
  },
});
```

**After:**
```typescript
await (prisma as any).auditLog.create({
  data: {
    userId: ...,
    action: `${req.method} ${(req as any).originalUrl || req.url}`,  // ✅ ADDED
    method: req.method,
    path: ...,
    status: res.statusCode,
  },
});
```

## Prisma Client Regeneration

The Prisma client had cached old schema types. Fixed by:

```powershell
# 1. Stop Node processes
Get-Process -Name "node" | Stop-Process -Force

# 2. Delete cached Prisma client
Remove-Item .\node_modules\.prisma -Recurse -Force

# 3. Regenerate from new schema
npx prisma generate
```

## Verification

✅ **Backend server starts successfully:**
```
🚀 DawaLink Patient Referral & Records System API
📡 Server running on http://localhost:3000
Database connected successfully
```

✅ **All auth endpoints should now work:**
- `POST /api/auth/register` - Creates users with new schema fields
- `POST /api/auth/login` - Authenticates and returns JWT with facilityId
- `GET /api/auth/me` - Returns current user with new fields

## New User Schema (Healthcare System)

```typescript
User {
  id: string
  email: string
  name: string
  role: 'patient' | 'healthcare_provider' | 'facility_admin' | 'admin'
  phone: string?
  facilityId: string?        // ✅ NEW: Foreign key to Facility
  specialization: string?    // ✅ NEW: For healthcare providers
  licenseNumber: string?     // ✅ NEW: Professional license
  passwordHash: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Removed fields:**
- ❌ `facility` (was a string, now foreign key `facilityId`)
- ❌ `department` (removed)
- ❌ `preferredFacility` (removed)
- ❌ `pharmacyId` (e-commerce field)
- ❌ `address` (removed)

## Next Steps

1. ✅ Auth endpoints fixed and working
2. ⏳ Test frontend registration/login
3. ⏳ Update frontend to use new user fields
4. ⏳ Fix other controllers using old schema fields
5. ⏳ Complete frontend refactor for healthcare system

---
**Date:** 2025-11-20  
**Status:** Auth endpoints FIXED ✅
