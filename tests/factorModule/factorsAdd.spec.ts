
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
  test('TC-009 - form submission with file upload', async ({ page }) => {
    const sampleFactorName = `Factor_${Date.now()}`;
  
    // Step 1: Fill required fields
    console.log('Filling out the Name and Description fields...');
    await page.getByPlaceholder('Name').fill(sampleFactorName);
    await page.waitForTimeout(500); // Pause for observation
    await page.getByPlaceholder('Description').fill('Test Description');
    await page.waitForTimeout(500); // Pause for observation
  
    // Step 2: Select a schema
    console.log('Selecting a schema...');
    if (availableSchemas.length > 0) {
      await page.getByText('Select the Schema').click();
      await page.waitForTimeout(500); // Pause for observation
      await page.getByText(availableSchemas[0].value).click();
      await page.waitForTimeout(500); // Pause for observation
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
    await page.waitForTimeout(500); // Pause for observation
  
    // Verify file upload success
    console.log('Verifying file upload success...');
    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
    await page.waitForTimeout(500); // Pause for observation
  
    // Step 4: Submit the form
    console.log('Submitting the form...');
    await page.getByRole('button', { name: 'save Save' }).click();
    await page.waitForTimeout(500); // Pause for observation
  
    // Verify success message and redirection
    console.log('Verifying success message and redirection...');
    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);
    await page.waitForTimeout(500); // Pause for observation
  
    // Verify the new factor is visible in the list
    console.log('Verifying the new factor is visible in the list...');
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
    await page.waitForTimeout(500); // Pause for observation
  
    // Verify using backend API
    console.log('Verifying with backend API...');
    const response = await page.request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);
    expect(response.ok()).toBeTruthy(); // Ensure the response status is 200 or OK
    const responseData = await response.json();
  
    expect(responseData.message).toBe('Fetching the factor list is successful');
    const factors = responseData.factorList;
    expect(factors).toContainEqual(
      expect.objectContaining({
        factor_name: sampleFactorName,
      })
    );
    await page.waitForTimeout(500); // Pause for observation
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();

  
    // Refresh the page and verify again
    console.log('Refreshing the page to verify persistence...');
    await page.reload();
    await page.waitForTimeout(1000); // Pause for observation
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
  

  test('form submission with formula factor and dropdown functionality', async ({ page, request }) => {
    await page.goto(`${baseUrl}/addfactors`);

    // Fetch data from the API
    const response = await request.get(`${backendUrl}/getAllFunctions`);
    const data = await response.json();
    
    // Validate the API response
    expect(data).toHaveProperty('functions');
    expect(data.functions.length).toBeGreaterThan(0);
    console.log('Functions fetched successfully:', data.functions);

    // Fill out the basic form fields
    const sampleFactorName = `Factor_${Date.now()}`;
    await page.getByPlaceholder('Name').fill(sampleFactorName);
    await page.getByPlaceholder('Description').fill('Test Description');
    await page.locator('#formula').check();

    // Step 1: Open the main dropdown
    const mainDropdown = page.locator('#formula-functions');
    // await mainDropdown.click();
    await expect(mainDropdown).toBeVisible(); // Verify the dropdown is displayed

    // Step 2: Select the first option from the main dropdown
    const firstOption = data.functions[0]; // Assuming the API returns objects with a 'value' field
    await mainDropdown.selectOption({ value: firstOption });

    // Step 3: Verify the selected option
    const selectedValue = await mainDropdown.inputValue(); // Get the current value of the dropdown
    expect(selectedValue).toBe(firstOption);
    console.log(`Selected option: ${selectedValue}`);

    await page.waitForTimeout(5000);



    // Verify dependent dropdowns are displayed
    const parametersResponse = await request.get(`${backendUrl}/getParameters/${firstOption}`)
    const parametersData = await parametersResponse.json();

    expect(parametersData).toHaveProperty('parameters');
    console.log('Parameters fetched successfully:', parametersData.parameters[0].name);

    
    const firstParameterName = parametersData.parameters[0].name;
    console.log(`First parameter name from API: ${firstParameterName}`);
    

    // // Check if the name is present anywhere on the page
    const dependentDropdown1 =await page.locator('#formula-parameters').first();
    await expect(dependentDropdown1).toBeVisible();






    expect(parametersData).toHaveProperty('availableFactorTypes');
    expect(parametersData.availableFactorTypes.length).toBeGreaterThan(0);
    console.log('Available Factor Types:', parametersData.availableFactorTypes);





    const dependentDropdown2 = await page.locator('#formula-parameters').nth(1);
    await expect(dependentDropdown2).toBeVisible();
    await expect(dependentDropdown2).toBeVisible();
    console.log('Dependent dropdowns are displayed');
    const dropdownValue1 = parametersData.availableFactorTypes[0].input_schema_id
    const dropdownValue2 = parametersData.availableFactorTypes[1].input_schema_id

    await dependentDropdown1.selectOption({ value: dropdownValue1.toString()});
    await dependentDropdown2.selectOption({ value: dropdownValue2.toString()});

    await page.getByRole('button', { name: 'save Save' }).click();

    // Verify success message and redirection
    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);

    // Verify the new factor is visible in the list
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible(); 

        const response1 = await page.request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);
    expect(response1.ok()).toBeTruthy(); // Ensure the response1 status is 200 or OK
const responseData = await response1.json();

expect(responseData.message).toBe('Fetching the factor list is successful');
const factors = responseData.factorList
expect(factors).toContainEqual(
  expect.objectContaining({
    factor_name: sampleFactorName,
  })
);
});
});
