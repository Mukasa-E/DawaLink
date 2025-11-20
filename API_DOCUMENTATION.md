# DawaLink API Documentation

## Overview
DawaLink is a hybrid healthcare platform combining medical records management with a pharmacy e-commerce system. This document describes all available API endpoints.

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: TBD

## Authentication
Most endpoints require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained via `/api/auth/login` and are valid for 7 days.

## User Roles
- `patient` - Can create/view their medical records
- `healthcare_provider` - Can create referrals and access authorized records
- `admin` - Full system access
- `customer` - Can browse medicines and place orders
- `pharmacy` - Can manage pharmacy inventory and orders
- `delivery_agent` - Can accept and deliver orders

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Public Access**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+255712345678",
  "role": "patient"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "patient"
  }
}
```

### POST /api/auth/login
Login to existing account.

**Public Access**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** Same as register

### GET /api/auth/me
Get current user profile.

**Requires Authentication**

**Response:**
```json
{
  "id": "abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "patient",
  "phone": "+255712345678"
}
```

---

## Medicine Endpoints

### GET /api/medicines/search
Search for medicines.

**Public Access**

**Query Parameters:**
- `q` - Search query (medicine name)
- `category` - Filter by category
- `pharmacyId` - Filter by pharmacy
- `inStock` - Filter by stock status (true/false)
- `limit` - Results per page (default: 20)
- `skip` - Pagination offset (default: 0)

**Example:**
```
GET /api/medicines/search?q=aspirin&inStock=true&limit=10
```

**Response:**
```json
{
  "medicines": [
    {
      "id": "med123",
      "name": "Aspirin 100mg",
      "description": "Pain reliever",
      "price": 5000,
      "stock": 100,
      "category": "Pain Relief",
      "requiresPrescription": false,
      "pharmacy": {
        "id": "pharm1",
        "name": "HealthCare Pharmacy"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

### GET /api/medicines/:id
Get single medicine details.

**Public Access**

**Response:**
```json
{
  "id": "med123",
  "name": "Aspirin 100mg",
  "description": "Pain reliever and anti-inflammatory",
  "price": 5000,
  "stock": 100,
  "category": "Pain Relief",
  "requiresPrescription": false,
  "pharmacy": {
    "id": "pharm1",
    "name": "HealthCare Pharmacy",
    "address": "123 Main St, Dar es Salaam"
  }
}
```

### POST /api/medicines/pharmacy/:pharmacyId
Add new medicine to pharmacy inventory.

**Requires Authentication: pharmacy, admin**

**Request Body:**
```json
{
  "name": "Paracetamol 500mg",
  "description": "Fever reducer",
  "price": 3000,
  "stock": 200,
  "category": "Pain Relief",
  "requiresPrescription": false,
  "manufacturer": "ABC Pharma",
  "expiryDate": "2025-12-31"
}
```

### PUT /api/medicines/:id
Update medicine details.

**Requires Authentication: pharmacy, admin**

**Request Body:**
```json
{
  "price": 3500,
  "stock": 180,
  "description": "Updated description"
}
```

### DELETE /api/medicines/:id
Delete (soft delete) medicine.

**Requires Authentication: pharmacy, admin**

---

## Order Endpoints

### POST /api/orders
Create new order.

**Requires Authentication: customer, admin**

**Request Body:**
```json
{
  "pharmacyId": "pharm1",
  "deliveryAddress": "456 Oak Avenue, Dar es Salaam",
  "items": [
    {
      "medicineId": "med123",
      "quantity": 2
    },
    {
      "medicineId": "med456",
      "quantity": 1
    }
  ],
  "prescriptionId": "pres789" // Optional, if medicines require prescription
}
```

**Response:**
```json
{
  "id": "order123",
  "orderNumber": "ORD-20240101-001",
  "pharmacyId": "pharm1",
  "customerId": "user123",
  "totalAmount": 13000,
  "status": "pending",
  "paymentStatus": "pending",
  "deliveryAddress": "456 Oak Avenue, Dar es Salaam",
  "items": [...]
}
```

### GET /api/orders/my-orders
Get customer's order history.

**Requires Authentication: customer, admin**

**Query Parameters:**
- `limit` - Results per page (default: 10)
- `skip` - Pagination offset

**Response:**
```json
{
  "orders": [...],
  "pagination": {...}
}
```

### GET /api/orders/:id
Get single order details.

**Requires Authentication**

**Response:**
```json
{
  "id": "order123",
  "orderNumber": "ORD-20240101-001",
  "status": "confirmed",
  "totalAmount": 13000,
  "customer": {
    "name": "John Doe",
    "phone": "+255712345678"
  },
  "pharmacy": {
    "name": "HealthCare Pharmacy",
    "phone": "+255700000000"
  },
  "items": [
    {
      "medicine": {
        "name": "Aspirin 100mg",
        "price": 5000
      },
      "quantity": 2,
      "subtotal": 10000
    }
  ]
}
```

### POST /api/orders/:id/cancel
Cancel an order.

**Requires Authentication: customer, admin**

Only orders with status `pending` or `confirmed` can be cancelled.

### PATCH /api/orders/:id/status
Update order status.

**Requires Authentication: pharmacy, admin**

**Request Body:**
```json
{
  "status": "confirmed" // pending | confirmed | ready | out_for_delivery | delivered | cancelled
}
```

### GET /api/orders/pharmacy/:pharmacyId
Get pharmacy's orders.

**Requires Authentication: pharmacy, admin**

**Query Parameters:**
- `status` - Filter by status

---

## Pharmacy Endpoints

### POST /api/pharmacy/register
Register a new pharmacy.

**Requires Authentication**

**Request Body:**
```json
{
  "name": "HealthCare Pharmacy",
  "licenseNumber": "PHARM-2024-001",
  "phone": "+255700000000",
  "email": "info@healthcare.com",
  "address": "123 Main Street",
  "city": "Dar es Salaam",
  "operatingHours": "Mon-Sat: 8AM-8PM"
}
```

### GET /api/pharmacy/all
Get all pharmacies (public listing).

**Public Access**

**Query Parameters:**
- `city` - Filter by city
- `isVerified` - Filter verified pharmacies

### GET /api/pharmacy/:id
Get pharmacy details.

**Public Access**

### GET /api/pharmacy/my/pharmacy
Get current user's pharmacy.

**Requires Authentication: pharmacy**

### PUT /api/pharmacy/:id
Update pharmacy details.

**Requires Authentication: pharmacy owner or admin**

### PATCH /api/pharmacy/:id/verify
Verify/unverify a pharmacy.

**Requires Authentication: admin**

---

## Delivery Endpoints

### GET /api/delivery/my-deliveries
Get delivery agent's assignments.

**Requires Authentication: delivery_agent**

**Query Parameters:**
- `status` - Filter by delivery status

### GET /api/delivery/available
Get unassigned deliveries.

**Requires Authentication: delivery_agent**

### POST /api/delivery/:id/accept
Accept a delivery assignment.

**Requires Authentication: delivery_agent**

### PATCH /api/delivery/:id/status
Update delivery status.

**Requires Authentication: delivery_agent, admin**

**Request Body:**
```json
{
  "status": "picked_up", // assigned | picked_up | in_transit | delivered | failed
  "latitude": -6.7924,
  "longitude": 39.2083,
  "notes": "Package picked up from pharmacy"
}
```

### POST /api/delivery/assign
Create delivery assignment.

**Requires Authentication: pharmacy**

**Request Body:**
```json
{
  "orderId": "order123"
}
```

### GET /api/delivery/order/:orderId
Get delivery details for an order.

**Requires Authentication**

---

## Payment Endpoints

### POST /api/payments/process
Initiate payment for an order.

**Requires Authentication**

**Request Body:**
```json
{
  "orderId": "order123",
  "amount": 13000,
  "method": "mobile_money", // mobile_money | card | cash
  "phoneNumber": "+255712345678" // For mobile money
}
```

### POST /api/payments/verify-mobile
Verify mobile money payment.

**Requires Authentication**

**Request Body:**
```json
{
  "transactionRef": "MPESA123456",
  "orderId": "order123"
}
```

### POST /api/payments/verify-card
Verify card payment.

**Requires Authentication**

**Request Body:**
```json
{
  "paymentIntentId": "pi_123456",
  "orderId": "order123"
}
```

### GET /api/payments/history
Get payment history.

**Requires Authentication**

**Query Parameters:**
- `limit` - Results per page
- `skip` - Pagination offset

### GET /api/payments/order/:orderId
Get payment details for an order.

**Requires Authentication**

### POST /api/payments/:id/refund
Refund a payment.

**Requires Authentication: admin**

**Request Body:**
```json
{
  "reason": "Order cancelled by customer"
}
```

---

## Notification Endpoints

### GET /api/notifications/my-notifications
Get user's notifications.

**Requires Authentication**

**Query Parameters:**
- `limit` - Results per page (default: 20)
- `skip` - Pagination offset
- `unreadOnly` - Show only unread (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif123",
      "type": "order_update",
      "channel": "in_app",
      "title": "Order Confirmed",
      "message": "Your order has been confirmed by the pharmacy.",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "order": {
        "id": "order123",
        "orderNumber": "ORD-20240101-001"
      }
    }
  ],
  "unreadCount": 3,
  "pagination": {...}
}
```

### PATCH /api/notifications/:id/read
Mark notification as read.

**Requires Authentication**

### POST /api/notifications/mark-all-read
Mark all notifications as read.

**Requires Authentication**

### DELETE /api/notifications/:id
Delete a notification.

**Requires Authentication**

### POST /api/notifications/send
Send a notification (system/admin use).

**Requires Authentication: admin**

**Request Body:**
```json
{
  "userId": "user123",
  "orderId": "order123",
  "type": "order_update",
  "channel": "in_app", // in_app | sms | email | push
  "title": "Order Update",
  "message": "Your order status has changed"
}
```

### GET /api/notifications/stats
Get notification statistics.

**Requires Authentication: admin**

---

## Medical Records Endpoints

### GET /api/referrals
Get referrals (filtered by user role).

### POST /api/referrals
Create new referral.

### GET /api/referrals/:id
Get single referral details.

### PUT /api/referrals/:id
Update referral.

### GET /api/records
Get medical records.

### POST /api/records
Create medical record.

### GET /api/records/:id
Get single record.

### GET /api/patients
Get patients list.

### GET /api/patients/:id
Get patient details.

---

## Admin Endpoints

### GET /api/admin/stats
Get system statistics.

**Requires Authentication: admin**

**Response:**
```json
{
  "users": {
    "total": 1250,
    "byRole": {
      "patient": 800,
      "customer": 350,
      "pharmacy": 45,
      "healthcare_provider": 40,
      "delivery_agent": 10,
      "admin": 5
    }
  },
  "orders": {
    "total": 3400,
    "byStatus": {...}
  },
  "revenue": {
    "total": 25000000,
    "thisMonth": 5000000
  }
}
```

### GET /api/admin/users
Get all users.

**Requires Authentication: admin**

### GET /api/admin/exports/referrals
Export referrals as CSV.

**Requires Authentication: admin**

### GET /api/admin/exports/records
Export medical records as CSV.

**Requires Authentication: admin**

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**
```json
{
  "message": "Missing required fields: name, email"
}
```

**401 Unauthorized**
```json
{
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "message": "Access denied"
}
```

**404 Not Found**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "message": "Internal server error"
}
```

---

## Testing the API

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Search Medicines:**
```bash
curl http://localhost:3000/api/medicines/search?q=aspirin
```

**Create Order (with token):**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "pharmacyId":"pharm1",
    "deliveryAddress":"123 Main St",
    "items":[{"medicineId":"med1","quantity":2}]
  }'
```

### Postman Collection
Import the endpoints into Postman:
1. Create new collection "DawaLink API"
2. Set base URL variable: `{{baseUrl}}` = `http://localhost:3000`
3. Add endpoints from this documentation
4. Use environment variable `{{token}}` for authentication

---

## Rate Limiting
Currently no rate limiting implemented. To be added in production.

## Pagination
Most list endpoints support pagination:
- `limit` - Items per page (default varies by endpoint)
- `skip` - Offset for pagination
- Response includes `pagination` object with `total`, `hasMore`

## Audit Logging
All authenticated requests are automatically logged to the AuditLog collection for security and compliance tracking.
