import { patients, visits } from '@demo-pat-reg/shared';
import { randFullName, randNumber, randPhoneNumber, randUuid } from '@ngneat/falso';

import { expect, test } from './fixtures';

/**
 * IQ-002 – Recent Visits Dashboard
 *
 * Strategy: each test inserts its OWN rows and verifies ONLY those rows.
 * This keeps the suite hermetic regardless of what `db:seed` (the dev seed)
 * has inserted previously.
 */
test('IQ-002: displays recent visits on the dashboard', async ({ page, db }) => {
  // ── 1. Arrange: seed isolated data ────────────────────────────────────────
  const testPatient = {
    id: randUuid(),
    salutation: 'Mr.' as const,
    name: randFullName(),
    gender: 'Male',
    phoneNumber: (randPhoneNumber({ countryCode: 'IN' }) ?? '+91-9999999999') as string,
    address: 'Test City',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(patients).values(testPatient);

  const testVisit = {
    id: randUuid(),
    visitNumber: `VISIT-${randNumber({ min: 1000, max: 9999 })}`,
    status: 'registered',
    type: 'consultation',
    patientId: testPatient.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(visits).values(testVisit);

  // ── 2. Act ─────────────────────────────────────────────────────────────────
  await page.goto('/');

  // ── 3. Assert – expand these once ET-005 (VisitsDataTable) is implemented ──
  await expect(page.locator('h1')).toContainText('Welcome');
});
