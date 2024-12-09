const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Adding a New Factor Test', () => {
  const baseUrl = 'http://localhost:5173';
  const backendUrl = 'http://localhost:3000/api';
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas;

  test('should redirect to addfactors route, display form, and save factor', async ({ page }) => {
    try {
      console.log('Starting test: Adding a New Factor Test');

      // Intercept the getAllSchemas API
      await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
        const response = await route.fetch();
        const responseData = await response.json();
        allSchema = responseData.schemas; // Save all schemas
        console.log('All schemas fetched:', allSchema);
        route.continue();
      });

      // Intercept the getSelectedInputSchema API
      await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
        const response = await route.fetch();
        const responseData = await response.json();
        usedSchema = responseData.selectedInputSchema; // Save used schemas
        console.log('Used schemas fetched:', usedSchema);
        route.continue();
      });

      // Navigate to the page and trigger necessary actions
      console.log('Navigating to listoffactors page...');
      await page.goto(`${baseUrl}/listoffactors`);
      await page.waitForTimeout(1000); // Delay for 1 second
      await page.getByRole('button', { name: 'Add Factor' }).click();
      await expect(page).toHaveURL(`${baseUrl}/addfactors`);

      // Wait for the API responses
      await page.waitForResponse(`${backendUrl}/getAllSchemas`);
      console.log('Received response for getAllSchemas API');
      await page.waitForResponse(`${backendUrl}/getSelectedInputSchema`);
      console.log('Received response for getSelectedInputSchema API');

      // Calculate available schemas
      availableSchemas = allSchema.filter(
        (schema) =>
          !usedSchema.some(
            (used) => parseInt(used.primary_mapping) === schema.input_schema_id
          )
      );
      console.log('Available schemas:', availableSchemas);

      // Verify the form is displayed
      const heading = page.getByRole('heading', { name: 'Factors' });
      await expect(heading).toBeVisible();
      console.log('Factors form is visible.');

      // Fill out the form with valid data
      const sampleFactorName = Date.now().toString();
      console.log('Filling out form with Factor Name:', sampleFactorName);
      await page.getByPlaceholder('Name').fill(sampleFactorName);
      await page.getByPlaceholder('Description').fill('test Description');

      // Open the "Select the Schema" dropdown and check for available schemas
      console.log('Selecting a schema...');
      await page.getByText('Select the Schema').click();
      if (availableSchemas.length > 0) {
        await page.getByText(availableSchemas[0].value).click();
        console.log('Selected schema:', availableSchemas[0].value);
      } else {
        console.log(
          'No available schemas for selection. Test cannot proceed. Please ensure there are valid schemas to select.'
        );
        test.fail('No available schemas for selection. Ensure valid schemas are present.');
        return;
      }

      // Upload a file
      const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
      console.log('Uploading file from path:', filePath);
      await page.getByRole('button', { name: 'Upload' }).click();
      await page.setInputFiles('#fileInput', filePath);
      await page.getByRole('button', { name: 'Upload' }).click();
      console.log('File uploaded.');

      // Verify file upload success message
      await expect(page.getByText('File uploaded successfully')).toBeVisible();
      console.log('File upload success message displayed.');

      // Save the factor
      await page.getByRole('button', { name: 'save Save' }).click();
      console.log('Save button clicked.');

      await expect(page.getByText('Saved successfully')).toBeVisible();
      console.log('Save success message displayed.');

      await page.waitForURL(`${baseUrl}/listoffactors`);
      console.log('Redirected to listoffactors page.');

      // Verify the newly created factor is visible
      await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
      console.log('Newly created factor is visible:', sampleFactorName);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error; // Re-throw the error for Playwright to mark the test as failed
    }
  });
});
