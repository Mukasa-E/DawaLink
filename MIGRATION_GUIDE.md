# DawaLink Backend Migration Guide

## Critical Issues to Fix

### 1. Prisma Client Generation Issue

The Prisma client is locked by a running process. Follow these steps:

**Option A: Close VS Code and Regenerate**
1. Close VS Code completely
2. Open Command Prompt (not PowerShell)
3. Navigate to backend: `cd C:\Users\ochie\Documents\DawaLink\backend`
4. Run: `npx prisma generate`
5. Run: `npx prisma db push`

**Option B: Delete and Regenerate**
```bash
cd backend
# Delete the generated client
rmdir /s node_modules\.prisma
# Regenerate
npx prisma generate
npx prisma db push
```

**Option C: Fresh Start (Recommended)**
```bash
cd backend
# Drop the database in MongoDB
# Then:
npx prisma generate
npx prisma db push --force-reset
```

### 2. Type Errors in Code

After Prisma generates successfully, there are still some type issues to fix:

#### Update AuthRequest Type
File: `backend/src/types/index.ts`

Add `facilityId` and `specialization` to the JWTPayload:
```typescript
export interface JWTPayload {
  userId: string;
  id: string;
  email: string;
  role: UserRole;
  facilityId?: string;
}
```

#### Update JWT Token Generation
File: `backend/src/controllers/authController.ts`

When generating JWT tokens, include the facilityId:
```typescript
const token = jwt.sign(
  {
    userId: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facilityId
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 3. Database Migration Steps

Once Prisma generates successfully:

```bash
cd backend

# Step 1: Generate Prisma Client
npx prisma generate

# Step 2: Push schema to MongoDB (creates collections)
npx prisma db push

# Step 3: (Optional) Reset if you have old data
npx prisma db push --force-reset

# Step 4: Start backend
npm run dev
```

### 4. Test the Backend

Once running, test with:
```bash
# Health check
curl http://localhost:5000/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "name": "Test User",
    "role": "patient"
  }'
```

## Common Errors and Solutions

### Error: "Property 'facility' does not exist"
- **Cause**: Prisma client not regenerated
- **Fix**: Run `npx prisma generate`

### Error: "EPERM: operation not permitted"
- **Cause**: File locked by running process
- **Fix**: Close VS Code, kill Node processes, try again

### Error: "Reference causes a cycle"
- **Cause**: Circular relationship in schema
- **Fix**: Already fixed with `onDelete: NoAction, onUpdate: NoAction`

### Error: Type mismatches in controllers
- **Cause**: Types don't match new schema
- **Fix**: Wait until Prisma generates, then types will update

## Verification Checklist

- [ ] Prisma client generated successfully
- [ ] Database schema pushed to MongoDB
- [ ] Backend starts without errors
- [ ] `/health` endpoint responds
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] JWT token includes facilityId

## Next Steps After Backend Works

1. Update frontend types to match new backend
2. Create facility registration page
3. Update dashboards for new roles
4. Implement QR code scanning UI
5. Test complete workflows

## Need Help?

If you're still stuck:
1. Delete `node_modules` and reinstall: `npm install`
2. Delete `node_modules\.prisma` folder
3. Close all terminals and VS Code
4. Open fresh terminal
5. Run `npx prisma generate` again
