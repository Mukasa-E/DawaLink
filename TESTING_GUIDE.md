# Quick Auth Testing Commands

## PowerShell Commands (Windows)

### 1. Register a User
```powershell
$body = @{
    email = "user$(Get-Random)@example.com"
    password = "Password123"
    name = "John Doe"
    role = "patient"
    phone = "+256700000000"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/register" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### 2. Login User
```powershell
$body = @{
    email = "user@example.com"
    password = "Password123"
} | ConvertTo-Json

$response = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$data = $response.Content | ConvertFrom-Json
$data | ConvertTo-Json

# Save token for next request
$token = $data.token
```

### 3. Get Current User (Protected - requires token)
```powershell
$token = "YOUR_JWT_TOKEN_HERE"

$response = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/me" `
    -Method Get `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### 4. Test Invalid Token
```powershell
Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/me" `
    -Method Get `
    -Headers @{"Authorization" = "Bearer invalid-token"} `
    -ErrorAction Continue
```

## Bash Commands (Linux/Mac)

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "name": "John Doe",
    "role": "patient",
    "phone": "+256700000000"
  }'
```

### 2. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

### 3. Get Current User (with token)
```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test with jq (pretty print)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }' | jq .
```

## API Endpoints

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "patient" | "healthcare_provider" | "admin",
  "phone": "+256700000000" (optional),
  "facility": "Hospital Name" (optional, required for providers)
}

Response (201 Created):
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "patient",
    "phone": "+256700000000",
    "facility": null,
    "createdAt": "2025-11-16T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

Response (200 OK):
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN

Response (200 OK):
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "patient",
  "phone": "+256700000000",
  "facility": null,
  "createdAt": "2025-11-16T12:00:00Z"
}
```

## Test Scenarios

### Scenario 1: Complete User Lifecycle

```powershell
# 1. Register
$registerBody = @{
    email = "newuser@example.com"
    password = "SecurePass123"
    name = "Jane Smith"
    role = "healthcare_provider"
    phone = "+256701000000"
    facility = "Medical Center"
} | ConvertTo-Json

$register = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/register" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $registerBody

$userData = $register.Content | ConvertFrom-Json

Write-Host "✓ User registered: $($userData.user.email)"
Write-Host "✓ Token: $($userData.token.Substring(0,20))..."

# 2. Login with credentials
$loginBody = @{
    email = "newuser@example.com"
    password = "SecurePass123"
} | ConvertTo-Json

$login = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $loginBody

$loginData = $login.Content | ConvertFrom-Json
$token = $loginData.token

Write-Host "✓ User logged in successfully"

# 3. Get current user
$me = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/auth/me" `
    -Method Get `
    -Headers @{"Authorization"="Bearer $token"}

$currentUser = $me.Content | ConvertFrom-Json

Write-Host "✓ Retrieved user: $($currentUser.name) ($($currentUser.role))"
```

### Scenario 2: Role-Based Access

```powershell
# Test admin-only endpoint (when available)
$token = "admin_user_token_here"

Invoke-WebRequest `
    -Uri "http://localhost:3000/api/admin/stats" `
    -Method Get `
    -Headers @{"Authorization"="Bearer $token"}
```

## MongoDB Data Verification

### View All Users
```
MongoDB Atlas Dashboard
→ Database
→ Collections
→ dawalink
→ User
→ See all registered users
```

### Query Users by Role
```javascript
// In MongoDB Atlas
db.User.find({ role: "patient" })
db.User.find({ role: "healthcare_provider" })
db.User.find({ role: "admin" })
```

### Check Password Hash
```javascript
// In MongoDB Atlas
db.User.findOne({ email: "user@example.com" }, { passwordHash: 1 })
```

## Performance Testing

### Load Test (create multiple users)
```powershell
for ($i = 1; $i -le 10; $i++) {
    $body = @{
        email = "loadtest$i@example.com"
        password = "Test123456"
        name = "Test User $i"
        role = "patient"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/auth/register" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    Write-Host "Created user $i"
}
```

## Debugging

### Check Backend Logs
- Terminal running `npm run dev` shows:
  - Registration/login attempts
  - Database operations
  - Errors and warnings

### Check Frontend Console
- Browser DevTools (F12) → Console
- Network tab to see API requests/responses
- Application tab to see localStorage token

### Verify MongoDB Connection
```powershell
# If backend is running, visit:
http://localhost:3000/health

# Should return:
# {"status":"ok","message":"DawaLink API is running"}
```

---

Use these commands to test and verify your authentication system works correctly! 🚀
