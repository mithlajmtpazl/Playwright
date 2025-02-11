import { Console } from "console";

const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

const baseUrl = config.baseUrl;
const backendUrl = config.backendUrl;

test.describe('Formula Factors Module Tests', () => {
  test('TC-013 - form submission with formula factor and dropdown functionality', async ({ page, request }) => {
    // Navigate to the page
    await page.goto(`${baseUrl}/addfactors`);

    const token = await page.evaluate(() => localStorage.getItem('token')); // Ensure this matches your app's token key
    if (!token) {
        console.error('Authentication token not found in localStorage.');
        test.fail('No authentication token found. Test cannot proceed.');
        return;
    }

    // Fetch data from the API
    const response = await request.get(`${backendUrl}/getAllFunctions`,{
      headers: {
        Authorization: `Bearer ${token}`,  // Include Bearer token in API request
        'Content-Type': 'application/json',
    },
    });
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
    const parametersResponse = await request.get(`${backendUrl}/getParameters/${firstOption}`,{
      headers: {
        Authorization: `Bearer ${token}`,  // Include Bearer token in API request
        'Content-Type': 'application/json',
    },
    });
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
    await page.waitForURL(`${baseUrl}/listoffactors`,{
      headers: {
        Authorization: `Bearer ${token}`,  // Include Bearer token in API request
        'Content-Type': 'application/json',
    },
    });

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
});
