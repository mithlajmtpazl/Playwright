
const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config')


test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

const baseUrl = config.baseUrl
const backendUrl = config.backendUrl

test.describe('Formula Factors Module Tests', () => {  

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
  
      // Select the first function
      const firstOption = data.functions[0]; // Assuming the API returns objects with a 'value' field
      const mainDropdown = page.locator('#formula-functions');
      await mainDropdown.selectOption({ value: firstOption });
      const selectedValue = await mainDropdown.inputValue();
      expect(selectedValue).toBe(firstOption);
      console.log(`Selected option: ${selectedValue}`);
  
      // Verify dependent dropdowns
      const parametersResponse = await request.get(`${backendUrl}/getParameters/${firstOption}`);
      const parametersData = await parametersResponse.json();
      expect(parametersData).toHaveProperty('parameters');
      console.log('Parameters fetched successfully:', parametersData.parameters[0].name);
  
      const dependentDropdown1 = await page.locator('#formula-parameters').first();
      const dependentDropdown2 = await page.locator('#formula-parameters').nth(1);
  
      const dropdownValue1 = parametersData.availableFactorTypes[0].input_schema_id;
      const dropdownValue2 = parametersData.availableFactorTypes[1].input_schema_id;
  
      await dependentDropdown1.selectOption({ value: dropdownValue1.toString() });
      await dependentDropdown2.selectOption({ value: dropdownValue2.toString() });
  
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
      
// Check visibility of the formula-functions dropdown
const formulaFunctions = page.locator('#formula-functions');
await expect(formulaFunctions).toBeVisible({ timeout: 10000 });

// Check visibility of the formula-parameters dropdowns
const parameterDropdown1 = page.locator('#formula-parameters').first();
const parameterDropdown2 = page.locator('#formula-parameters').nth(1);
await expect(parameterDropdown1).toBeVisible({ timeout: 10000 });
await expect(parameterDropdown2).toBeVisible({ timeout: 10000 });

    });
  });


