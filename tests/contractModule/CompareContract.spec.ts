const { test, expect } = require('@playwright/test');
const axios = require('axios');
const config = require('./../configureModule/config');

test.describe('Contract Compare Module Test', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;

  test('should show list of services and contracts', async ({ page, request }) => {
    // Navigate to the compare page
    await page.goto(`${baseUrl}/compare`);

    // Wait for the text "Multiple Contract View" to be visible on the page
    const contractListText = page.locator('text=Multiple Contract View');
    await expect(contractListText).toBeVisible();

    // Send a GET request to the backend API for services
    const response = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`, { timeout: 10000 });
    expect(response.ok()).toBeTruthy(); // Ensure the API call is successful

    // Parse the response data
    const responseData = await response.json();
    expect(responseData).toHaveProperty('data');
    const services = responseData.data;
    expect(services.length).toBeGreaterThan(0);

    // Send a POST request to the backend API for contracts
    const contractResponse = await request.post(
      `${backendUrl}/contracts/get-all-contracts-configuration?page=1&limit=10&initial=true&searchQuery=`,
      {
        timeout: 10000, // Timeout for the request
        data: { contractId: [] }, // Payload for the POST request
      }
    );

    expect(contractResponse.ok()).toBeTruthy(); // Ensure the API call is successful

    // Parse the response data for contracts
    const contractResponseData = await contractResponse.json();
    const contractServices = contractResponseData.data.services;

    // Iterate over the list of services
    for (const service of contractServices) {
      // Check if the service name is visible
      const serviceLocator = page.locator(`text=${service.service_name}`);
      console.log(`Checking service: ${service.service_name}`);
      await expect(serviceLocator).toBeVisible();

      // If the service has components, check each component name
      if (service.components && service.components.length > 0) {
        for (const component of service.components) {
          // Check if the component name is visible
          const componentLocator = await page.locator(`text=${component.component_name}`);
          console.log(`Checking component: ${component.component_name}`);
          await expect(componentLocator).toBeVisible();
        }
      }
    }
  });

  test('should show list of contracts and verify contract names on UI', async ({ page, request }) => {
    // Navigate to the compare page
    await page.goto(`${baseUrl}/compare`);

    // Send a GET request to the backend API for contracts
    const contractResponse = await request.get(`${backendUrl}/contracts/get-all-latest-contracts?searchQuery=`, {
      timeout: 10000,
    });

    expect(contractResponse.ok()).toBeTruthy(); // Ensure the API call is successful

    // Parse the response data for contracts
    const contractResponseData = await contractResponse.json();
    expect(contractResponseData).toHaveProperty('data');
    const contracts = contractResponseData.data.contracts;
    expect(contracts.length).toBeGreaterThan(0);

    // Check if all contract names are visible on the UI
    for (const contract of contracts) {
      const contractLocator = page.locator(`text=${contract.name}`);
      console.log(`Checking contract: ${contract.name}`);
      await expect(contractLocator).toBeVisible();
    }
  });

  test('editing contract dropdowns and verifying persistence after refresh', async ({ page, request }) => {
    // Navigate to the compare page
    await page.goto(`${baseUrl}/compare`);
  
    // Send a GET request to the backend API for contracts
    const contractResponse = await request.get(`${backendUrl}/contracts/get-all-latest-contracts?searchQuery=`, {
      timeout: 10000,
    });
  
    expect(contractResponse.ok()).toBeTruthy(); // Ensure the API call is successful
  
    // Parse the response data for contracts
    const contractResponseData = await contractResponse.json();
    expect(contractResponseData).toHaveProperty('data');
    const contracts = contractResponseData.data.contracts;
    expect(contracts.length).toBeGreaterThan(0);
  
    // Select the first contract to test
    const firstContract = contracts[0];
    const firstContractsData = await request.post(
      `${backendUrl}/contracts/get-all-contracts-configuration?page=1&limit=10&initial=false&searchQuery=`,
      {
        data: { contractId: [firstContract.contract_version_id] },
      }
    );
  
    // Parse the response data
    const ContractServiceData = await firstContractsData.json();
    expect(ContractServiceData.status).toBe("success");
    const contractServiceResponsibility = ContractServiceData.data.contracts;
  
    // Ensure contract services exist
    expect(contractServiceResponsibility.length).toBeGreaterThan(0);
  
    // Step 1: Check the contract checkbox to display the dropdowns
    const contractCheckboxLocator = page.locator(`#${firstContract.name}`).getByRole('checkbox');
    await contractCheckboxLocator.check(); // Check the contract checkbox
    expect(await contractCheckboxLocator.isChecked()).toBeTruthy(); // Verify the checkbox is checked
  
    console.log(`Checked contract checkbox: "${firstContract.name}"`);
  
    // Track already selected options to ensure uniqueness
    const selectedOptions = new Map();
  
    for (const service of contractServiceResponsibility) {
      // Locate the dropdown for the service
      const dropdownLocator = page.locator(`select[name="contract-${firstContract.contract_version_id}-service-${service.service_id}"]`);
  
      // Ensure the dropdown is visible after checking the checkbox
      expect(await dropdownLocator.isVisible()).toBeTruthy();
  
      // Get valid options (all keys with `false` values)
      const validOptions = Object.entries(service)
        .filter(([key, value]) => typeof value === 'boolean' && value === false)
        .map(([key]) => key);
  
      // Exclude already selected options
      const availableOptions = validOptions.filter(option => !selectedOptions.has(option));
      expect(availableOptions.length).toBeGreaterThan(0); // Ensure there's an available option
  
      // Select the first available option
      const optionToSelect = availableOptions[0];
      selectedOptions.set(service.service_id, optionToSelect); // Store selected value
      await dropdownLocator.selectOption(optionToSelect);
  
      // Verify the dropdown now has the selected value
      await expect(dropdownLocator).toHaveValue(optionToSelect);
  
      console.log(`Service ${service.service_id}: Selected unique dropdown value "${optionToSelect}" successfully.`);
  
      await page.getByRole('button', { name: 'Save' }).click();
  
      const successMessageLocator = page.getByText('update configuration success');
      await expect(successMessageLocator).toBeVisible();
  
      await page.waitForTimeout(1000);
    }
  
    console.log(`All dropdowns for contract "${firstContract.name}" have unique values selected.`);
  
    // Step 2: Refresh the page and verify persistence
    await page.reload();
  
    // Re-check the contract checkbox
    await contractCheckboxLocator.check();
    expect(await contractCheckboxLocator.isChecked()).toBeTruthy();
    console.log(`Checked contract checkbox again after refresh: "${firstContract.name}"`);
  
    // Verify dropdown values after refresh
    for (const service of contractServiceResponsibility) {
      const dropdownLocator = page.locator(`select[name="contract-${firstContract.contract_version_id}-service-${service.service_id}"]`);
  
      // Ensure the dropdown is visible
      expect(await dropdownLocator.isVisible()).toBeTruthy();
  
      // Verify the dropdown retains the previously selected value
      const expectedValue = selectedOptions.get(service.service_id);
      await expect(dropdownLocator).toHaveValue(expectedValue);
  
      console.log(`Service ${service.service_id}: Dropdown retains value "${expectedValue}" after refresh.`);
    }
  
    console.log(`All dropdowns for contract "${firstContract.name}" retain selected values after refresh.`);
  });
  
});
