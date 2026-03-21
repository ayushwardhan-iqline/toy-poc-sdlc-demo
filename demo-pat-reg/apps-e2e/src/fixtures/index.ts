import { test as base } from '@playwright/test';

// Define the shape of your custom fixtures
export type AppFixtures = {
  db: any; // TODO: Type this to your actual Database instance later (e.g., Drizzle DB)
  authenticatedUser: { id: string; role: string; token: string }; 
};

// Extend the basic Playwright test object with custom fixtures
// This is heavily recommended for DRY setups like Auth and mocking.
export const test = base.extend<AppFixtures>({
  
  // 1. Database Fixture
  // This fixture isolates DB setup and teardown per test or per worker.
  db: async ({}, use) => {
    // Setup: Connect to your test database
    // For example: 
    // const dbInstance = connectToDatabase(process.env.DATABASE_URL);
    // await dbInstance.execute('TRUNCATE table users CASCADE;');
    
    const mockDbInstance = { connected: true };
    console.log('[Fixture] DB Ready');
    
    // Pass the fixture to the test
    await use(mockDbInstance);
    
    // Teardown: Clean up connections after test
    console.log('[Fixture] DB Cleanup');
  },

  // 2. Authenticated User Fixture
  // Notice this fixture depends on `page` and `db` being available!
  authenticatedUser: async ({ page, db }, use) => {
    // Setup: Programmatically create a user in your DB or fetch a test user
    const user = { id: 'test-user-1', role: 'admin', token: 'mock-jwt-token' };
    
    // Inject auth state directly into the browser context (e.g. localStorage or cookies)
    // This bypasses the UI login flow so tests are extremely fast.
    await page.context().addInitScript((val) => {
      window.localStorage.setItem('auth_token', val);
    }, user.token);
    
    // You can also add cookies:
    // await page.context().addCookies([{ name: 'session', value: '...', url: 'http://localhost:4200' }]);

    console.log('[Fixture] Authenticated User Injected');
    
    // Pass the user information to the test
    await use(user);
    
    // Teardown: Remove the user from DB if necessary
  }
});

// Re-export expect so tests only need to import from this file
export { expect } from '@playwright/test';
