import request from 'supertest';
import { app } from '../server';

function unique() { return Date.now() + '_' + Math.random().toString(36).slice(2,8); }

interface RegisterRes { token: string; user: any; facility?: any }

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

describe('Medical Records API', () => {
  it('creates record with QR code when shareableViaQR is true', async () => {
    const fa = await registerFacilityAdmin();
    const patient = await registerPatient();

    const createRes = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({
        patientId: patient.user.id,
        recordType: 'consultation',
        title: 'Annual Checkup',
        description: 'Routine physical examination',
        diagnosis: 'Healthy',
        shareableViaQR: true
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.recordNumber).toBeTruthy();
    expect(createRes.body.qrCode).toBeTruthy();

    const recordId = createRes.body.id;

    // Get record by ID
    const getRes = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe('Annual Checkup');
  });

  it('lists patient records', async () => {
    const fa = await registerFacilityAdmin();
    const patient = await registerPatient();

    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({
        patientId: patient.user.id,
        recordType: 'test_result',
        title: 'Blood Test',
        description: 'CBC results'
      });

    const listRes = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  it('rejects record creation without required fields', async () => {
    const fa = await registerFacilityAdmin();
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({ patientId: 'test' }); // missing recordType, title, description
    expect(res.status).toBe(400);
  });
});
