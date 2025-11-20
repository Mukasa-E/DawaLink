# DawaLink Backend API

Backend API for DawaLink - Digital Patient Referral and Record System

## Overview

This is the backend API server for DawaLink, providing RESTful endpoints for authentication, referrals, medical records, patient management, and administration.

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Primary database (via Prisma)
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Features

- ✅ User authentication (login, register)
- ✅ Role-based access control (Patient, Healthcare Provider, Admin)
- ✅ Digital referrals management
- ✅ Medical records management
- ✅ Patient search and authorization
- ✅ Admin dashboard statistics
- ✅ Secure API endpoints
- ✅ JWT token authentication

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dawalink?schema=public
CORS_ORIGIN=http://localhost:5173
```

5. Initialize database and start the development server:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Referrals

- `GET /api/referrals` - Get all referrals (requires auth)
- `GET /api/referrals/:id` - Get referral by ID (requires auth)
- `POST /api/referrals` - Create referral (requires auth, provider/admin)
- `PUT /api/referrals/:id` - Update referral (requires auth)
- `GET /api/referrals/:id/qr` - Get QR code for referral (requires auth)

### Medical Records

- `GET /api/records` - Get all records (requires auth)
- `GET /api/records/:id` - Get record by ID (requires auth)
- `POST /api/records` - Create record (requires auth, provider/admin)
- `PUT /api/records/:id` - Update record (requires auth)

### Patients

- `GET /api/patients/search?q=query` - Search patients (requires auth, provider/admin)
- `GET /api/patients/:id` - Get patient by ID (requires auth, provider/admin)
- `POST /api/patients/:id/authorize` - Authorize access to patient (requires auth, provider/admin)
- `DELETE /api/patients/:id/authorize/:providerId` - Revoke access (requires auth, provider/admin)

### Admin

- `GET /api/admin/stats` - Get system statistics (requires auth, admin)
- `GET /api/admin/users` - Get all users (requires auth, admin)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the login endpoint and are valid for 7 days.

## Database Schema

The database is managed by Prisma and initializes with the following models:

- **User** - User accounts
- **Referral** - Referral letters
- **MedicalRecord** - Medical records
- **PatientAuthorization** - Provider access authorizations

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `DATABASE_PATH` - Path to SQLite database file
- `CORS_ORIGIN` - Frontend URL for CORS

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── database/        # Database setup
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── index.ts         # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- SQL injection protection (prepared statements)
- CORS configuration
- Input validation

## Development

The server uses `tsx` for hot-reloading during development. Changes to TypeScript files will automatically restart the server.

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Set environment variables in production environment

3. Start the server:
```bash
npm start
```

## Notes

- The database is SQLite by default for simplicity
- In production, consider switching to PostgreSQL or MySQL
- Change the JWT_SECRET in production
- Enable HTTPS in production
- Consider adding rate limiting for production

## License

Copyright © 2025 Zamadi Tech

