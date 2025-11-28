import dotenv from 'dotenv';
import { buildApp } from './server';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = buildApp();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DawaLink Patient Referral & Records System API`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

