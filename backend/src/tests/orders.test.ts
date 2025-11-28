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

describe('Order transactional flow', () => {
  it('creates prescription, order and enforces stock atomicity', async () => {
    const fa = await registerFacilityAdmin();
    const faToken = fa.token;

    // Add medicine
    const medRes = await request(app)
      .post('/api/facility-medicines')
      .set('Authorization', `Bearer ${faToken}`)
      .send({ name: 'TestMed 250mg', category: 'Antibiotic', stock: 10, price: 5, requiresPrescription: true });
    expect(medRes.status).toBe(201);
    const medicine = medRes.body;

    const patient = await registerPatient();
    const patientToken = patient.token;

    // Create prescription
    const rxRes = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${faToken}`)
      .send({
        patientId: patient.user.id,
        facilityId: fa.facility?.id,
        diagnosis: 'Test Diagnosis',
        medicines: [{ facilityMedicineId: medicine.id, dosage: '250mg', frequency: 'BID', duration: '3 days' }]
      });
    expect(rxRes.status).toBe(201);
    const prescription = rxRes.body;

    // Create order (quantity 2)
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ facilityId: fa.facility?.id, prescriptionId: prescription.id, items: [{ facilityMedicineId: medicine.id, quantity: 2 }] });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.totalAmount).toBe(10);

    // Fetch medicines and assert stock 8
    const medsRes = await request(app)
      .get(`/api/facility-medicines/${encodeURIComponent(fa.facility?.name || '')}`)
      .set('Authorization', `Bearer ${faToken}`);
    expect(medsRes.status).toBe(200);
    const updatedMed = medsRes.body.find((m: any) => m.id === medicine.id);
    expect(updatedMed.stock).toBe(8);

    // Attempt over-stock order quantity 1000 -> fail, stock unchanged
    const overRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ facilityId: fa.facility?.id, items: [{ facilityMedicineId: medicine.id, quantity: 1000 }] });
    expect(overRes.status).toBe(400);

    const medsAfterFail = await request(app)
      .get(`/api/facility-medicines/${encodeURIComponent(fa.facility?.name || '')}`)
      .set('Authorization', `Bearer ${faToken}`);
    const medAfterFail = medsAfterFail.body.find((m: any) => m.id === medicine.id);
    expect(medAfterFail.stock).toBe(8);
  });
});
