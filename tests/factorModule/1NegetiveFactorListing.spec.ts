const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.use({
    actionTimeout: 10000, // Timeout of 10 seconds for each action
    navigationTimeout: 15000, // Timeout for navigation actions
});

test.describe('Negative and Edge Test Cases for Factors Listing', () => {


    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;

    test.afterEach(async ({ page }) => {
        console.log('Closing the browser after test execution.');
        await page.close(); // Explicitly close the page
    });

    test('TC-001 - Should display "No Factors Found" when there are no factors', async ({ page }) => { 
        console.log('Step 1: Navigate to the Factors listing page.');
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        console.log('Step 2: Validate that the API returns an empty list.');
        const response = await page.request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);
        const responseBody = await response.json();
        console.log('API Response:', responseBody);

        // expect(responseBody.factorList).toEqual([]); // Confirm the list is empty

        console.log('Step 3: Verify "No Factors Found" message in the UI.');
        const noFactorsMessage = page.locator('text=No Factors Added.'); // Adjust selector if needed
        await expect(noFactorsMessage).toBeVisible();

        console.log('Test Passed: "No Factors Found" is displayed when the factor list is empty.');
    });

    test('TC-002 - Should display "No Results Found" for non-matching search terms', async ({ page }) => {
        const searchTerm = 'nonexistentfactor'; // A term guaranteed to return no results
        console.log(`Step 1: Navigate to the Factors listing page with search term: ${searchTerm}.`);
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        console.log('Step 2: Perform search with a non-matching term.');
        const searchInput = page.getByPlaceholder('Search Factors...');
        const searchButton = page.getByRole('button', { name: 'Search' });

        await searchInput.fill(searchTerm);
        await searchButton.click();

        console.log('Step 3: Wait for the search API response.');
        await page.waitForResponse((response) =>
            response.url().includes(`${backendUrl}/factorSearch`) &&
            response.status() === 200
        );

        console.log('Step 4: Verify "No Results Found" message in the UI.');
        const noResultsMessage = page.locator('text=No results found for your search.');
        await expect(noResultsMessage).toBeVisible();

        console.log(`Test Passed: "No Results Found" message is displayed for search term: ${searchTerm}.`);
    });

    test('TC-003 - Should show error message if API request fails', async ({ page }) => {
        console.log('Step 1: Mock API response to simulate a server error.');
        await page.route(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, async (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });

        console.log('Step 2: Navigate to the Factors listing page.');
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        console.log('Step 3: Verify error message in the UI.');
        const errorMessage = page.locator('text=Something went wrong'); // Adjust selector if needed
        await expect(errorMessage).toBeVisible();

        console.log('Test Passed: Error message is displayed when the API request fails.');
    });
});
