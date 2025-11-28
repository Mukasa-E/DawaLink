const axios = require('axios');

async function createTestUsers() {
  const API_URL = 'http://localhost:3000/api';

  const users = [
    {
      name: 'Test Provider',
      email: 'provider@test.com',
      password: 'Test123!',
      role: 'healthcare_provider',
      phone: '+254712345678',
      facility: 'Kenyatta National Hospital',
      department: 'General Medicine'
    },
    {
      name: 'Test Patient',
      email: 'patient@test.com',
      password: 'Test123!',
      role: 'patient',
      phone: '+254712345679',
      preferredFacility: 'Kenyatta National Hospital'
    },
    {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'Test123!',
      role: 'admin',
      phone: '+254712345677'
    }
  ];

  console.log('Creating test users...\n');

  for (const userData of users) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      console.log(`✓ Created ${userData.role}: ${userData.email}`);
      console.log(`  Name: ${userData.name}`);
      console.log(`  Password: ${userData.password}`);
      console.log(`  Token: ${response.data.token.substring(0, 20)}...`);
      console.log('');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`⚠ User already exists: ${userData.email}`);
        console.log(`  You can log in with password: ${userData.password}\n`);
      } else {
        console.error(`✗ Error creating ${userData.email}:`, error.response?.data || error.message);
      }
    }
  }

  console.log('\n=== Test Accounts ===');
  console.log('Provider: provider@test.com / Test123!');
  console.log('Patient:  patient@test.com / Test123!');
  console.log('Admin:    admin@test.com / Test123!');
  console.log('\nYou can now log in at http://localhost:5174/login');
}

createTestUsers().catch(console.error);
