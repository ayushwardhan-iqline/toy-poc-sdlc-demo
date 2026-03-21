import { test, expect } from './fixtures';

test('has title', async ({ page, authenticatedUser }) => {
  // Using the `authenticatedUser` fixture automatically guarantees 
  // the page starts logged in before executing this script!
  await page.goto('/');

  // Expect h1 to contain a substring.
  // Using locator assertions instead of extracting innerText manually is best practice.
  await expect(page.locator('h1')).toContainText('Welcome');
});
