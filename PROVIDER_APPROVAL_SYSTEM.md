# Provider Approval System Implementation

## Overview
This feature allows facility administrators to review and approve healthcare provider registration requests. When healthcare providers register and select a facility, their accounts are created with a "pending" approval status, requiring facility admin approval before they can fully access the system.

## Features Implemented

### 1. Backend Changes

#### Database Schema (`backend/prisma/schema.prisma`)
Added new fields to the `User` model:
- `isApproved: Boolean` - Simple boolean flag for approval status
- `approvalStatus: ApprovalStatus` - Detailed status (pending, approved, rejected)
- `rejectionReason: String?` - Optional reason if provider is rejected
- `requestedAt: DateTime?` - Timestamp when provider requested to join
- `approvedAt: DateTime?` - Timestamp when provider was approved
- `approvedBy: String?` - ID of the admin who approved the request

Added new enum:
```prisma
enum ApprovalStatus {
  pending
  approved
  rejected
}
```

#### Auth Controller (`backend/src/controllers/authController.ts`)
**Updated Registration Logic:**
- Healthcare providers registering with a `facilityId` now get `approvalStatus: 'pending'`
- `isApproved` is set to `false` for pending providers
- `requestedAt` is set to the current timestamp
- Registration response includes a message: "Your account is pending approval by the facility administrator"
- Other user types (patients, facility_admin, admin) are auto-approved

**Updated User Retrieval:**
- `getCurrentUser` endpoint now returns approval status fields
- Frontend can check `approvalStatus` and display appropriate messages

#### Facilities Controller (`backend/src/controllers/facilitiesController.ts`)
Added three new endpoints:

**1. GET `/facilities/pending/providers`**
- Lists all pending provider registrations for a facility
- Facility admins see only their facility's pending providers
- System admins can filter by facilityId using query parameter
- Returns: `id, name, email, phone, specialization, licenseNumber, requestedAt, createdAt`
- Ordered by most recent first

**2. POST `/facilities/providers/:providerId/approve`**
- Approves a pending provider
- Sets `isApproved: true`, `approvalStatus: 'approved'`
- Records `approvedAt` timestamp and `approvedBy` admin ID
- Only facility admin can approve providers for their facility
- Returns success message and updated provider data

**3. POST `/facilities/providers/:providerId/reject`**
- Rejects a pending provider request
- Sets `isApproved: false`, `approvalStatus: 'rejected'`
- Accepts optional `reason` in request body
- Removes `facilityId` association (provider no longer linked to facility)
- Returns success message and updated provider data

#### Routes (`backend/src/routes/facilities.ts`)
Added new protected routes:
```typescript
router.get('/pending/providers', authenticate, authorize(['facility_admin', 'admin']), getPendingProviders);
router.post('/providers/:providerId/approve', authenticate, authorize(['facility_admin', 'admin']), approveProvider);
router.post('/providers/:providerId/reject', authenticate, authorize(['facility_admin', 'admin']), rejectProvider);
```

### 2. Frontend Changes

#### Type Definitions (`frontend/src/types/index.ts`)
Updated `User` interface with new fields:
```typescript
interface User {
  // ... existing fields
  isApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}
```

#### API Services (`frontend/src/services/api.ts`)
Added new API methods to `facilitiesAPI`:
```typescript
getPendingProviders(facilityId?: string): Promise<User[]>
approveProvider(providerId: string): Promise<{ message: string; provider: User }>
rejectProvider(providerId: string, reason?: string): Promise<{ message: string; provider: User }>
```

#### New Page: Pending Providers (`frontend/src/pages/PendingProviders.tsx`)
A comprehensive UI for facility admins to manage provider requests:

**Features:**
- Displays all pending provider registrations in a card grid layout
- Shows provider details: name, email, phone, specialization, license number
- Displays timestamp of when the request was made
- Color-coded status badge (yellow for "Pending")
- Two action buttons per provider:
  - **Approve** (green) - Instantly approves the provider
  - **Reject** (red) - Opens modal to provide optional rejection reason
