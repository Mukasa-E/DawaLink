import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dedupe() {
  console.log('Starting FacilityMedicine dedupe...');

  // Fetch all medicines
  const meds = await (prisma.facilityMedicine.findMany as any)({
    select: { id: true, facilityName: true, name: true, createdAt: true },
  });

  // Group by key
  const groups = new Map<string, { id: string; createdAt: Date }[]>();
  for (const m of meds) {
    const key = `${m.facilityName}||${m.name}`;
    const arr = groups.get(key) || [];
    arr.push({ id: m.id, createdAt: new Date(m.createdAt) });
    groups.set(key, arr);
  }

  let totalDuplicates = 0;
  for (const [key, arr] of groups.entries()) {
    if (arr.length > 1) {
      // Keep the earliest createdAt (or first)
      arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const keep = arr[0].id;
      const toDelete = arr.slice(1).map(a => a.id);
      totalDuplicates += toDelete.length;

      console.log(`Key ${key} has ${arr.length} entries. Keeping ${keep}, deleting ${toDelete.length}.`);
      await (prisma.facilityMedicine.deleteMany as any)({
        where: { id: { in: toDelete } },
      });
    }
  }

  console.log(`Deduplication complete. Removed ${totalDuplicates} duplicates.`);
}

(async () => {
  try {
    await dedupe();
  } catch (e) {
    console.error('Dedupe error:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
