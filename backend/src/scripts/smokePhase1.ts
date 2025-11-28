// Phase 1 smoke test script
// Registers a facility admin, adds a medicine, registers a patient, creates a prescription, creates an order.
// NOTE: Idempotent-ish via timestamped emails. Script now self-starts server in-process for environments
// where a separate dev server isn't running concurrently.

const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000/api';

// Start server in-process if not already running
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../index');

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface RegisterResult { user: any; token: string; facility?: any }

const rand = Date.now();
const facilityAdminEmail = `fa_${rand}@test.local`;
const patientEmail = `pt_${rand}@test.local`;

async function post<T=any>(path: string, body: any, token?: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data as T;
}

async function patch<T=any>(path: string, body: any, token?: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data as T;
}
async function get<T=any>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data as T;
}

async function run() {
  console.log('--- Phase 1 Smoke Test Start ---');
  // Allow server boot
  await delay(1200);

  // 1. Register facility admin (self facility creation)
  const faReg = await post<RegisterResult>('/auth/register', {
    email: facilityAdminEmail,
    password: 'Passw0rd!',
    name: 'Facility Admin Smoke',
    role: 'facility_admin',
    facilityName: `Smoke Facility ${rand}`,
    facilityType: 'pharmacy',
    registrationNumber: `REG-${rand}`,
    facilityPhone: '+123456789',
    facilityEmail: `facility_${rand}@test.local`,
    address: 'Smoke Street',
    city: 'TestCity',
    services: 'dispensing,consultation'
  });
  console.log('Facility admin registered facilityId:', faReg.facility?.id);

  const faToken = faReg.token;

  // 2. Add a facility medicine via facility admin
  const med = await post<any>('/facility-medicines', {
    name: 'Amoxicillin 500mg',
    category: 'Antibiotic',
    stock: 50,
    price: 10.5,
    requiresPrescription: true
  }, faToken);
  console.log('Added facility medicine id:', med.id);

  // 3. Register patient
  const patientReg = await post<RegisterResult>('/auth/register', {
    email: patientEmail,
    password: 'Passw0rd!',
    name: 'Patient Smoke',
    role: 'patient'
  });
  console.log('Patient registered id:', patientReg.user.id);
  const patientToken = patientReg.token;

  // 4. Create prescription (facility admin acts as provider substitute for smoke)
  const prescription = await post<any>('/prescriptions', {
    patientId: patientReg.user.id,
    facilityId: faReg.facility?.id,
    diagnosis: 'Upper respiratory infection',
    notes: 'Take with food',
    medicines: [{ facilityMedicineId: med.id, dosage: '500mg', frequency: 'TID', duration: '5 days' }]
  }, faToken);
  console.log('Created prescription number:', prescription.prescriptionNumber);

  // 5. Patient creates order for same medicine
  const order = await post<any>('/orders', {
    facilityId: faReg.facility?.id,
    prescriptionId: prescription.id,
    items: [{ facilityMedicineId: med.id, quantity: 2 }]
  }, patientToken);
  console.log('Created order number:', order.orderNumber, 'total:', order.totalAmount);

  // 6. Facility admin updates order status to confirmed
  const updated = await patch<any>(`/orders/${order.id}/status`, { status: 'confirmed' }, faToken);
  console.log('Updated order status:', updated.status);

  // 7. Fetch lists
  const patientOrders = await get<any[]>('/orders/my', patientToken);
  console.log('Patient orders count:', patientOrders.length);
  const facilityOrders = await get<any[]>('/orders/facility', faToken);
  console.log('Facility orders count:', facilityOrders.length);
  const prescriptions = await get<any[]>('/prescriptions', faToken);
  console.log('Facility admin accessible prescriptions:', prescriptions.length);

  // 8. Verify stock decrement
  const facilityNameEncoded = encodeURIComponent(faReg.facility?.name || '');
  const medsAfter = await get<any[]>(`/facility-medicines/${facilityNameEncoded}`, faToken);
  const updatedMed = medsAfter.find(m => m.id === med.id);
  if (!updatedMed) throw new Error('Medicine missing after order');
  if (updatedMed.stock !== 48) throw new Error(`Stock decrement failed expected 48 got ${updatedMed.stock}`);
  console.log('Stock after first order OK:', updatedMed.stock);

  // 9. Attempt over-stock order (should fail & stock remain same)
  let overStockFailed = false;
  try {
    await post<any>('/orders', {
      facilityId: faReg.facility?.id,
      items: [{ facilityMedicineId: med.id, quantity: 1000 }]
    }, patientToken);
  } catch (e: any) {
    overStockFailed = true;
    console.log('Over-stock order rejected as expected');
  }
  if (!overStockFailed) throw new Error('Over-stock order unexpectedly succeeded');
  const medsAfterFail = await get<any[]>(`/facility-medicines/${facilityNameEncoded}`, faToken);
  const medAfterFail = medsAfterFail.find(m => m.id === med.id);
  if (medAfterFail.stock !== 48) throw new Error('Stock changed after failed order');
  console.log('Stock unchanged after failed order rollback OK');

  console.log('--- Extended Transaction & Stock Assertions Passed ---');

  console.log('--- Phase 1 + Extended Smoke Test OK ---');
}

run().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
