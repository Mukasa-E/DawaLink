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
- Node.js (v18 or higher)
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dawalink.git
cd dawalink
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment variables:
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="your_mongodb_connection_string"
JWT_SECRET="your_secure_jwt_secret"
PORT=5000
```

5. Initialize the database:
```bash
cd backend
npx prisma generate
npx prisma db push
```

6. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

### Docker (Optional Quick Start)
Run backend + MongoDB together:
```bash
docker compose up --build
```
Backend: http://localhost:3000 (health check `/health`).

### Environment Files
Templates:
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
Copy & adapt:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

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
