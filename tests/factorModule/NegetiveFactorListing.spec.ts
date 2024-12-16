const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.use({
    actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Negative and Edge Test Cases for Factors Listing', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;

    test('should display "No Factors Found" when there are no factors', async ({ page, request }) => {
        // Mock the API response to return an empty factor list
        await page.route(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, async (route) => {
            const emptyResponse = { factorList: [] };
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(emptyResponse),
            });
        });

        // Navigate to the factors listing page
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        // Validate that "No Factors Found" is displayed in the UI
        const noFactorsMessage = page.locator('text=No Factors Added.'); // Adjust selector if needed
        await expect(noFactorsMessage).toBeVisible();

        console.log('Verified: "No Factors Found" message is displayed when the factor list is empty.');
    });

    test('should show error message if API request fails', async ({ page, request }) => {
        // Mock the API response to return an error
        await page.route(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, async (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });

        // Navigate to the factors listing page
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        // Validate that the appropriate error message is displayed in the UI
        const errorMessage = page.locator('text=No Results Found'); // Adjust selector if needed
        await expect(errorMessage).toBeVisible();

        console.log('Verified: Error message is displayed when the API request fails.');
    });

    test('should display no results for non-matching search terms', async ({ page }) => {
        const searchTerm = 'nonexistentfactor'; // A term guaranteed to return no results
    
        // Navigate to the factors listing page
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);
    
        // Perform the search
        const searchInput = page.getByPlaceholder('Search Factors...');
        const searchButton = page.getByRole('button', { name: 'Search' });
    
        await searchInput.fill(searchTerm);
        await searchButton.click();
    
        // Wait for the search results to load
        await page.waitForResponse((response) =>
            response.url().includes(`${backendUrl}/factorSearch`) &&
            response.status() === 200
        );
    
        // Validate that "No Results Found" is displayed in the UI
        const noResultsMessage = await page.locator('text=No results found for your search.'); // Adjust selector if needed
        await expect(noResultsMessage).toBeVisible();
    
        console.log(`Verified: "No Results Found" message is displayed for search term: ${searchTerm}.`);
    });
    
});
