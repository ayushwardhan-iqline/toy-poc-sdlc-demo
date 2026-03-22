/* eslint-disable no-console */
import { db, patients, visits } from '@demo-pat-reg/shared';
import {
  rand,
  randAddress,
  randFullName,
  randGender,
  randNumber,
  randPhoneNumber,
  randUuid,
} from '@ngneat/falso';

async function seed() {
  console.log('🌱 Seeding database with @ngneat/falso mock data...');

  // 1. Generate Patients
  const numPatients = 15;
  const fakePatients = Array.from({ length: numPatients }).map(() => {
    const addr = randAddress();
    return {
      id: randUuid(),
      salutation: rand(['Mr.', 'Ms.', 'Mrs.', 'Dr.']),
      name: randFullName(),
      gender: randGender(),
      phoneNumber: randPhoneNumber({ countryCode: 'IN' }) as string,
      address: `${addr.street}, ${addr.city}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  console.log(`Inserting ${numPatients} patients...`);
  await db.insert(patients).values(fakePatients);

  // 2. Generate Visits
  console.log('Inserting visits for patients...');
  const fakeVisits = fakePatients.flatMap((patient) => {
    const numVisits = randNumber({ min: 1, max: 3 });
    return Array.from({ length: numVisits }).map(() => ({
      id: randUuid(),
      visitNumber: `VISIT-${randNumber({ min: 1000, max: 9999 })}`,
      status: rand(['registered', 'completed', 'cancelled']),
      type: rand(['consultation', 'follow-up', 'emergency']),
      patientId: patient.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  await db.insert(visits).values(fakeVisits);

  console.log(`Successfully inserted ${fakeVisits.length} visits.`);
  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

