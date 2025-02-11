
const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config')


test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Field Factors Module Tests', () => {
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
 test('TC-009 - form submission with file upload', async ({ page, request }) => {
    const sampleFactorName = `Factor_${Date.now()}`;

    // Step 1: Fill required fields
    console.log('Filling out the Name and Description fields...');
    await page.getByPlaceholder('Name').fill(sampleFactorName);
    await page.waitForTimeout(500);
    await page.getByPlaceholder('Description').fill('Test Description');
    await page.waitForTimeout(500);

    // Step 2: Select a schema
    console.log('Selecting a schema...');
    if (availableSchemas.length > 0) {
        await page.getByText('Select the Schema').click();
        await page.waitForTimeout(500);
        await page.getByText(availableSchemas[0].value).click();
        await page.waitForTimeout(500);
    } else {
        console.error('No schemas available for selection.');
        test.fail('No schemas available. Test cannot proceed.');
        return;
    }

    // Step 3: Upload a file
    console.log('Uploading the file...');
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
    await page.getByRole('button', { name: 'Upload' }).click();
    await page.setInputFiles('#fileInput', filePath);
    await page.waitForTimeout(500);

    // Verify file upload success
    console.log('Verifying file upload success...');
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
    await page.waitForTimeout(500);

    // Step 4: Submit the form
    console.log('Submitting the form...');
    await page.getByRole('button', { name: 'save Save' }).click();
    await page.waitForTimeout(500);

    // Verify success message and redirection
    console.log('Verifying success message and redirection...');
    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);
    await page.waitForTimeout(500);

    // Verify the new factor is visible in the list
    console.log('Verifying the new factor is visible in the list...');
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
    await page.waitForTimeout(500);
    console.log('visible');

    // Step 5: Verify using backend API with Bearer Token
    console.log('Verifying with backend API...');
    const token = await page.evaluate(() => localStorage.getItem('token')); // Ensure this matches your app's token key
    if (!token) {
        console.error('Authentication token not found in localStorage.');
        test.fail('No authentication token found. Test cannot proceed.');
        return;
    }

    const response = await request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, {
        headers: {
            Authorization: `Bearer ${token}`,  // Include Bearer token in API request
            'Content-Type': 'application/json',
        },
    });

    expect(response.ok()).toBeTruthy(); // Ensure response status is 200
    const responseData = await response.json();
    console.log('API Response:', responseData);

    const factors = responseData.factorList;
    expect(factors).toContainEqual(
        expect.objectContaining({
            factor_name: sampleFactorName,
        })
    );

    // Refresh the page and verify again
    console.log('Refreshing the page to verify persistence...');
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
});

  

  // Individual Component Test: File Upload
  test('TC-010-Verify file upload independently', async ({ page }) => {
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.setInputFiles('#fileInput', filePath);

    // Verify upload success message
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
  });

  // Individual Component Test: Schema Selection
  test('TC-011 - Verify schema selection independently', async ({ page }) => {
    if (availableSchemas.length > 0) {
      await page.getByText('Select the Schema').click();
      await page.getByText(availableSchemas[0].value).click();
      await expect(page.getByText(availableSchemas[0].value)).toBeVisible();
    } else {
      console.error('No schemas available for selection.');
      test.fail('No schemas available. Test cannot proceed.');
    }
  });

  test('TC-012 - Verify behavior when no schemas are available', async ({ page }) => {
    // Mock the `getAllSchemas` response to return a list of schemas
    const mockAllSchemas = [
      { input_schema_id: 1, name: 'Schema 1' },
      { input_schema_id: 2, name: 'Schema 2' },
    ];
  
    // Mock the `getSelectedInputSchema` response to include all schemas as used
    const mockUsedSchemas = [
      { primary_mapping: '1', name: 'Schema 1' },
      { primary_mapping: '2', name: 'Schema 2' },
    ];
  
    // Intercept and mock the API calls
    await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ schemas: mockAllSchemas }),
      });
    });
  
    await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ selectedInputSchema: mockUsedSchemas }),
      });
    });
  
    // Calculate available schemas (this should result in an empty list)
    availableSchemas = mockAllSchemas.filter(
      (schema) =>
        !mockUsedSchemas.some(
          (used) => parseInt(used.primary_mapping) === schema.input_schema_id
        )
    );
  
    console.log('Available schemas:', availableSchemas);
  
    // Verify that no schemas are available and handle accordingly
    if (availableSchemas.length === 0) {
      console.log('No schemas available, verifying behavior...');
      await page.goto(`${baseUrl}/addfactors`);
      await page.getByText('Select the Schema').click();
      await expect(page.getByText('No Available Parameter')).toBeVisible();
    } else {
      console.warn('Schemas are available; skipping this test case.');
    }
  });
});
