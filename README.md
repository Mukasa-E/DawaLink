# DawaLink
Digital Patient Referral and Medical Record Management System

## Overview
DawaLink is a web platform that digitizes patient referral and medical record management for small healthcare facilities in Kenya. It enables healthcare providers (doctors, clinics, pharmacies, health centers) to securely transfer patient files, issue digital referral letters with QR codes, and give patients personal control of their medical records.

## Key Features

### For Healthcare Providers
- **Digital Referrals**: Create and send referral letters with QR codes
- **Patient Records**: Securely document consultations, diagnoses, and treatments
- **Facility Management**: Register and manage clinic/pharmacy/health center
- **Secure Access**: Role-based access control with audit logs

### For Patients
- **Personal Health Records**: Access your complete medical history
- **Referral Tracking**: View and track referrals between facilities
- **Privacy Control**: Grant or revoke access to specific providers/facilities
- **QR Code Access**: Quick access to records via secure QR codes

### For Administrators
- **Facility Verification**: Approve and manage registered facilities
- **User Management**: Oversee healthcare providers and patients
- **System Monitoring**: Audit logs and compliance tracking
- **Analytics**: Health system insights and reporting

## Technical Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Prisma ORM
- **Authentication**: JWT with role-based access control
- **QR Codes**: Secure QR code generation for referrals and records
- **Internationalization**: English and Swahili support

## Core Objectives
1. Digitize patient referral and record management
2. Allow secure transfer of patient files between facilities
3. Give patients personal control of their medical records
4. Improve continuity of care and reduce duplicate tests
5. Ensure data privacy with encryption and access controls
6. Make healthcare records affordable and scalable for small facilities

## Getting Started

