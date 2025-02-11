const { test, expect } = require('@playwright/test');

test('Login with email and password', async ({ page }) => {
  // Navigate to the login page
  await page.goto('http://localhost:5173/login'); // Replace with your actual login page URL

  // Fill in the email field
  await page.fill('input[type="text"]', 'mt@gmail.com');

  // Fill in the password field
  await page.fill('input[type="password"]', 'mt@123');

  // Click tdhe login button
  await page.click('button[type="submit"]');

  // Wait for navigation or any other action after login
  await page.waitForNavigation();

  // Assert that the user is redirected to the home page or any other expected page
  await expect(page).toHaveURL('http://localhost:3000/'); // Replace with your expected URL after login

  // Optionally, you can check for a specific element on the home page to confirm successful login
  await expect(page.locator('some-element-on-home-page')).toBeVisible(); // Replace with an actual element selector
});