# DawaLink Frontend

Digital Patient Referral and Record System - Frontend Application

## Overview

DawaLink is a web platform designed to modernize patient referrals and medical record management by providing a secure, affordable, and mobile-friendly digital platform. The system connects clinics, hospitals, and diagnostic centers so patients and health professionals can access referrals and medical histories seamlessly.

## Features

### Core Features
- **User Authentication**: Login and registration with role-based access control
- **Digital Referrals**: Create, view, and manage digital referral letters with QR codes
- **Medical Records**: View and manage medical records with secure access control
- **Patient Portal**: Patients can access their own medical records and referrals
- **Healthcare Provider Dashboard**: Providers can create referrals, view patient history, and manage records
- **Admin Dashboard**: System statistics and user management
- **Multi-language Support**: English and Swahili (Kiswahili)
- **Mobile-First Design**: Responsive design optimized for mobile devices

### User Roles
- **Patient**: Access personal medical records and referrals
- **Healthcare Provider**: Create referrals, view authorized patient records, manage medical records
- **Admin**: System administration, user management, and statistics

## Tech Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Routing
- **Tailwind CSS**: Styling
- **React Hook Form**: Form handling
- **Axios**: HTTP client
- **i18next**: Internationalization
- **QRCode.react**: QR code generation
- **Lucide React**: Icons
- **date-fns**: Date formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx       # Main layout with sidebar
│   │   └── ProtectedRoute.tsx  # Route protection
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── i18n/               # Internationalization
│   │   ├── config.ts       # i18n configuration
│   │   └── locales/        # Translation files
│   ├── pages/              # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Referrals.tsx
│   │   ├── Records.tsx
│   │   ├── Patients.tsx
│   │   └── Admin.tsx
│   ├── services/           # API services
│   │   └── api.ts          # API client
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Integration

The frontend is configured to work with a RESTful API. The API base URL can be configured via environment variables:

- Default: `http://localhost:3000/api`
- Set via: `VITE_API_BASE_URL` environment variable

### API Endpoints Expected

The frontend expects the following API structure:

- `/auth/login` - POST - User login
- `/auth/register` - POST - User registration
- `/auth/me` - GET - Get current user
- `/referrals` - GET/POST - List/create referrals
- `/referrals/:id` - GET - Get referral details
- `/referrals/:id/qr` - GET - Get QR code
- `/records` - GET/POST - List/create records
- `/records/:id` - GET - Get record details
- `/patients/search` - GET - Search patients
- `/patients/:id` - GET - Get patient details
- `/patients/:id/authorize` - POST/DELETE - Manage access
- `/admin/stats` - GET - System statistics
- `/admin/users` - GET - List users

## Features in Detail

### Authentication
- Secure login and registration
- Role-based access control
- Token-based authentication
- Protected routes

### Referrals
- Create digital referral letters
- QR code generation for referrals
- View referral details
- Track referral status
- Search and filter referrals

### Medical Records
- View medical records
- Create new records (providers only)
- Record types: Consultation, Test Result, Prescription, Diagnosis, Other
- Secure access control
- Patient history view

### Patient Management
- Search patients
- View patient details
- Access medical history
- Authorize/revoke provider access

### Admin Dashboard
- System statistics
- User management
- Facility management
- Activity monitoring

## Internationalization

The application supports two languages:
- **English** (default)
- **Swahili** (Kiswahili)

Users can switch languages using the language selector in the sidebar.

## Mobile-First Design

The application is designed with a mobile-first approach:
- Responsive layout
- Mobile-friendly navigation
- Touch-optimized controls
- Optimized for small screens

## Security Features

- HTTPS support (configured in production)
- Token-based authentication
- Role-based access control
- Protected routes
- Secure API communication

## Development

### Linting

```bash
npm run lint
```

### Type Checking

TypeScript is configured with strict mode. Check types:

```bash
npx tsc --noEmit
```

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add translations for new UI text
4. Test on mobile devices
5. Ensure accessibility

## License

Copyright © 2025 Zamadi Tech

## Notes

- The frontend is designed to work with a backend API
- All API calls are configured to use the base URL from environment variables
- Mock data can be used for development when the backend is not available
- The application follows the SRS document requirements

