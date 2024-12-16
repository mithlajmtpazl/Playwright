const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config');

test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Duplicate Name Test for Factors', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas = [];
  let existingFactorName = '';

  // Fetch schemas and factors before each test
  test.beforeEach(async ({ page }) => {
    // Intercept and fetch the existing factor name
    await page.route(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, async (route) => {
      const response = await route.fetch();
      const data = await response.json();

      if (data.factorList && data.factorList.length > 0) {
        existingFactorName = data.factorList[0].factor_name; // Use the first factor name
      } else {
        console.error('No factors available in the API response.');
        route.abort(); // Abort the request if no factors are found
        return;
      }
      route.continue();
    });

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

  // Test for duplicate factor name
  test('Duplicate factor name submission test', async ({ page }) => {
    // Ensure `existingFactorName` is available
    if (!existingFactorName) {
      console.error('Existing factor name is not available. Test cannot proceed.');
      test.fail('No existing factor name fetched.');
      return;
    }
  
    // Step 1: Fill the "Name" and "Description" fields
    await page.getByPlaceholder('Name').fill(existingFactorName); // Use the existing factor name
    await page.getByPlaceholder('Description').fill('Test Description for Duplicate Name');
  
    // Step 2: Select a schema
    if (availableSchemas.length > 0) {
      console.log('Available schemas:', availableSchemas.map(schema => schema.value)); // Debug log for schemas
      await page.getByText('Select the Schema').click(); // Open the schema dropdown
      await page.getByText(availableSchemas[0].value).click(); // Select the first available schema
    } else {
      console.error('No schemas available for selection.');
      test.fail('No schemas available. Test cannot proceed.');
      return;
    }
  
    // Step 3: Upload a file
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx'); // Path to the sample file
    await page.getByRole('button', { name: 'Upload' }).click(); // Click the upload button
    await page.setInputFiles('#fileInput', filePath); // Set the input file

    await page.getByRole('button', { name: 'Upload' }).click();

  
    // Verify file upload success
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
  
    // Step 4: Submit the form
    await page.getByRole('button', { name: 'save Save' }).click(); // Click the save button
  
    // Step 5: Verify the error message for duplicate name
    await expect(page.getByText('Factor name already exists')).toBeVisible(); // Check error message visibility
  
    console.log('Duplicate factor name test passed successfully.');
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
