const { test, expect } = require('@playwright/test');
const path = require('path');

const { chromium } = require('playwright');


test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action

});




test.describe('Adding a New Factor Test', () => {
  const baseUrl = 'http://localhost:5173';
  const backendUrl = 'http://localhost:3000';
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas:any;

  test('should redirect to addfactors route, display form, and save factor', async ({ page }) => {
    // Intercept the getAllSchemas API
    await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
      const response = await route.fetch();
      const responseData = await response.json();
      allSchema = responseData.schemas; // Save all schemas
      route.continue();
    });
  
    // await page.waitForTimeout(1000); // Delay for 1 second
  
    // Intercept the getSelectedInputSchema API
    await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
      const response = await route.fetch();
      const responseData = await response.json();
      usedSchema = responseData.selectedInputSchema; // Save used schemas
      route.continue();
    });
  
    // await page.waitForTimeout(1000); // Delay for 1 second
  
    // Navigate to the page and trigger necessary actions
    await page.goto(`${baseUrl}/listoffactors`);
    await page.waitForTimeout(1000); // Delay for 1 second
    await page.getByRole('button', { name: 'Add Factor' }).click();
    // await page.waitForTimeout(1000); // Delay for 1 second
    await expect(page).toHaveURL(`${baseUrl}/addfactors`);
    // await page.waitForTimeout(1000); // Delay for 1 second
  
    // Wait for the API responses
    await page.waitForResponse(`${backendUrl}/getAllSchemas`);
    // await page.waitForTimeout(1000); // Delay for 1 second
    await page.waitForResponse(`${backendUrl}/getSelectedInputSchema`);
  
    // Step 4: Calculate available schemas
    availableSchemas = allSchema.filter(
      (schema) =>
        !usedSchema.some(
          (used) => parseInt(used.primary_mapping) === schema.input_schema_id
        )
    );
  
    await page.waitForTimeout(1000); // Delay for 1 second
  
    // Verify the form is displayed
    const heading = page.getByRole('heading', { name: 'Factors' });
    await expect(heading).toBeVisible();
    await page.waitForTimeout(1000); // Delay for 1 second
  
    // Fill out the form with valid data
    await page.getByPlaceholder('Name').fill('hey its third test');
    await page.waitForTimeout(1000); // Delay for 1 second
    await page.getByPlaceholder('Description').fill('test Description');
    await page.waitForTimeout(1000); // Delay for 1 second
  
    // Open the "Select the Schema" dropdown and check for available schemas
    await page.getByText('Select the Schema').click();
    await page.waitForTimeout(1000); // Delay for 1 second
    if (availableSchemas.length > 0) {
      await page.getByText(availableSchemas[0].value).click();
    } else {
      console.log('No available schemas for selection.');
    }
  
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
    await page.waitForTimeout(1000); // Delay for 1 second
    await page.getByRole('button', { name: 'Upload' }).click();
    await page.setInputFiles('#fileInput', filePath); // Use the ID selector
    await page.waitForTimeout(1000); // Delay for 1 second
    await page.getByRole('button', { name: 'Upload' }).click();
  
    await page.waitForTimeout(1000); // Delay for 1 second
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
    await page.waitForTimeout(1000); // Delay for 1 second
    await page.getByRole('button', { name: 'save Save' }).click();
    await page.waitForTimeout(1000); // Delay for 1 second
    

    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);

    // Verify success message is displayed
  });
  
});