### Prerequisites
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**/**pnpm**
- **MongoDB** (local or cloud - MongoDB Atlas recommended)
- **Git** for cloning repository

### Quick Start (Development)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/Mukasa-E/DawaLink.git
cd DawaLink
```

#### Step 2: Set Up Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file with your configuration
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL: MongoDB connection string
# - JWT_SECRET: A secure random string for token signing
# - CORS_ORIGIN: http://localhost:5173 (for local dev)
# - PORT: 3000
```

**Example `.env` for local development:**
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/dawalink"
JWT_SECRET="your-super-secret-jwt-key-change-this"
CORS_ORIGIN="http://localhost:5173"
PORT=3000
NODE_ENV="development"
```

#### Step 3: Initialize Database
```bash
# In backend directory
npx prisma generate
npx prisma db push
```

#### Step 4: Start Backend Server
```bash
# In backend directory
npm run dev
```
Backend will run at `http://localhost:3000` (check `/health` endpoint)

#### Step 5: Set Up Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# The .env should have:
# VITE_API_BASE_URL=http://localhost:3000/api
```

**Example `.env` for local development:**
```env
VITE_API_BASE_URL="http://localhost:3000/api"
```

#### Step 6: Start Frontend
```bash
# In frontend directory
npm run dev
```
Frontend will run at `http://localhost:5173`

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Health Check**: http://localhost:3000/health
- **OpenAPI Docs**: http://localhost:3000/api-docs

### Docker (Alternative Quick Start)
```bash
# From root directory
docker compose up --build
```
- Backend: http://localhost:3000
- MongoDB: localhost:27017 (internal)

### Production Deployment

#### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel Dashboard
3. Set Project Root: `frontend`
4. Set Environment Variable: `VITE_API_BASE_URL=https://dawalink.onrender.com/api`
5. Deploy automatically on push to main

**Live Frontend**: https://dawa-link.vercel.app

#### Backend (Render.com)
1. Push code to GitHub
2. Connect repository to Render Dashboard
3. Create new Web Service from GitHub repo
4. Set Root Directory: `backend`
5. Set Build Command: `npm ci && npm run build`
6. Set Start Command: `npm start`
7. Add Environment Variables:
   - `DATABASE_URL`: Your MongoDB connection string
   - `JWT_SECRET`: Secure random string
   - `CORS_ORIGIN`: https://dawa-link.vercel.app
   - `NODE_ENV`: production

**Live Backend**: https://dawalink.onrender.com
**Health Check**: https://dawalink.onrender.com/health

### Environment Files
Templates:
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
Copy & adapt:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## System Features & User Workflows

### 1. User Registration & Authentication
- **Register** as Patient, Healthcare Provider, or Facility Admin
- **Login** with email/password
- **JWT token** stored in browser for authenticated requests
- **Role-based access** controls who can access what

### 2. Facility Management (Facility Admin)
- Register new healthcare facility (clinic, hospital, pharmacy, etc.)
- **System Admin approves** facility before it's active
- Add healthcare providers to facility
- Manage facility medicines/inventory

### 3. Provider Approval (Facility Admin & System Admin)
- Healthcare providers register and request approval
- **Facility Admin** views pending providers in "Pending Providers" page
- **Approve or reject** providers with optional reason
- Approved providers can create referrals

### 4. Digital Referrals (Healthcare Provider)
- **Create referral** for patient to specialist/facility
- Add clinical summary, urgency level, diagnosis
- **QR code generated** for secure access
- Patient receives referral notification
- Receiving provider scans QR or views referral
- **Mark as completed** with optional notes and completion timestamp

### 5. Medical Records (Healthcare Provider & Patient)
- Create medical records for patients (consultation notes, lab results, prescriptions)
- **QR code** for quick access
- Records linked to patient profile
- **Patient authorization** controls who can view

### 6. Prescriptions & Orders (Pharmacy & Facility)
- Create prescriptions for patients
- Facilities/pharmacies fulfill orders
- Track order status (pending → fulfilled → delivered)
- Inventory management with stock tracking

### 7. Dashboard & Analytics (All Roles)
- **Patient Dashboard**: My referrals, my records, health timeline
- **Provider Dashboard**: Patient list, referral history, pending referrals
- **Facility Admin Dashboard**: Provider management, referral stats, facility overview
- **Admin Dashboard**: System-wide statistics, user management, facility approvals

### User Testing Workflow

1. **Register Facility Admin**
   - Email: `admin@facility.com` | Password: `Test@12345`
   - Create facility: "City Clinic" (Clinic type)
   - Facility is registered but needs admin approval

2. **Login as System Admin**
   - Email: `admin@dawalink.co` | Password: `Admin@12345`
   - Go to Admin Dashboard
   - Approve "City Clinic" facility

3. **Register Healthcare Provider**
   - Email: `doctor@gmail.com` | Password: `Doctor@123`
   - Select "City Clinic" as facility
   - Status: pending approval

4. **Login as Facility Admin**
   - Approve Dr. Provider in "Pending Providers" page

5. **Login as Healthcare Provider (Doctor)**
   - Navigate to "Create Referral"
   - Search for patient (or register new patient first)
   - Create referral with clinical details
   - **QR code** displayed for referral access

6. **Login as Patient**
   - View referral in "My Referrals"
   - Scan QR code to see referral details
   - Grant access to receiving facility if needed

7. **Healthcare Provider Completes Referral**
   - After seeing patient, click "Mark Completed"
   - Add optional completion notes
   - Completion timestamp recorded with provider name

### Environment Files

### Architecture Overview
| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routes | `src/routes/*` | Map HTTP endpoints to controllers, attach auth/rate limits |
| Middleware | `src/middleware/*` | Authentication, audit logging, sanitization, error handling |
| Controllers | `src/controllers/*` | Business logic, validation, DB ops, notifications |
| Database Schema | `prisma/schema.prisma` | MongoDB data model via Prisma, indexes & constraints |
| Utilities | `src/utils/*` | JWT & password helpers |
| Tests | `src/tests/*` | Jest + Supertest integration tests |

Transactional integrity: `ordersController.createOrder` runs inside a Prisma transaction to atomically validate stock, create order, decrement inventory, and notify.

### Scripts & Tooling
| Purpose | Command |
|---------|---------|
| Dev backend | `npm run dev` |
| Smoke script | `npm run smoke:phase1` |
| Test suite | `npm test` |
| Lint check | `npm run lint` |
| Lint fix | `npm run lint:fix` |
| Prisma generate | `npx prisma generate` |

### Testing
Stack: Jest + Supertest. Coverage includes prescriptions, orders (transaction), facility medicines (CSV + duplicates), referrals (QR), medical records (QR). Data is isolated per test run.
Run all tests:
```bash
cd backend
npm test
```
Smoke script (quick E2E path):
```bash
npm run smoke:phase1
```

### OpenAPI Docs
Spec: `backend/openapi.yaml`. Serve locally:
```bash
npx redoc-cli serve backend/openapi.yaml
```

### CI Pipeline
Workflow: `.github/workflows/ci.yml` – steps: checkout → setup Node → env → install → Prisma generate → type check → lint → tests.

### Security Hardening Implemented
- Helmet for security headers
- Rate limiting (200 requests / 15 min under `/api/`)
- XSS sanitization middleware
- Body size limits (200kb JSON)
- Zod validation on create endpoints (orders, prescriptions, facility medicines, referrals, records)
- Central error handler normalizing responses
- Audit logging of request metadata

### Performance & Data Integrity
- Compound indexes: `Prescription (facilityId,status,createdAt)`, `Order (facilityId,status)`
- Composite unique constraint: `FacilityMedicine (facilityName, name)` prevents duplicates
- Transactional order creation to avoid race conditions

### Future Enhancements (Suggested)
- Swagger / Redoc UI deployment
- Demo seed script
- Email/SMS notifications delivery
- Analytics dashboards & reporting

### Status Summary
All core phases implemented: security, validation, transactional logic, tests (11 passing), documentation, CI, Docker environment, linting & formatting.

## User Roles

- **Patient**: Access personal health records, view referrals, manage privacy
- **Healthcare Provider**: Create records, issue referrals, view authorized patient data
- **Facility Admin**: Manage facility, oversee providers, facility-level reports
- **System Admin**: Platform administration, facility verification, system monitoring

## Security Features
- End-to-end encryption for sensitive data
- Role-based access control (RBAC)
- Audit logs for all data access and modifications
- Patient consent management
- Secure QR codes with expiration
- HTTPS/TLS communication

## Compliance
- Designed for Kenyan healthcare regulations
- HIPAA-aligned privacy practices
- Audit trail for compliance reporting
- Data retention policies

## Contributing
Contributions welcome – see `CONTRIBUTING.md` for workflow, commit conventions, and testing standards.

## License
MIT License - see LICENSE file for details

## Support
For issues, questions, or support, please contact: support@dawalink.co.ke