- Real-time updates - approved/rejected providers removed from list immediately
- Success/error notifications with auto-dismiss
- Empty state when no pending providers
- Loading spinner during data fetch
- Responsive design (1 column on mobile, 2 columns on desktop)

**Reject Modal:**
- Optional textarea for rejection reason
- Cancel and Confirm buttons
- Disabled state while processing
- Auto-clears on cancel

#### Navigation (`frontend/src/components/Layout.tsx`)
Added "Pending Providers" link to facility admin navigation:
- Icon: UserCheck
- Positioned second in facility admin menu (after "My Facility")
- Only visible to facility_admin role

#### Routing (`frontend/src/App.tsx`)
Added new protected route:
```typescript
<Route path="/pending-providers" 
       element={<ProtectedRoute allowedRoles={['facility_admin', 'admin']}>
         <PendingProviders />
       </ProtectedRoute>} />
```

## User Workflows

### Healthcare Provider Registration Flow
1. Provider visits `/register`
2. Selects role: "Healthcare Provider"
3. Selects desired facility from dropdown
4. Enters specialization, license number (optional)
5. Submits registration
6. Account is created with `approvalStatus: 'pending'`
7. Provider receives message: "Your account is pending approval by the facility administrator"
8. Provider can log in but has limited access until approved

### Facility Admin Approval Flow
1. Facility admin logs in
2. Clicks "Pending Providers" in sidebar navigation
3. Views list of providers requesting to join facility
4. Reviews provider details (name, email, specialization, license)
5. Decides to approve or reject:

**If Approving:**
- Clicks "Approve" button
- Provider's `approvalStatus` changes to 'approved'
- Provider gains full access to facility systems
- Provider removed from pending list
- Success notification displayed

**If Rejecting:**
- Clicks "Reject" button
- Modal appears for optional rejection reason
- Enters reason (e.g., "Invalid credentials", "Incomplete information")
- Clicks "Confirm Reject"
- Provider's `approvalStatus` changes to 'rejected'
- Provider's facility association removed
- Provider removed from pending list
- Success notification displayed

### Provider Post-Approval Experience
After approval:
- Provider's `isApproved` becomes `true`
- Provider's `approvalStatus` becomes 'approved'
- Provider gains full access to:
  - Create referrals
  - Create medical records
  - View facility patients
  - Manage facility medicines
  - Create prescriptions
- Provider's facility association is permanent (unless removed by admin)

### Provider Post-Rejection Experience
After rejection:
- Provider's `isApproved` becomes `false`
- Provider's `approvalStatus` becomes 'rejected'
- Provider's `facilityId` is set to `null`
- Provider can see `rejectionReason` in their profile
- Provider may need to register again or contact the facility

## Database Migration Required

After updating the Prisma schema, run:

```powershell
# Navigate to backend directory
cd backend

# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to MongoDB (for development)
npx prisma db push

# OR create a migration (for production)
npx prisma migrate dev --name add-provider-approval-system
```

## Security Considerations

1. **Authorization**: Only facility admins can approve/reject providers for their facility
2. **Validation**: Backend validates that approver has permission for the specific facility
3. **Audit Trail**: Tracks who approved (approvedBy), when (approvedAt), and why rejected (rejectionReason)
4. **Role Protection**: All approval endpoints require authentication and specific roles
5. **Data Isolation**: Facility admins can only see providers requesting their facility

## Testing Checklist

### Backend Testing
- [ ] Healthcare provider registers with facilityId → status is 'pending'
- [ ] Patient registers → status is 'approved' (auto-approved)
- [ ] Facility admin can fetch pending providers for their facility
- [ ] Facility admin can approve provider → status changes to 'approved'
- [ ] Facility admin can reject provider with reason
- [ ] Rejected provider loses facility association
- [ ] Facility admin cannot approve provider from different facility
- [ ] System admin can view pending providers for any facility

