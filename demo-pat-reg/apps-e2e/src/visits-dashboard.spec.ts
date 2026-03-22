import { patients, visits } from '@demo-pat-reg/shared';
import { randNumber, randPhoneNumber, randUuid } from '@ngneat/falso';

import { expect, test } from './fixtures';

/**
 * IQ-002 – Recent Visits Dashboard
 *
 * Strategy: each test inserts its OWN rows and verifies ONLY those rows.
 * This keeps the suite hermetic regardless of what `db:seed` (the dev seed)
 * has inserted previously.
 */
test.describe('IQ-002 – Recent Visits Dashboard', () => {
  test('displays recent visits on the dashboard', async ({ page, db }) => {
    page.on('console', msg => console.log(`[CHROMIUM] ${msg.text()}`));
    
    const testPatient = {
      id: randUuid(),
      salutation: 'Mr.' as const,
      name: `Patient-${randNumber({ min: 1000, max: 9999 })}`,
      gender: 'Male',
      phoneNumber: (randPhoneNumber({ countryCode: 'IN' }) ?? '+91-9999999999') as string,
      address: 'Test City',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(patients as any).values(testPatient);

    const testVisit = {
      id: randUuid(),
      visitNumber: `VISIT-${randNumber({ min: 1000, max: 9999 })}`,
      status: 'registered',
      type: 'consultation',
      patientId: testPatient.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(visits as any).values(testVisit);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Recent Visits' })).toBeVisible();
    
    // Check table displays the seeded patient row explicitly
    await expect(page.getByRole('table')).toBeVisible();
    const patientRow = page.getByRole('row', { name: testPatient.name });
    await expect(patientRow).toBeVisible({ timeout: 10000 });
    await expect(patientRow.getByRole('cell', { name: 'registered' })).toBeVisible();
  });

  test('filters visits by search term', async ({ page, db }) => {
    const p1 = { id: randUuid(), salutation: 'Mr.' as const, name: `Alpha-${randNumber({ min: 1000, max: 9999 })}`, gender: 'Male', phoneNumber: '+91-9999999991', address: 'City', createdAt: new Date(), updatedAt: new Date() };
    const p2 = { id: randUuid(), salutation: 'Ms.' as const, name: `Beta-${randNumber({ min: 1000, max: 9999 })}`, gender: 'Female', phoneNumber: '+91-9999999992', address: 'City', createdAt: new Date(), updatedAt: new Date() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(patients as any).values([p1, p2]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(visits as any).values([
      { id: randUuid(), visitNumber: `VISIT-A`, status: 'registered', type: 'consultation', patientId: p1.id, createdAt: new Date(), updatedAt: new Date() },
      { id: randUuid(), visitNumber: `VISIT-B`, status: 'registered', type: 'consultation', patientId: p2.id, createdAt: new Date(), updatedAt: new Date() }
    ]);

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

