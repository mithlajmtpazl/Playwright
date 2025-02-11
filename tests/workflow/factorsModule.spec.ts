
const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config')


test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Field Factors Module Tests complete', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas = [];
  let fieldFactors = [];
  let formulaFactors = [];

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

  test.beforeEach(async ({ request }) => {
    console.log('Fetching factor data from API...');
    const response = await request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, { timeout: 10000 });
    expect(response.ok()).toBeTruthy(); // Ensure API call is successful

    const responseBody = await response.json();
    fieldFactors = responseBody.factorList.filter(factor => factor.factor_type === 'field');
    formulaFactors = responseBody.factorList.filter(factor => factor.factor_type === 'formula');

    console.log('Field Factors:', fieldFactors.map(factor => factor.factor_name));
    console.log('Formula Factors:', formulaFactors.map(factor => factor.factor_name));
  });

  // Complete Form Submission Test
  test('Adding Factor ', async ({ page }) => {
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

  test('form submission with formula factor and dropdown functionality', async ({ page, request }) => {
    // Navigate to the page
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

    // Select the first function
    const firstOption = data.functions[0]; // Assuming the API returns objects with a 'value' field
    const mainDropdown = page.locator('#formula-functions');
    await mainDropdown.selectOption({ value: firstOption });
    const selectedValue = await mainDropdown.inputValue();
    expect(selectedValue).toBe(firstOption);
    console.log(`Selected option: ${selectedValue}`);

    // Fetch dependent dropdown data
    const parametersResponse = await request.get(`${backendUrl}/getParameters/${firstOption}`);
    const parametersData = await parametersResponse.json();
    expect(parametersData).toHaveProperty('parameters');
    console.log('Parameters fetched successfully:', parametersData.parameters);

    // Select values for dependent dropdowns
    const dependentDropdown1 = page.locator('#formula-parameters').first();
    const dependentDropdown2 = page.locator('#formula-parameters').nth(1);
    const dropdownValue1 = parametersData.availableFactorTypes[0].input_schema_id.toString();
    const dropdownValue2 = parametersData.availableFactorTypes[1].input_schema_id.toString();

    await dependentDropdown1.selectOption({ value: dropdownValue1 });
    await dependentDropdown2.selectOption({ value: dropdownValue2 });

    const dependentDropdownText1 = await parametersData.availableFactorTypes[0].value
    const dependentDropdownText2 = await parametersData.availableFactorTypes[1].value

    console.log(dependentDropdownText1)


    // Save the form
    await page.getByRole('button', { name: 'save Save' }).click();

    // Verify success message and redirection
    await expect(page.getByText('Saved successfully')).toBeVisible();
    await page.waitForURL(`${baseUrl}/listoffactors`);

    // Verify the new factor is visible in the list
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();

    // Refresh the list and verify the factor
    await page.reload(); // Reload the page to refresh the list
    await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
    console.log('Factor is visible after refresh.');

    // Click the newly added factor and verify details
    await page.locator(`text=${sampleFactorName}`).click();

    // Check visibility of the selected formula function
    const formulaFunctionText = page.getByText(selectedValue);
    const para1Text = page.getByText(dependentDropdownText1);
    const para2Text = page.getByText(dependentDropdownText2);
    await expect(formulaFunctionText).toBeVisible({ timeout: 10000 });
    await expect(para1Text).toBeVisible({ timeout: 10000 });
    await expect(para2Text).toBeVisible({ timeout: 10000 });

    console.log('Selected parameter and function are correctly displayed.');
  });


test('Edit field factors and verify uploaded data', async ({ page }) => {
    console.log('Navigating to field factors page...');
    await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });

    // Validate and click on the first field factor
    const factorName = fieldFactors[0].factor_name;
    console.log(`Looking for field factor: ${factorName}`);
    const factorLocator = page.locator(`text=| ${factorName}`);
    await expect(factorLocator).toBeVisible({ timeout: 5000 });
    console.log('Field factor is visible, clicking on it...');
    await factorLocator.click();

    // Wait for the page to navigate to the factor details
    const expectedUrl = `${baseUrl}/listoffactors/${fieldFactors[0].factor_type_id}`;
    console.log(`Waiting for URL to change to: ${expectedUrl}`);
    await page.waitForURL(expectedUrl, { timeout: 10000 });

    // Upload the file
    console.log('Uploading file...');
    await page.getByRole('button', { name: 'Upload' }).click();
    const filePath = path.resolve(__dirname, '../../assets/Proc_smaple_codes.xlsx');
    await page.setInputFiles('#fileInput', filePath);
    await page.getByRole('button', { name: 'Upload' }).click();

    // Verify the upload success message
    console.log('Verifying upload success message...');
    await expect(page.getByText('File uploaded successfully')).toBeVisible({ timeout: 5000 });
    console.log('File uploaded successfully and verified.');
  });

  // Test for editing formula factors
  test('Edit formula factors and navigate to details page', async ({ page }) => {
    console.log('Navigating to formula factors page...');
    await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });

    // Validate and click on the first formula factor
    const factorName = formulaFactors[0].factor_name;
    console.log(`Looking for formula factor: ${factorName}`);
    const factorLocator = page.locator(`text=| ${factorName}`);
    await expect(factorLocator).toBeVisible({ timeout: 5000 });
    console.log('Formula factor is visible, clicking on it...');
    await factorLocator.click();

    // Wait for the page to navigate to the factor details
    const expectedUrl = `${baseUrl}/listoffactors/${formulaFactors[0].factor_type_id}`;
    console.log(`Waiting for URL to change to: ${expectedUrl}`);
    await page.waitForURL(expectedUrl, { timeout: 10000 });
    console.log('Navigated to formula factor details page successfully.');
// Locate the factor name on the new page
const factorNameOnDetailsPage = page.locator('text=' + factorName); // Adjust the locator as needed
await expect(factorNameOnDetailsPage).toBeVisible();


  });
});
