// global-setup.js
const { chromium } = require('@playwright/test');

module.exports = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the login page
  await page.goto('http://localhost:5173/login'); // Replace with your actual login page URL

  await page.fill('input[type="text"]', 'mt@gmail.com');

  // Fill in the password field
  await page.fill('input[type="password"]', 'mt@123');

  // Click tdhe login button
  await page.click('button[type="submit"]');

  // Wait for navigation to the home page (or any page after login)
  await page.waitForURL('http://localhost:5173/');

  // Save the authentication state to a file
  await context.storageState({ path: 'auth.json' });

  // Close the browser
  await browser.close();
};