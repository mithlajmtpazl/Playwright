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

    try {
        // **1. Intercept API request for search and capture expected results**
        console.log('Setting up route interception for search API...');
        await page.route(
            `${backendUrl}/listservices?searchterm=${encodeURIComponent(searchTerm)}&page=1&limit=10`,
            async (route) => {
                const response = await route.fetch();
                const data = await response.json();

                // Validate API response
                console.log('Search API Response:', data);
                expect(data.data).not.toBeNull();
                expect(data.data.length).toBeGreaterThan(0);

                // Extract expected service names
                expectedResults = data.data.map((service) => service.service.service_name);

                // Ensure all service names include the search term
                for (const serviceName of expectedResults) {
                    expect(serviceName.toLowerCase()).toContain(searchTerm.toLowerCase());
                }

                route.continue();
            }
        );

        // **2. Navigate to the services listing page**
        console.log('Navigating to the services listing page...');
        await page.goto(`${baseUrl}/listofservices`, { timeout: 20000 });
        await expect(page).toHaveURL(`${baseUrl}/listofservices`);
        console.log('Successfully navigated to the services listing page.');

        // **3. Perform the search**
        console.log(`Performing search for: ${searchTerm}`);
        await page.getByPlaceholder('search services').fill(searchTerm); // Adjust placeholder if different
        await page.waitForTimeout(1000); // Added a small delay for stability
        await page.getByRole('button', { name: 'Search' }).click();
        console.log('Search button clicked. Waiting for results...');

        // **4. Validate search results in the UI**
        console.log('Validating search results...');

        for (const serviceName of expectedResults) {
            const serviceLocator =await page.locator(`text=${serviceName}`);
            await expect(serviceLocator).toBeVisible({ timeout: 10000 });
            console.log(`Verified: ${serviceName} is visible in search results.`);
        }

        // **5. Additional validation: ensure no extra results are displayed**
        console.log('Validating there are no extra results...');
        const visibleServices = await page.locator('.service-item').allTextContents(); // Adjust selector to match your UI
        for (const service of visibleServices) {
            expect(service.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
        console.log('No extra results were displayed.');

        // **6. Clear the search and validate all data is listed back**
        console.log('Clearing the search...');
        await page.getByText('✕').click(); // Simulate clicking the close button to clear search
        await page.waitForTimeout(2000); // Small delay to ensure UI resets
        console.log('Search cleared. Waiting for full list reload...');

        // Wait for the full list to be reloaded
        await page.waitForResponse(`${backendUrl}/listservices?searchterm=a&page=1&limit=10`);
      

        console.log('Full list reloaded successfully.');

        // **7. Verify all services are displayed again**
        console.log('Verifying all services after clearing search...');
        for (const serviceName of servicesFromApi) {
            const serviceLocator = page.locator(`text=${serviceName}`);
            await expect(serviceLocator).toBeVisible({ timeout: 10000 });
            console.log(`Verified: ${serviceName} is visible after clearing the search.`);
        }

        console.log('Search functionality validated successfully.');

    } catch (error) {
        console.error('Test failed with error:', error);
        throw error; // Ensure test fails properly
    }
});

});
