# DawaLink Setup Guide

Complete setup instructions for DawaLink - Digital Patient Referral and Record System

## Quick Start

### 1. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the `backend` directory:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dawalink?schema=public
CORS_ORIGIN=http://localhost:5173
```

4. Initialize Prisma and start the backend server:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The backend will be running at `http://localhost:3000`

### 2. Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will be running at `http://localhost:5173`

## Testing the Application

### 1. Register a New User

1. Go to `http://localhost:5173`
2. Click "Register"
3. Fill in the form:
   - Name: Your name
   - Email: your@email.com
   - Password: (at least 6 characters)
   - Role: Select your role (Patient, Healthcare Provider, or Admin)
   - Phone: (optional)
   - Facility: (required for Healthcare Provider/Admin)

4. Click "Register"

### 2. Login

1. Go to `http://localhost:5173/login`
2. Enter your email and password
3. Click "Login"

### 3. Test Features

**As a Patient:**
- View your dashboard
- View your medical records
- View your referrals

**As a Healthcare Provider:**
- Create referrals
- Create medical records
- Search for patients
- View patient history (with authorization)

**As an Admin:**
- View system statistics
- Manage users
- Access all features

## Troubleshooting

### Backend won't start

- Make sure Node.js 18+ is installed
- Check that port 3000 is not in use
- Verify `.env` file exists in backend directory
- Check console for error messages

### Frontend can't connect to backend

- Verify backend is running on port 3000
- Check `VITE_API_BASE_URL` in frontend `.env` file
- Check CORS settings in backend `.env` file
- Open browser console for error messages

### Database errors

- The database file (`database.sqlite`) is created automatically
- If you need to reset, delete `database.sqlite` and restart the backend
- Make sure you have write permissions in the backend directory

### Authentication errors

- Make sure JWT_SECRET is set in backend `.env`
- Clear browser localStorage and try again
- Check that tokens are being sent in request headers

## Production Deployment

### Backend

1. Build the project:
```bash
cd backend
npm run build
```

2. Set production environment variables
3. Start with:
```bash
npm start
```

### Frontend

1. Build the project:
```bash
cd frontend
npm run build
```

2. Serve the `dist` folder with a web server (nginx, Apache, etc.)

## Environment Variables

### Backend (.env)

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `DATABASE_PATH` - Path to SQLite database file
- `CORS_ORIGIN` - Frontend URL for CORS

### Frontend (.env)

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3000/api)

## Notes

- The database is SQLite by default for simplicity
- In production, consider switching to PostgreSQL or MySQL
- Change the JWT_SECRET in production
- Enable HTTPS in production
- Consider adding rate limiting for production

## Support

For issues or questions, refer to the README files in the backend and frontend directories.

