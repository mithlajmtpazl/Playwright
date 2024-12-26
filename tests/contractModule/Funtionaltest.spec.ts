const { test, expect } = require('@playwright/test');
const axios = require('axios');
const config = require('./../configureModule/config');

// Test suite
test.describe('Contract Compare Module Test', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;

  // Helper function to escape CSS selectors
  const escapeCSS = (id) => id.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');

  test('validate dynamic headers and items after checkbox selection', async ({ page, request }) => {
    console.log('Starting test: Validate headers and items after checkbox selection');

    // Navigate to the compare page
    await page.goto(`${baseUrl}/compare`);
    console.log('Navigated to compare page.');

    // Verify the initial table presence
    const tableLocator = page.locator('table');
    await expect(tableLocator).toBeVisible();
    console.log('Initial table is visible.');

    // Fetch contracts data
    const contractResponse = await request.get(`${backendUrl}/contracts/get-all-latest-contracts?searchQuery=`, { timeout: 10000 });
    expect(contractResponse.ok()).toBeTruthy();
    const contracts = (await contractResponse.json()).data.contracts;
    console.log('Fetched contracts:', contracts);

    // Select the first contract by clicking its checkbox
    const firstContract = contracts[0];
    console.log(`Selecting first contract: ${firstContract.name}`);
    const contractCheckboxLocator = page.locator(`#${escapeCSS(firstContract.name)} input[type="checkbox"]`);
    await contractCheckboxLocator.check();
    expect(await contractCheckboxLocator.isChecked()).toBeTruthy();
    console.log(`Checkbox for contract "${firstContract.name}" is checked.`);

    // Wait for the new header to appear in the table
    const newHeaderLocator = page.locator(`thead >> text=${firstContract.name}`);
    await expect(newHeaderLocator).toBeVisible();
    console.log(`New header "${firstContract.name}" is visible.`);

    // Fetch services for the selected contract
    const serviceResponse = await request.post(
      `${backendUrl}/contracts/get-all-contracts-configuration`,
      {
        data: { contractId: [firstContract.contract_version_id] },
      }
    );
    expect(serviceResponse.ok()).toBeTruthy();
    const contractService = await serviceResponse.json();
    const contractServices = contractService.data;
    console.log('Fetched services for the selected contract:', contractServices);

    // Validate items in the table rows match the new header
    for (const service of contractServices) {
      console.log(`Validating service: ${service.service_id}`);

      // Locate the row corresponding to the service ID
      const rowLocator = page.locator(`tbody tr:has(#${escapeCSS(service.service_id)})`);
      await expect(rowLocator).toBeVisible();
      console.log(`Row for service ID ${service.service_id} is visible.`);

      // Verify true values are reflected in the respective `<td>` elements
      const validKeys = Object.entries(service)
        .filter(([key, value]) => typeof value === 'boolean' && value)
        .map(([key]) => key);

      console.log(`Valid keys for service ID ${service.service_id}:`, validKeys);

      for (const key of validKeys) {
        const cellLocator = rowLocator.locator(`td:has-text("${key}")`);
        console.log(`Checking if key "${key}" is displayed correctly.`);
        await expect(cellLocator).toBeVisible();
      }
    }

    console.log('Successfully validated headers and items for the selected contract.');
  });
});
