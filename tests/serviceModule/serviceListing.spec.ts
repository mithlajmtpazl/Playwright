const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

/**
 * Service Listing Functionality Tests
 *
 * This suite validates the UI display of service names retrieved from the API.
 */
test.describe('Service Listing Functionality Tests', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;
  let servicesFromApi = [];

  // Fetch services data before running tests
  test.beforeAll(async ({ request }) => {
    console.log('Fetching services from API...');
    const response = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`, { timeout: 10000 });
    expect(response.ok()).toBeTruthy(); // Ensure API call is successful

    const responseData = await response.json();
    expect(responseData.data.length).toBeGreaterThan(0); // Ensure API returned services

    servicesFromApi = responseData.data.map(service => service.service.service_name);
    console.log('Services fetched from API:', servicesFromApi);
  });

  // Test to validate services in the UI
  test('Validate service names are displayed in the UI', async ({ page }) => {
    console.log('Navigating to the services listing page...');
    await page.goto(`${baseUrl}/listofservices`, { timeout: 15000 });

    for (const serviceName of servicesFromApi) {
      console.log(`Validating service: ${serviceName}`);
      const serviceLocator = page.locator(`text=${serviceName}`); // Locator to find the service name in the UI
      await expect(serviceLocator).toBeVisible({ timeout: 5000 }); // Ensure the service name is visible on the page
      console.log(`Service "${serviceName}" is displayed correctly on the UI.`);
    }

    console.log('All services validated successfully.');
  });




    test('Validate the search functionality for services', async ({ page }) => {
        const searchTerm = servicesFromApi[0]; // Pick the first factor name
        let expectedResults = [];
    
        // Intercept API request for search and capture expected results
        await page.route(`${backendUrl}/listservices?searchterm=${encodeURIComponent(searchTerm)}&page=1&limit=10`, async (route) => {
          const response = await route.fetch();
          const data = await response.json();
    
          // Validate API response
          console.log('Search API Response:', data);
          expect(data.data).not.toBeNull();
          expect(data.data.length).toBeGreaterThan(0);
    
          // Extract expected service names
          expectedResults = data.data.map(service => service.service.service_name);
    
          // Ensure all service names include the search term
          for (const serviceName of expectedResults) {
            expect(serviceName.toLowerCase()).toContain(searchTerm.toLowerCase());
          }
    
          route.continue();
        });
    
        // Navigate to the services listing page
        console.log('Navigating to the services listing page...');
        await page.goto(`${baseUrl}/listofservices`, { timeout: 15000 });
        await expect(page).toHaveURL(`${baseUrl}/listofservices`);
    
        // Perform the search
        console.log(`Performing search for: ${searchTerm}`);
        await page.getByPlaceholder('search services').fill(searchTerm); // Adjust placeholder if different
        await page.getByRole('button', { name: 'Search' }).click();
    
        // Validate search results in the UI
        for (const serviceName of expectedResults) {
          const serviceLocator = page.locator(`text=${serviceName}`);
          await expect(serviceLocator).toBeVisible({ timeout: 5000 });
          console.log(`Verified: ${serviceName} is visible in search results.`);
        }
    
        // Additional validation: ensure no extra results are displayed
        const visibleServices = await page.locator('.service-item').allTextContents(); // Adjust selector to match your UI
        for (const service of visibleServices) {
          expect(service.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
    
        // Clear the search and validate all data is listed back
        console.log('Clearing the search...');
        await page.getByText('✕').click(); // Simulate clicking the close button to clear search
    
        // Wait for the full list to be reloaded
        await page.waitForResponse(`${backendUrl}/listservices?searchterm`);
    
        // Verify all services are displayed again
        for (const serviceName of servicesFromApi) {
          const serviceLocator = page.locator(`text=${serviceName}`);
          await expect(serviceLocator).toBeVisible({ timeout: 5000 });
          console.log(`Verified: ${serviceName} is visible after clearing the search.`);
        }
    
        console.log('Search functionality validated successfully.');
    })
});
