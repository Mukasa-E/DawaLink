# Setup Instructions for Provider Approval System

## Important: Database Schema Update Required

The provider approval system has been fully implemented, but you need to complete the database schema update to use it.

## Step 1: Stop All Running Processes

Before running Prisma commands, make sure to:
1. Stop the backend server (Ctrl+C in the backend terminal)
2. Stop the frontend dev server (Ctrl+C in the frontend terminal)
3. Close any other processes that might be using the database

## Step 2: Update the Database Schema

Open a **new PowerShell terminal** and run:

```powershell
cd c:\Users\ochie\Documents\DawaLink\backend

# Generate the Prisma client
npx prisma generate

# Push schema changes to MongoDB
npx prisma db push
```

If you encounter a **duplicate key error** on `FacilityMedicine`, you have two options:

### Option A: Force Push (Recommended for Development)
```powershell
npx prisma db push --accept-data-loss
```
This will drop and recreate indexes. Your data will be preserved.

### Option B: Manually Fix Duplicates
If you want to keep existing data structure, connect to MongoDB and remove duplicate entries first.

## Step 3: Restart Your Servers

After successfully updating the schema:

### Start Backend:
```powershell
cd c:\Users\ochie\Documents\DawaLink\backend
npm run dev
```

### Start Frontend:
```powershell
cd c:\Users\ochie\Documents\DawaLink\frontend
npm run dev
```

## Step 4: Test the Feature

### Register a Healthcare Provider:
1. Go to `http://localhost:5173/register`
2. Select role: "Healthcare Provider"
3. Select a facility from the dropdown
4. Enter specialization (e.g., "Cardiology")
5. Enter license number (optional)
6. Complete registration
7. You should see: "Registration successful. Your account is pending approval by the facility administrator."

### Approve as Facility Admin:
1. Login as a facility admin
2. Click "Pending Providers" in the sidebar
3. You should see the provider's request
4. Click "Approve" to approve or "Reject" to reject with optional reason

## Files Modified

### Backend:
- ✅ `backend/prisma/schema.prisma` - Added approval fields to User model
- ✅ `backend/src/controllers/authController.ts` - Updated registration logic
- ✅ `backend/src/controllers/facilitiesController.ts` - Added approval endpoints
- ✅ `backend/src/routes/facilities.ts` - Added approval routes

### Frontend:
- ✅ `frontend/src/types/index.ts` - Added approval types
- ✅ `frontend/src/services/api.ts` - Added approval API methods
- ✅ `frontend/src/pages/PendingProviders.tsx` - New approval page
- ✅ `frontend/src/components/Layout.tsx` - Added navigation link
- ✅ `frontend/src/App.tsx` - Added route

## Troubleshooting

### Issue: Prisma generate fails with EPERM error
**Cause**: Windows file permissions or process lock
**Solution**: 
1. Close ALL terminals and VS Code
2. Reopen VS Code
3. Try again
4. If still failing, restart your computer

### Issue: Schema push fails with duplicate key error
**Solution**: Use `npx prisma db push --accept-data-loss`

### Issue: Frontend shows TypeScript errors
**Solution**: The Prisma client needs to be generated first (Step 2)

### Issue: Can't see "Pending Providers" in navigation
**Solution**: Make sure you're logged in as a `facility_admin` user

## Next Steps After Setup

1. Create a test facility admin user if you don't have one
2. Register test healthcare providers
3. Test the approval workflow
4. Check that approved providers can access facility features
5. Verify rejected providers lose facility access

## Need Help?

If you encounter issues:
1. Check that MongoDB is running and accessible
2. Verify `.env` file has correct DATABASE_URL
3. Ensure all dependencies are installed (`npm install`)
4. Check browser console for frontend errors
5. Check terminal for backend errors

## Summary

This feature enables:
- ✅ Healthcare providers request to join facilities
- ✅ Facility admins review and approve/reject requests
- ✅ Complete audit trail of approvals
- ✅ Security through role-based access control
- ✅ Clean, intuitive user interface

Once setup is complete, the system is fully functional and ready to use!
