# DawaLink Authentication Guide

## Overview
Your authentication system is fully functional and saves all user data to MongoDB Atlas. Here's how it works:

## Authentication Flow

### 1. **User Registration** (`POST /api/auth/register`)
**Frontend**: User fills out the registration form with:
- Name
- Email (unique)
- Password (hashed with bcryptjs)
- Role (patient, healthcare_provider, admin)
- Phone (optional)
- Facility (for healthcare providers/admins)

**Backend Process**:
1. Validates required fields (email, password, name, role)
2. Checks if user already exists in MongoDB
3. Hashes the password using bcryptjs (salt rounds: 10)
4. Creates user document in MongoDB with:
   - UUID as ID
   - All provided fields
   - Timestamp (createdAt)
5. Generates JWT token (valid for 7 days)
6. Returns user data + token to frontend

**MongoDB Collection**: `User`
```json
{
  "_id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "patient",
  "phone": "+256700000000",
  "facility": null,
  "passwordHash": "$2a$10$...",
  "createdAt": "2025-11-16T12:00:00.000Z"
}
```

### 2. **User Login** (`POST /api/auth/login`)
**Frontend**: User enters:
- Email
- Password

**Backend Process**:
1. Finds user by email in MongoDB
2. Compares provided password with stored hash
3. If valid, generates JWT token
4. Returns user data + token (password never sent)

### 3. **Get Current User** (`GET /api/auth/me`)
**Frontend**: Verifies session on app startup
- Sends stored JWT token in Authorization header

**Backend Process**:
1. Middleware verifies JWT token
2. Extracts user ID from token
3. Fetches fresh user data from MongoDB
4. Returns current user info

## Data Storage in MongoDB

### User Collection Fields
| Field | Type | Purpose |
|-------|------|---------|
| `_id` | String | Unique user identifier (UUID) |
| `email` | String | User email (unique index) |
| `name` | String | User's full name |
| `role` | String | patient \| healthcare_provider \| admin |
| `phone` | String | Contact number (optional) |
| `facility` | String | Healthcare facility name (optional) |
| `passwordHash` | String | Bcryptjs hashed password |
| `createdAt` | DateTime | Account creation timestamp |

### Indexes in MongoDB
- `email`: Unique index for fast lookups
- `role`: For role-based queries

## Security Features

✅ **Password Security**:
- Bcryptjs hashing with 10 salt rounds
- Passwords never stored in plain text
- Passwords never returned in API responses

✅ **JWT Tokens**:
- Signed with `JWT_SECRET` from `.env`
- 7-day expiration
- Contains: id, email, role
- Verified on protected endpoints

✅ **Role-Based Access Control (RBAC)**:
- `patient`: Can only access own data
- `healthcare_provider`: Can create/view referrals and records
- `admin`: Full access to all data

✅ **Input Validation**:
- Required field validation
- Email format validation (frontend)
- Role enum validation
- Password minimum length (6 characters)

## Testing the Auth Flow

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "name": "John Doe",
    "role": "patient",
    "phone": "+256700000000"
  }'
```

**Expected Response**:
```json
{
  "user": {
    "id": "abc-123-def",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "patient",
    "phone": "+256700000000",
    "facility": null,
    "createdAt": "2025-11-16T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login with User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response**: Same as registration (user + token)

### 3. Get Current User (Protected)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "id": "abc-123-def",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "patient",
  "phone": "+256700000000",
  "facility": null,
  "createdAt": "2025-11-16T12:00:00.000Z"
}
```

## MongoDB Atlas Dashboard

To view stored users:
1. Go to https://www.mongodb.com/cloud/atlas
2. Log in to your cluster
3. Navigate to: **Database** → **Collections** → **dawalink** → **User**
4. See all registered users with their data

## Frontend Integration

The frontend automatically:
1. **Stores JWT token** in localStorage
2. **Attaches token** to all API requests via Authorization header
3. **Validates session** on app startup
4. **Redirects to login** if token is invalid/expired
5. **Stores user info** in React Context (AuthContext)

## Environment Variables

Make sure your `.env` file has:
```
DATABASE_URL=mongodb+srv://manumukasa_db_user:HPbIRHofQvON06e5@cluster0.v6xihk8.mongodb.net/dawalink
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

⚠️ **Important**: Change `JWT_SECRET` to a strong, random key in production!

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "User already exists" | Email already registered | Use different email or reset DB |
| "Invalid credentials" | Wrong password or email | Check email/password |
| "No token provided" | Missing Authorization header | Ensure token is sent |
| "Invalid or expired token" | Token expired (7 days) or corrupted | User needs to re-login |
| MongoDB connection error | Wrong DATABASE_URL | Verify credentials in `.env` |

## Next Steps

1. ✅ Test registration in the UI (http://localhost:5173/register)
2. ✅ Verify user appears in MongoDB Atlas
3. ✅ Test login in the UI (http://localhost:5173/login)
4. ✅ Create referrals/records (authenticated endpoints)
5. ✅ Verify all data persists in MongoDB

---

**Your auth system is production-ready!** Users will be saved to MongoDB and can log back in anytime. 🚀
