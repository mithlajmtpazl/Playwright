const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Factor Management: Adding a New Factor', () => {
  const baseUrl = 'http://localhost:5173';
  const backendUrl = 'http://localhost:3000';
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas;

  test('should redirect to add factors, display the form, and save a new factor', async ({ page }) => {
    console.log('Starting test: Adding a New Factor');

    // Intercept the getAllSchemas API
    await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
      console.log('Intercepting API: getAllSchemas');
      const response = await route.fetch();
      const responseData = await response.json();
      allSchema = responseData.schemas; // Save all schemas
      console.log('All schemas:', allSchema);
      route.continue();
    });

    // Intercept the getSelectedInputSchema API
    await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
      console.log('Intercepting API: getSelectedInputSchema');
      const response = await route.fetch();
      const responseData = await response.json();
      usedSchema = responseData.selectedInputSchema; // Save used schemas
      console.log('Used schemas:', usedSchema);
      route.continue();
    });

    // Navigate to the factors list and trigger navigation to add factors
    console.log('Navigating to factors list page...');
    await page.goto(`${baseUrl}/listoffactors`);
    await page.getByRole('button', { name: 'Add Factor' }).click();
    await expect(page).toHaveURL(`${baseUrl}/addfactors`);
    console.log('Redirected to add factors page');

    // Wait for the API responses
    console.log('Waiting for API responses...');
    await page.waitForResponse(`${backendUrl}/getAllSchemas`);
    await page.waitForResponse(`${backendUrl}/getSelectedInputSchema`);

    // Calculate available schemas
    console.log('Calculating available schemas...');
    availableSchemas = allSchema.filter(
      (schema) =>
        !usedSchema.some(
          (used) => parseInt(used.primary_mapping) === schema.input_schema_id
        )
    );
    console.log('Available schemas:', availableSchemas);

    // Verify the form is displayed
    console.log('Verifying form visibility...');
    const heading = page.getByRole('heading', { name: 'Factors' });
    await expect(heading).toBeVisible();

    // Fill out the form
    console.log('Filling out the form...');
    await page.getByPlaceholder('Name').fill('Sample Factor Name');
    await page.getByPlaceholder('Description').fill('Sample Description');

    // Select a schema if available
    console.log('Selecting a schema...');
    await page.getByText('Select the Schema').click();
    if (availableSchemas.length > 0) {
      console.log(`Selecting schema: ${availableSchemas[0].value}`);
      await page.getByText(availableSchemas[0].value).click();
    } else {
      console.log('No available schemas for selection.');
    }

    // Upload a file
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
    console.log('Uploading file:', filePath);
    await page.setInputFiles('#fileInput', filePath);
    await page.getByRole('button', { name: 'Upload' }).click();

    // Verify file upload
    console.log('Verifying file upload...');
    await expect(page.getByText('File uploaded successfully')).toBeVisible();

    // Save the factor
    console.log('Saving the factor...');
    await page.getByRole('button', { name: 'save Save' }).click();

    // Verify success message and redirection
    console.log('Verifying success message and redirection...');
    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);

    console.log('Test completed: Adding a New Factor');
  });
});