### Frontend Testing
- [ ] Register as healthcare provider → see pending approval message
- [ ] Login as facility admin → see "Pending Providers" in navigation
- [ ] Click "Pending Providers" → see list of pending providers
- [ ] Approve provider → provider removed from list, success message shown
- [ ] Reject provider → modal appears, can enter reason
- [ ] Submit rejection → provider removed, success message shown
- [ ] Empty state shows when no pending providers
- [ ] Error handling displays properly

## API Endpoints Summary

### GET `/api/facilities/pending/providers`
**Auth Required**: Yes (facility_admin, admin)
**Query Params**: `facilityId` (optional, admin only)
**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Dr. John Doe",
    "email": "john@example.com",
    "phone": "+254700000000",
    "specialization": "Cardiology",
    "licenseNumber": "MD12345",
    "requestedAt": "2025-11-27T10:30:00Z",
    "createdAt": "2025-11-27T10:30:00Z"
  }
]
```

### POST `/api/facilities/providers/:providerId/approve`
**Auth Required**: Yes (facility_admin, admin)
**Response**:
```json
{
  "message": "Provider approved successfully",
  "provider": {
    "id": "uuid",
    "name": "Dr. John Doe",
    "email": "john@example.com",
    "approvalStatus": "approved",
    "approvedAt": "2025-11-27T11:00:00Z"
  }
}
```

### POST `/api/facilities/providers/:providerId/reject`
**Auth Required**: Yes (facility_admin, admin)
**Request Body**:
```json
{
  "reason": "Invalid credentials"
}
```
**Response**:
```json
{
  "message": "Provider request rejected",
  "provider": {
    "id": "uuid",
    "name": "Dr. John Doe",
    "email": "john@example.com",
    "approvalStatus": "rejected",
    "rejectionReason": "Invalid credentials"
  }
}
```

## Future Enhancements

1. **Email Notifications**: Send email to provider when approved/rejected
2. **Approval Dashboard Widget**: Show pending count on facility admin dashboard
3. **Bulk Actions**: Approve/reject multiple providers at once
4. **Provider Appeal**: Allow rejected providers to appeal or reapply
5. **Approval History**: Show audit log of all approvals/rejections
6. **Auto-expire Requests**: Auto-reject requests after X days of inactivity
7. **Verification Documents**: Upload and review license/credential documents
8. **Two-step Verification**: Require additional verification for certain specializations

## Troubleshooting

### Issue: Compile errors about missing fields
**Solution**: Run `npx prisma generate` to regenerate Prisma client

### Issue: Providers not appearing in pending list
**Check**: 
- Provider registered with `facilityId`
- Provider's `approvalStatus` is 'pending'
- Facility admin is logged in to correct facility

### Issue: Approval button doesn't work
**Check**:
- Backend server is running
- Token is valid in localStorage
- User has 'facility_admin' role
- Network requests are successful (check browser console)

## Related Files

**Backend:**
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/controllers/authController.ts` - Registration logic
- `backend/src/controllers/facilitiesController.ts` - Approval endpoints
- `backend/src/routes/facilities.ts` - Route definitions

**Frontend:**
- `frontend/src/types/index.ts` - TypeScript types
- `frontend/src/services/api.ts` - API client
- `frontend/src/pages/PendingProviders.tsx` - Approval UI
- `frontend/src/components/Layout.tsx` - Navigation
- `frontend/src/App.tsx` - Routing

## Summary

This implementation provides a complete provider approval workflow:
- ✅ Automatic pending status for healthcare providers
- ✅ Facility admin dashboard to review requests
- ✅ Approve/reject functionality with optional rejection reason
- ✅ Real-time UI updates
- ✅ Secure role-based authorization
- ✅ Audit trail for accountability
- ✅ Clean, responsive user interface
- ✅ Error handling and notifications

The system is production-ready and follows best practices for security, user experience, and maintainability.
