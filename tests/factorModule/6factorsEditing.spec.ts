import { userInfo } from "os";

  const { test, expect } = require('@playwright/test');
  const path = require('path');
  const config = require('./../configureModule/config');
  const fs = require('fs');

  /**
   * Factors Editing Functional Tests
   *
   * Tests for editing field and formula factors, including uploading files and verifying factor details.
   */
  test.describe('Factors Editing Functional Tests', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;
      let fieldFactors = [];
      let formulaFactors = [];
      const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));
      const token = tokenData.token;

    // Fetch factors data before each test
    test.beforeEach(async ({ request }) => {
      console.log('Fetching factor data from API...');
      const response = await request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      expect(response.ok()).toBeTruthy(); // Ensure API call is successful

      const responseBody = await response.json();
      fieldFactors = responseBody.factorList.filter(factor => factor.factor_type === 'field');
      formulaFactors = responseBody.factorList.filter(factor => factor.factor_type === 'formula');

      console.log('Field Factors:', fieldFactors.map(factor => factor.factor_name));
      console.log('Formula Factors:', formulaFactors.map(factor => factor.factor_name));
    });

    // Test for editing field factors
    test('TC-018 Edit field factors and verify uploaded data', async ({ page, request }) => {
      console.log('Test started: TC-018 Edit field factors and verify uploaded data');
      
      // Step 1: Navigate to the field factors page
      console.log('Navigating to field factors page...');
      const startTime = Date.now();
      await page.goto(`${baseUrl}/listoffactors`);
      console.log(`Page navigation took ${Date.now() - startTime}ms`);
      console.log('Current URL after navigation:', page.url());
      
      // Step 2: Validate and click on the first field factor
      const factorName = fieldFactors[0]?.factor_name;
      console.log(`Looking for field factor: "${factorName}"`);
      
      if (!factorName) {
          console.error('Error: fieldFactors[0].factor_name is undefined or null!');
          return;
      }
      
      const factorLocator = page.locator(`text=| ${factorName}`);
      await expect(factorLocator).toBeVisible({ timeout: 5000 });
      console.log('Field factor is visible, clicking on it...');
      await factorLocator.click();
      console.log('Click action performed on the field factor');
      
      // Step 3: Wait for the page to navigate to the factor details
      const expectedUrl = `${baseUrl}/editfactor/${fieldFactors[0]?.factor_type_id}`;
      console.log(`Expected URL after clicking: ${expectedUrl}`);
      
      try {
          await page.waitForURL(expectedUrl, { timeout: 10000 });
          console.log('Successfully navigated to the expected URL:', page.url());
      } catch (error) {
          console.error('Navigation to the expected URL failed!', error);
          console.log('Current URL:', page.url());
          return;
      }
      
      // Step 4: Upload the file
      console.log('Uploading file...');
      const uploadButton = page.getByRole('button', { name: 'Upload' });
      await expect(uploadButton).toBeVisible({ timeout: 5000 });
      console.log('Upload button is visible, clicking it...');
      await uploadButton.click();
      
      const filePath = path.resolve(__dirname, '../../assets/Proc_smaple_codes.xlsx');
      console.log('Resolved file path:', filePath);
      
      const fileInput = page.locator('#fileInput');
      await expect(fileInput).toBeVisible({ timeout: 5000 });
      console.log('File input is visible, setting file...');
      await fileInput.setInputFiles(filePath);
      
      await page.getByRole('button', { name: 'Upload' }).click();
      console.log('Upload button clicked again after setting the file');
      
      // Add await here
      await page.waitForTimeout(3000);
      
      // Step 5: Verify the upload success message
      console.log('Verifying upload success message...');
      const successMessage = page.getByText('File uploaded successfully');
      await expect(successMessage).toBeVisible();
      
      // Add a final success log
      console.log('File uploaded successfully and success message verified.');
      console.log('Test completed successfully: TC-018 Edit field factors and verify uploaded data');
  });
    

    // Test for editing formula factors

