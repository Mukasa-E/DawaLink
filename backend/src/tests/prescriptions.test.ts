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
    facilityType: 'pharmacy',
    registrationNumber: `REG-${u}`,
    facilityPhone: '+123456789',
    facilityEmail: `facility_${u}@test.local`,
    address: 'Test Address',
    city: 'TestCity',
    services: 'dispensing'
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

describe('Prescriptions API', () => {
  it('creates, lists, and updates prescription status', async () => {
    const fa = await registerFacilityAdmin();
    const patient = await registerPatient();

    // Create prescription
    const createRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({
        patientId: patient.user.id,
        facilityId: fa.facility?.id,
        diagnosis: 'Common Cold',
        notes: 'Rest and fluids',
        medicines: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'TID', duration: '3 days' }]
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.prescriptionNumber).toBeTruthy();
    expect(createRes.body.status).toBe('draft');

    const rxId = createRes.body.id;

    // List prescriptions (facility admin should see it)
    const listRes = await request(app)
      .get('/api/prescriptions')
      .set('Authorization', `Bearer ${fa.token}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    const found = listRes.body.find((p: any) => p.id === rxId);
    expect(found).toBeTruthy();

    // Update status to issued
    const updateRes = await request(app)
      .patch(`/api/prescriptions/${rxId}/status`)
      .set('Authorization', `Bearer ${fa.token}`)
      .send({ status: 'issued' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('issued');
  });

  it('rejects prescription creation with missing fields', async () => {
    const fa = await registerFacilityAdmin();
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${fa.token}`)
      .send({ patientId: 'invalid' }); // missing facilityId
    expect(res.status).toBe(400);
  });
});
