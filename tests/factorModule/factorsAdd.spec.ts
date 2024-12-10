
const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config')


test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Factors Module Tests', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas = [];

  // Fetch schemas before each test
  test.beforeEach(async ({ page }) => {
    await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      allSchema = data.schemas;
      route.continue();
    });

    await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      usedSchema = data.selectedInputSchema;
      route.continue();
    });

    await page.goto(`${baseUrl}/addfactors`);
    await page.waitForResponse(`${backendUrl}/getAllSchemas`);
    await page.waitForResponse(`${backendUrl}/getSelectedInputSchema`);

    // Calculate available schemas
    availableSchemas = allSchema.filter(
      (schema) =>
        !usedSchema.some(
          (used) => parseInt(used.primary_mapping) === schema.input_schema_id
        )
    );
  });

  // Complete Form Submission Test
  test('Complete form submission with file upload', async ({ page }) => {
    const sampleFactorName = `Factor_${Date.now()}`;

    // Step 1: Fill required fields
    await page.getByPlaceholder('Name').fill(sampleFactorName);
    await page.getByPlaceholder('Description').fill('Test Description');

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

    // Step 4: Submit the form
    await page.getByRole('button', { name: 'save Save' }).click();

    // Verify success message and redirection
    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);

    // Verify the new factor is visible in the list
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
  });

  // Individual Component Test: File Upload
  test('Verify file upload independently', async ({ page }) => {
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.setInputFiles('#fileInput', filePath);

    // Verify upload success message
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
  });

  // Individual Component Test: Schema Selection
  test('Verify schema selection independently', async ({ page }) => {
    if (availableSchemas.length > 0) {
      await page.getByText('Select the Schema').click();
      await page.getByText(availableSchemas[0].value).click();
      await expect(page.getByText(availableSchemas[0].value)).toBeVisible();
    } else {
      console.error('No schemas available for selection.');
      test.fail('No schemas available. Test cannot proceed.');
    }
  });
});
