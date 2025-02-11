const { chromium } = require('@playwright/test');
const fs = require('fs');

module.exports = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the login page
  await page.goto('http://localhost:5173/login'); // Replace with your actual login URL

  // Fill in login details
  await page.fill('input[type="text"]', 'mt@gmail.com');
  await page.fill('input[type="password"]', 'mt@123');

  // Click the login button
  await page.click('button[type="submit"]');

  // Wait for navigation to confirm login success
  await page.waitForURL('http://localhost:5173/');

  // Extract the token from local storage
  const token = await page.evaluate(() => localStorage.getItem('token'));

  // Save the authentication state and token to a file
  await context.storageState({ path: 'auth.json' });

  // Save token separately for API requests
  fs.writeFileSync('token.json', JSON.stringify({ token }));

  // Close the browser
  await browser.close();
};
