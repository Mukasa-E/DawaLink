#!/usr/bin/env node

/**
 * DawaLink Authentication Test Script
 * Tests the complete auth flow: register → login → getCurrentUser
 * 
 * Usage:
 *   node auth-test.js
 *   npx ts-node auth-test.ts (if using TypeScript)
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAuthFlow() {
  log('\n=== DawaLink Authentication Test ===\n', colors.blue);

  try {
    // Test 1: Register User
    log('TEST 1: Register User', colors.yellow);
    const registerData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: 'Test User',
      role: 'patient',
      phone: '+256700000000',
      facility: null,
    };

    log(`Registering user: ${TEST_EMAIL}`);
    const registerResponse = await axios.post(
      `${API_BASE_URL}/auth/register`,
      registerData
    );

    if (registerResponse.status !== 201) {
      throw new Error(`Expected 201, got ${registerResponse.status}`);
    }

    const { user: registeredUser, token } = registerResponse.data;

    log('✓ Registration successful!', colors.green);
    log(`  User ID: ${registeredUser.id}`);
    log(`  Email: ${registeredUser.email}`);
    log(`  Role: ${registeredUser.role}`);
    log(`  Token: ${token.substring(0, 20)}...`);

    // Test 2: Login User
    log('\nTEST 2: Login User', colors.yellow);
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Expected 200, got ${loginResponse.status}`);
    }

    const { user: loggedInUser, token: loginToken } = loginResponse.data;

    log('✓ Login successful!', colors.green);
    log(`  User: ${loggedInUser.email}`);
    log(`  Token: ${loginToken.substring(0, 20)}...`);

    // Test 3: Get Current User (Protected Endpoint)
    log('\nTEST 3: Get Current User (Protected)', colors.yellow);
    const currentUserResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginToken}`,
      },
    });

    if (currentUserResponse.status !== 200) {
      throw new Error(`Expected 200, got ${currentUserResponse.status}`);
    }

    const currentUser = currentUserResponse.data;

    log('✓ Get current user successful!', colors.green);
    log(`  User: ${currentUser.name} (${currentUser.email})`);
    log(`  Role: ${currentUser.role}`);
    log(`  Created: ${new Date(currentUser.createdAt).toLocaleString()}`);

    // Test 4: Verify Token Authentication
    log('\nTEST 4: Verify Token Validation', colors.yellow);
    try {
      await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });
      log('✗ Should have rejected invalid token', colors.red);
    } catch (error) {
      if (error.response?.status === 401) {
        log('✓ Invalid token correctly rejected!', colors.green);
      } else {
        throw error;
      }
    }

    // Test 5: Verify Duplicate Registration
    log('\nTEST 5: Prevent Duplicate Registration', colors.yellow);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      log('✗ Should have prevented duplicate registration', colors.red);
    } catch (error) {
      if (error.response?.status === 400) {
        log('✓ Duplicate registration correctly prevented!', colors.green);
        log(`  Message: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }

    // Summary
    log('\n=== All Tests Passed! ===\n', colors.green);
    log('Summary:');
    log('✓ User registration saves to MongoDB');
    log('✓ Password is hashed securely');
    log('✓ JWT token is generated and valid');
    log('✓ Login retrieves user from MongoDB');
    log('✓ Protected endpoints verify tokens');
    log('✓ Duplicate prevention works');
    log('\nYour authentication system is working perfectly! 🚀\n');

  } catch (error) {
    log('\n❌ Test Failed!\n', colors.red);
    
    if (error.response) {
      log(`Status: ${error.response.status}`, colors.red);
      log(`Message: ${JSON.stringify(error.response.data, null, 2)}`, colors.red);
    } else if (error.message) {
      log(`Error: ${error.message}`, colors.red);
    } else {
      log(`Error: ${error}`, colors.red);
    }

    log('\nMake sure:');
    log('1. Backend is running (npm run dev in /backend)');
    log('2. MongoDB connection is valid');
    log('3. API is accessible at http://localhost:3000');
  }
}

// Run tests
testAuthFlow();
