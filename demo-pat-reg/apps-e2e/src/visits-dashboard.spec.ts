import { patients, visits } from '@demo-pat-reg/shared';
import { sql, type InferInsertModel } from 'drizzle-orm';
import { randNumber, randPhoneNumber, randUuid } from '@ngneat/falso';

import { expect, test } from './fixtures';

type PatientInsertRow = InferInsertModel<typeof patients>;
type VisitInsertRow = InferInsertModel<typeof visits>;

/**
 * IQ-002 – Recent Visits Dashboard
 *
 * Strategy: each test inserts its OWN rows and verifies ONLY those rows.
 * This keeps the suite hermetic regardless of what `db:seed` (the dev seed)
 * has inserted previously.
 */
test.describe('IQ-002 – Recent Visits Dashboard', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({ db }) => {
    await db.execute(sql`TRUNCATE TABLE patients CASCADE`);
  });

  test('displays recent visits on the dashboard', async ({ page, db }) => {
    const testPatient: PatientInsertRow = {
      id: randUuid(),
      salutation: 'Mr.',
      name: `Patient-${randNumber({ min: 1000, max: 9999 })}`,
      gender: 'Male',
      phoneNumber: (randPhoneNumber({ countryCode: 'IN' }) ?? '+91-9999999999') as string,
      address: 'Test City',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(patients).values(testPatient);

    const testVisit: VisitInsertRow = {
      id: randUuid(),
      visitNumber: `VISIT-${randNumber({ min: 1000, max: 9999 })}`,
      status: 'registered',
      type: 'consultation',
      patientId: testPatient.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(visits).values(testVisit);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Recent Visits' })).toBeVisible();

    // Check table displays the seeded patient row explicitly
    await expect(page.getByRole('table')).toBeVisible();
    const patientRow = page.getByRole('row', { name: testPatient.name });
    await expect(patientRow).toBeVisible({ timeout: 10000 });
    await expect(patientRow.getByRole('cell', { name: 'registered' })).toBeVisible();
  });

  test('filters visits by search term', async ({ page, db }) => {
    const p1: PatientInsertRow = {
      id: randUuid(),
      salutation: 'Mr.',
      name: `Alpha-${randNumber({ min: 1000, max: 9999 })}`,
      gender: 'Male',
      phoneNumber: '+91-9999999991',
      address: 'City',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const p2: PatientInsertRow = {
      id: randUuid(),
      salutation: 'Ms.',
      name: `Beta-${randNumber({ min: 1000, max: 9999 })}`,
      gender: 'Female',
      phoneNumber: '+91-9999999992',
      address: 'City',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(patients).values([p1, p2]);

    const visitRows: VisitInsertRow[] = [
      {
        id: randUuid(),
        visitNumber: 'VISIT-A',
        status: 'registered',
        type: 'consultation',
        patientId: p1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randUuid(),
        visitNumber: 'VISIT-B',
        status: 'registered',
        type: 'consultation',
        patientId: p2.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await db.insert(visits).values(visitRows);

    await page.goto('/');
    await expect(page.getByRole('cell', { name: p1.name })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: p2.name })).toBeVisible();

    await page.getByPlaceholder('Search visits...').fill(p1.name);

    await expect(page.getByRole('cell', { name: p1.name })).toBeVisible();
    await expect(page.getByRole('cell', { name: p2.name })).not.toBeVisible();
  });

  test('displays empty state when no visits match search', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Search visits...').fill('non-existent-search-string-xyz123');

    // Wait for debounce and result
    await expect(page.getByText('No visits match your search.')).toBeVisible({ timeout: 10000 });
  });
});
