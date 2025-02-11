// fixtures.js
const { test } = require('@playwright/test');

// Define a custom fixture for authenticated context
const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the login page
    await page.goto('http://localhost:3000/login');

    // Fill in the login form
    await page.fill('input[type="text"]', 'mithlaj');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Wait for navigation to the home page
    await page.waitForURL('http://localhost:3000/');

    // Use the authenticated page in tests
    await use(page);

    // Clean up
    await context.close();
  },
});

module.exports = test;