const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config');

// Utility functions
async function navigateToAddFactorsPage(page, baseUrl) {
  console.log('Navigating to Add Factors page...');
  await page.goto(`${baseUrl}/addfactors`, { timeout: 60000 });
  console.log('Add Factors page loaded successfully.');
}

async function uploadFile(page, filePath) {
  console.log('Uploading file from path:', filePath);
  await page.getByRole('button', { name: 'Upload' }).click();
  await page.setInputFiles('#fileInput', filePath);
}

async function fillCommonFields(page, name, description) {
  console.log(`Filling out common fields: Name - ${name}, Description - ${description}`);
  await page.getByPlaceholder('Name').fill(name);
  await page.getByPlaceholder('Description').fill(description);
}

// Test Suite
test.describe('Adding a New Factor - Negative Test Cases', () => {
  const baseUrl = config.baseUrl;

  test('TC-004 - Should handle oversized file uploads gracefully', async ({ page }) => {
    await navigateToAddFactorsPage(page, baseUrl);

    const oversizedFilePath = path.resolve(__dirname, '../../assets/oversized_file.xlsx');
    await uploadFile(page, oversizedFilePath);

    await expect(page.getByText('File is too large')).toBeVisible({ timeout: 5000 });
    console.log('Error message for oversized file is displayed.');
  });

  test('TC-005 - Should show an error for invalid file upload', async ({ page }) => {
    await navigateToAddFactorsPage(page, baseUrl);

    const invalidFilePath = path.resolve(
      __dirname,
      '../../assets/a-fail-pass-checkbox-with-red-fail-checked-WPHN08.webp'
    );
    await uploadFile(page, invalidFilePath);

    await expect(page.getByText('Only xlsx and csv files are allowed.')).toBeVisible({ timeout: 5000 });
    console.log('Error message for invalid file format is displayed.');
  });

  test('TC-006 - Should throw an error when required fields are empty', async ({ page }) => {
    await navigateToAddFactorsPage(page, baseUrl);

    await page.getByRole('button', { name: 'save Save' }).click();
    console.log('Clicked Save button without filling required fields.');

    await expect(page.getByText('Please fill all the required fields.')).toBeVisible({ timeout: 5000 });
    console.log('Validation error message is displayed for empty fields.');
  });

  test('TC-007 - Should throw an error for invalid schema selection', async ({ page }) => {
    await navigateToAddFactorsPage(page, baseUrl);

    const sampleFactorName = `Factor_${Date.now()}`;
    await fillCommonFields(page, sampleFactorName, 'Test Description');

    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
    await uploadFile(page, filePath);
  await page.getByRole('button', { name: 'Upload' }).click();

    await page.getByRole('button', { name: 'save Save' }).click();
    await expect(page.getByText('Please fill all the required fields.')).toBeVisible({ timeout: 5000 });
    console.log('Validation error message is displayed for invalid schema selection.');
  });

  test.describe('Adding with inappropriate date', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;
    let allSchema = [];
    let usedSchema = [];
    let availableSchemas = [];
  
    // Fetch schemas and factors before each test
    test.beforeEach(async ({ page }) => {
      // Intercept and fetch the existing factor name

  
      // Intercept schema-related APIs
      await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
        const response = await route.fetch();
        const data = await response.json();
        allSchema = data.schemas || [];
        route.continue();
      });
  
      await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
        const response = await route.fetch();
        const data = await response.json();
        usedSchema = data.selectedInputSchema || [];
        route.continue();
      });
  
      // Navigate to the pages
      await page.goto(`${baseUrl}/listoffactors`);
      await page.goto(`${baseUrl}/addfactors`);
      await page.waitForResponse(`${backendUrl}/getAllSchemas`);
      await page.waitForResponse(`${backendUrl}/getSelectedInputSchema`);
  
      // Calculate available schemas
      availableSchemas = allSchema.filter(
        (schema) =>
          !usedSchema.some(
            (used) => parseInt(used.primary_mapping, 10) === schema.input_schema_id
          )
      );
    });
  
    test('should display an error when expiry date is earlier than start date', async ({ page }) => {
      // Navigate to the add factors page
      await page.goto(`${baseUrl}/addfactors`);
  
      // Step 1: Fill required fields
      const sampleFactorName = `InvalidDateFactor_${Date.now()}`;
      await page.getByPlaceholder('Name').fill(sampleFactorName);
      await page.getByPlaceholder('Description').fill('Test Description for invalid date');
  
      // Step 2: Select a schema
      if (availableSchemas.length > 0) {
          await page.getByText('Select the Schema').click();
          await page.getByText(availableSchemas[0].value).click();
      } else {
          console.error('No schemas available for selection.');
          test.fail('No schemas available. Test cannot proceed.');
          return;
      }
  
      // Step 3: Upload a file
      const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
      await page.getByRole('button', { name: 'Upload' }).click();
      await page.setInputFiles('#fileInput', filePath);
  
      // Verify file upload success
      await page.getByRole('button', { name: 'Upload' }).click();
      await expect(page.getByText('File uploaded successfully')).toBeVisible();
  
      // Step 4: Set invalid dates
      const invalidStartDate = '2024-12-31'; // Future date
      const invalidExpiryDate = '2024-12-01'; // Earlier than start date
  
      await page.locator('input[name="effective_from_date"]').fill(invalidStartDate);
      await page.locator('input[name="effective_to_date"]').fill(invalidExpiryDate);
  
      // Step 5: Submit the form
        await page.getByRole('button', { name: 'save Save' }).click(); 
      // Step 6: Validate the error message
      const errorMessage = await page.locator('text=Effective to date should be greater than effective from date'); // Adjustthe actual error message
      await expect(errorMessage).toBeVisible();
  
      console.log('Verified: Error message is displayed for invalid date selection.');
  });
  });
  
});
