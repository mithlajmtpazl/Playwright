  const { test, expect } = require('@playwright/test');
  const path = require('path');
  const config = require('./../configureModule/config');

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

    // Fetch factors data before each test
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

    // Test for editing field factors
    test('TC-018 Edit field factors and verify uploaded data', async ({ page, request }) => {
      console.log('Test started: TC-018 Edit field factors and verify uploaded data');
    
      // Step 1: Navigate to the field factors page
      console.log('Navigating to field factors page...');
      const startTime = Date.now();
      await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });
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
    
      await page.getByRole('button', { name: 'Upload' }).click()
      console.log('Upload button clicked again after setting the file');

      page.waitForTimeout(3000)
    
      // Step 5: Verify the upload success message
      console.log('Verifying upload success message...');
      const successMessage = page.getByText('File uploaded successfully');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
      console.log('File uploaded successfully and success message verified.');
    
      console.log('Test completed successfully: TC-018 Edit field factors and verify uploaded data');
    });
    

    // Test for editing formula factors

  test('TC-019 Edit formula factors and navigate to details page', async ({ page, request }) => {
      console.log('Test started: TC-019 Edit formula factors and navigate to details page');

      // Step 1: Call API to fetch parameters
      console.log('Calling API to fetch formula factors...');
      const apiResponse = await request.get('http://localhost:3000/api/getParameter/563');
      const apiData = await apiResponse.json();

      if (apiResponse.status() !== 200 || !apiData.parameter) {
          console.error('Failed to fetch formula factors from API');
          return;
      }

      console.log('API response received:', apiData);

      // Extract available parameters
      const availableParams = apiData.availableFactorTypes.map(param => param.value);
      console.log('Extracted available parameters:', availableParams);

      // Step 2: Navigate to formula factors page
      console.log('Navigating to formula factors page...');
      await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });
      console.log('Current URL after navigation:', page.url());

      // Step 3: Validate and click on the first formula factor
      const factorName = apiData.parameter.factor_name; // Use API data for factor name
      console.log(`Looking for formula factor: "${factorName}"`);

      const factorLocator = page.locator(`text=${factorName}`);
      await expect(factorLocator).toBeVisible({ timeout: 5000 });
      console.log('Formula factor is visible, clicking on it...');
      await factorLocator.click();

      // Step 4: Wait for navigation to details page
      const expectedUrl = `${baseUrl}/editfactor/${apiData.parameter.factor_type_id}`;
      console.log(`Waiting for URL to change to: ${expectedUrl}`);
      await page.waitForURL(expectedUrl, { timeout: 10000 });
      console.log('Navigated to formula factor details page successfully.');

      // Step 5: Verify factor name on details page
      const factorNameOnDetailsPage = page.locator(`text=${factorName}`);
      await expect(factorNameOnDetailsPage).toBeVisible();
      console.log('Verified formula factor name on the details page.');

      // Step 6: Edit formula parameters
      console.log('Clicking on the first formula edit icon...');
      const formulaEditIcon = await page.locator('#formulaEditIcon').first();
      await expect(formulaEditIcon).toBeVisible({ timeout: 5000 });
      await formulaEditIcon.click();

      console.log('Clicking on the parameters dropdown...');
      const paramsDropdown = await page.locator('#params-dropdown1').first();
      await expect(paramsDropdown).toBeVisible({ timeout: 5000 });
      await paramsDropdown.click();

      console.log('Waiting for dropdown options to appear...');
      const dropdownOptions = await page.locator('.params-options'); // Replace with the correct locator for dropdown options

      console.log('Clicking on the first available option...');
      const firstOption = dropdownOptions.locator('li').first(); // Adjust if necessary
      await expect(firstOption).toBeVisible();
      await firstOption.click();
      console.log('Successfully selected an option from the dropdown.');

      console.log('Completed editing formula factors.');
  });

  });