test('TC-019 Edit formula factors and navigate to details page', async ({ page, request }) => {
    console.log('Test started: TC-019 Edit formula factors and navigate to details page');

    // Step 1: Call API to fetch the factor list
    console.log('Calling API to fetch factor list...');
    const factorListApiResponse = await request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
    });
    const factorListData = await factorListApiResponse.json();

    if (factorListApiResponse.status() !== 200 || !factorListData.factorList || factorListData.factorList.length === 0) {
        console.error('Failed to fetch factor list from API');
        return;
    }

    console.log('Factor list fetched successfully:', factorListData);

    // Step 2: Extract a formula factor from the factor list
    const formulaFactor = factorListData.factorList.find(factor => factor.factor_type === 'formula');
    if (!formulaFactor) {
        console.error('No formula factor found in the response');
        return;
    }

    console.log('Selected formula factor:', formulaFactor.factor_name);

    // Store the factor_type_id for later use
    const factorTypeId = formulaFactor.factor_type_id;

    // Step 3: Call API to fetch parameters for the selected formula factor
    console.log('Calling API to fetch formula parameters...');
    const apiResponse = await request.get(`${backendUrl}/getParameter/${factorTypeId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
    });
    const apiData = await apiResponse.json();

    if (apiResponse.status() !== 200 || !apiData.parameter) {
        console.error('Failed to fetch formula factors from API');
        return;
    }

    console.log('API response received:', apiData);

    // Extract available parameters
    const availableParams = apiData.availableFactorTypes.map(param => param.value);
    console.log('Extracted available parameters:', availableParams);
    const selectedparams = apiData.parameter.formula_params_mapping
    const parsedSelectedParams = JSON.parse(JSON.parse(selectedparams))
    const usedIdArray = parsedSelectedParams.map(item => item.id);
    const openToUseParameters = apiData.availableFactorTypes.filter(item => !usedIdArray.includes(item.input_schema_id));
    console.log('Open to use parameters:', openToUseParameters)

    // Step 4: Navigate to formula factors page
    console.log('Navigating to formula factors page...');
    await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });
    console.log('Current URL after navigation:', page.url());

    // Step 5: Validate and click on the first formula factor
    const factorName = apiData.parameter.factor_name; // Use API data for factor name
    console.log(`Looking for formula factor: "${factorName}"`);

    const factorLocator = page.locator(`text=${factorName}`);
    await expect(factorLocator).toBeVisible({ timeout: 5000 });
    console.log('Formula factor is visible, clicking on it...');
    await factorLocator.click();

    // Step 6: Wait for navigation to details page
    const expectedUrl = `${baseUrl}/editfactor/${apiData.parameter.factor_type_id}`;
    console.log(`Waiting for URL to change to: ${expectedUrl}`);
    await page.waitForURL(expectedUrl, { timeout: 10000 });
    console.log('Navigated to formula factor details page successfully.');

    // Step 7: Verify factor name on details page
    const factorNameOnDetailsPage = page.locator(`text=${factorName}`);
    await expect(factorNameOnDetailsPage).toBeVisible();
    console.log('Verified formula factor name on the details page.');

    // Step 8: Edit formula parameters
    console.log('Clicking on the first formula edit icon...');
    const formulaEditIcon = await page.locator('#formulaEditIcon').first();
    await expect(formulaEditIcon).toBeVisible({ timeout: 5000 });
    await formulaEditIcon.click()

    console.log('Clicking on the parameters dropdown...');
    const paramsDropdown = await page.locator('#params-dropdown1').first();
    await expect(paramsDropdown).toBeVisible({ timeout: 5000 });
    await paramsDropdown.click();
    await page.waitForTimeout(1000); // Give some time for UI to update




if (openToUseParameters.length > 0) {
    const randomParam = openToUseParameters[0].value; // Select the first available parameter
    console.log(`Selecting available parameter: ${randomParam}`);

    await paramsDropdown.selectOption({ label: randomParam });

    console.log(`Clicked on parameter: ${randomParam}`);
} else {
    console.log("No open-to-use parameters available.");
}
console.log('Clicking on the second parameters dropdown...');
const paramsDropdown2 = await page.locator('#params-dropdown1').nth(1);
await expect(paramsDropdown2).toBeVisible({ timeout: 5000 });
await paramsDropdown2.click();
await page.waitForTimeout(1000); // Give some time for UI to update

if (openToUseParameters.length > 0) {
const randomParam = openToUseParameters[1].value; // Select the first available parameter
console.log(`Selecting available parameter: ${randomParam}`);

await paramsDropdown.selectOption({ label: randomParam });

console.log(`Clicked on parameter: ${randomParam}`);
} else {
console.log("No open-to-use parameters available.");
}

await page.getByRole('button', { name: 'save Save' }).click();

const successMessage = page.getByText('Updated successfully');
await expect(successMessage).toBeVisible();

});

  
  });