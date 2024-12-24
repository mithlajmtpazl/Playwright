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
          const componentLocator = page.locator(`text=${component.component_name}`);
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

  test('clicking on contract should show plans', async ({ page, request }) => {
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
  
    // Select the first contract to test clicking functionality
    const firstContract = contracts[0];
    console.log(firstContract.name)

    const contractCheckboxLocator = await page.locator(`#${firstContract.name}`).getByRole('checkbox'); 
    await contractCheckboxLocator.check();  
    
    // console.log(`Clicking on contract: ${firstContract.name}`);
    const listheadofplan = await page.getByRole('cell', { name: 'ContractTest' }).locator('span')
    expect(listheadofplan).toBeVisible()
    
    console.log(`Plans for contract "${firstContract.name}" are visible.`);
  });
  
});
