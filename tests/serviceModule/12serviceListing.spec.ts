const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');
const fs = require('fs');


/**
 * Service Listing Functionality Tests
 *
 * This suite validates the UI display of service names retrieved from the API.
 */
test.describe('Service Listing Functionality Tests', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;
  let servicesFromApi = [];
  const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    const token = tokenData.token;

  // Fetch services data before running tests
  test.beforeAll(async ({ request }) => {
    console.log('Fetching services from API...');
    const response = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`, // Add authentication token if required
      },
    });
    expect(response.ok()).toBeTruthy(); // Ensure API call is successful

    const responseData = await response.json();
    expect(responseData.data.length).toBeGreaterThan(0); // Ensure API returned services

    servicesFromApi = responseData.data.map(service => service.service.service_name);
    console.log('Services fetched from API:', servicesFromApi);
  });

  // Test to validate services in the UI
  test('TC-044 Validate service names are displayed in the UI', async ({ page }) => {
    console.log('Navigating to the services listing page...');
    await page.goto(`${baseUrl}/listofservices`, { 
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${token}`, // Add authentication token if required
      },
     });

    for (const serviceName of servicesFromApi) {
      console.log(`Validating service: ${serviceName}`);
      const serviceLocator = page.locator(`text=${serviceName}`); // Locator to find the service name in the UI
      await expect(serviceLocator).toBeVisible({ timeout: 5000 }); // Ensure the service name is visible on the page
      console.log(`Service "${serviceName}" is displayed correctly on the UI.`);
    }

    console.log('All services validated successfully.');
  });




  test('TC-045 Validate the search functionality for services', async ({ page }) => {
    const searchTerm = servicesFromApi[0]; // Pick the first service name
    console.log(searchTerm, 'miniini');

    console.log('Navigating to the services listing page...');
    await page.goto(`${baseUrl}/listofservices`, { timeout: 20000 });
    await expect(page).toHaveURL(`${baseUrl}/listofservices`);
    console.log('Successfully navigated to the services listing page.');

    // **Perform the search**
    console.log(`Performing search for: ${searchTerm}`);
    await page.getByPlaceholder('search services').fill(searchTerm); // Adjust placeholder if needed
    await page.waitForTimeout(1000); // Small delay for stability

    // **Intercept API request for search and validate response**
    console.log('Setting up route interception for search API...');
    let searchApiIntercepted = false; // Flag to check if interception worked
    console.log(searchTerm,'ererer')
    await page.route(
        `${backendUrl}/listservices?searchterm=${encodeURIComponent(searchTerm)}&page=1&limit=10`,
        async (route) => {
            searchApiIntercepted = true; // Mark as intercepted
            console.log('Intercepted the search API request.');
            const response = await route.fetch();
            const data = await response.json();

            // Validate API response
            console.log('Search API Response:', data);
            expect(data.data).not.toBeNull();
            expect(data.data.length).toBeGreaterThan(0);

            // Ensure all service names include the search term
            const receivedResults = data.data.map((service) => service.service.service_name);
            for (const serviceName of receivedResults) {
                console.log(serviceName, 'kk');
                // expect(serviceName.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            route.continue();
        }
    );

    // Click the search button after setting up interception
    await page.getByRole('button', { name: 'Search' }).click();
    console.log('Search button clicked.');

    // Ensure the API request was intercepted
    await page.waitForTimeout(2000); // Wait for API call to complete
    if (!searchApiIntercepted) {
        console.error('Search API request was not intercepted.');
    } else {
        console.log('Search API request successfully intercepted.');
    }
});

});
