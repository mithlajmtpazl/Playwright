import exp from "constants";

const { test, expect } = require('@playwright/test');

test.describe('Adding a New Factor Test', () => {
  const baseUrl = 'http://localhost:5173';

  test('should redirect to addfactors route, display form, and save factor', async ({ page }) => {
    // Navigate to the Add Factor page
    await page.goto(`${baseUrl}/listoffactors`);
    console.log('navigated to list of factors');

    // await page.click()
    await page.getByRole('button', { name: 'Add Factor' }).click();
    // await page.click('button:has-text("Add Factor")');
    console.log('clicked on add factor button');

    await expect(page).toHaveURL(`${baseUrl}/addfactors`);
    console.log('Verified redirection to the addfactors route.');

    // await page.getByRole('heading', { name: 'Factors' }).click();
    // await page.getByText('Select the Schema').click();
    // await page.locator('body').press('AudioVolumeMute');
    // await page.getByText('Select the Schema').click();
    // await page.getByRole('button', { name: 'save Save' }).click();
  });


});