import request from 'supertest';
import { app } from '../server';

function unique() { return Date.now() + '_' + Math.random().toString(36).slice(2,8); }

interface RegisterRes { token: string; user: any; facility?: any }

async function registerProvider() {
  const u = unique();
  const res = await request(app).post('/api/auth/register').send({
    email: `provider_${u}@test.local`,
    password: 'Passw0rd!',
    name: 'Dr Provider',
    role: 'healthcare_provider'
  });
  expect(res.status).toBe(201);
  return res.body as RegisterRes;
}

async function registerPatient() {
  const u = unique();
  const res = await request(app).post('/api/auth/register').send({
    email: `pt_${u}@test.local`,
    password: 'Passw0rd!',
    name: 'Patient Test',
    role: 'patient'
  });
  expect(res.status).toBe(201);
  return res.body as RegisterRes;
}

async function registerFacilityAdmin() {
  const u = unique();
  const res = await request(app).post('/api/auth/register').send({
    email: `fa_${u}@test.local`,
    password: 'Passw0rd!',
    name: 'FA Test',
    role: 'facility_admin',
    facilityName: `Test Facility ${u}`,
    facilityType: 'clinic',
    registrationNumber: `REG-${u}`,
    facilityPhone: '+123456789',
    facilityEmail: `facility_${u}@test.local`,
    address: 'Test Address',
    city: 'TestCity',
    services: 'consultation'
  });
  expect(res.status).toBe(201);
  return res.body as RegisterRes;
}

describe('Referrals API', () => {
  it('creates referral with QR code and lists it', async () => {
    const fa = await registerFacilityAdmin();
    const patient = await registerPatient();

    // Assign provider to facility by updating user (simplified for test)
    const createRes = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({
        patientId: patient.user.id,
        reason: 'Specialist consultation needed',
        clinicalSummary: 'Patient has persistent symptoms requiring specialist review',
        urgencyLevel: 'routine'
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.referralNumber).toBeTruthy();
    expect(createRes.body.qrCode).toBeTruthy();
    expect(createRes.body.status).toBe('pending');

    const refId = createRes.body.id;

    // List referrals (patient should see it)
    const listRes = await request(app)
      .get('/api/referrals')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(listRes.status).toBe(200);
    const found = listRes.body.find((r: any) => r.id === refId);
    expect(found).toBeTruthy();
  });

  it('rejects referral without required fields', async () => {
    const fa = await registerFacilityAdmin();
    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({ patientId: 'test' }); // missing reason, clinicalSummary
    expect(res.status).toBe(400);
  });
});
