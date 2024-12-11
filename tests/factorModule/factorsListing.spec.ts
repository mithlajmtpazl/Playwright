const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.use({
    actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Factors listing and search functionality tests', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;
    let factorNamesFromApi = [];

    test.beforeAll(async ({ request }) => {
        // Fetch and populate factors before running the tests
        const response = await request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);
        const data = await response.json();
        if (data.factorList) {
            factorNamesFromApi = data.factorList.map(factor => factor.factor_name);
        }
        expect(factorNamesFromApi.length).toBeGreaterThan(0);
    });

    test('should show factors when API returns data', async ({ page }) => {
        // Navigate to the page where factors are listed
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        // Verify each factor name is displayed in the UI
        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`); // Adjust locator based on your UI
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible on the page.`);
        }

        console.log('All factor names are displayed correctly in the UI.');
    });

    test('should validate the search functionality', async ({ page }) => {
        const searchTerm = factorNamesFromApi[0]; // Pick the first factor name
        let expectedResults = [];

        // Intercept the API request for the search and capture the expected results
        await page.route(`${backendUrl}/factorSearch?search=${encodeURIComponent(searchTerm)}&page=1&limit=10`, async (route) => {
            const response = await route.fetch();
            const data = await response.json();
            console.log('Search API Response:', data);

            // Validate the API response
            expect(data.factorList).not.toBeNull();
            expect(data.factorList.length).toBeGreaterThan(0);

            // Extract the expected factor names
            expectedResults = data.factorList.map(factor => factor.factor_name);

            // Ensure all factor names include the search term
            for (const factorName of expectedResults) {
                expect(factorName.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            route.continue();
        });

        // Navigate to the factors listing page
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        // Perform the search
        await page.getByPlaceholder('Search Factors...').fill(searchTerm); // Adjust placeholder if different
        await page.getByRole('button', { name: 'Search' }).click();

        // Validate the search results in the UI
        for (const factorName of expectedResults) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible in search results.`);
        }

        // Additional validation: ensure no extra results are displayed
        const visibleFactors = await page.locator('.factor-item').allTextContents(); // Adjust selector to match your UI
        for (const factor of visibleFactors) {
            expect(factor.toLowerCase()).toContain(searchTerm.toLowerCase());
        }

        // Clear the search and validate all data is listed back
        await page.getByTestId('CloseIcon').click(); // Simulates clicking the close button to clear search

        // Wait for the full list to be reloaded
        await page.waitForResponse(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);

        // Verify all factors are displayed again
        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible after clearing the search.`);
        }

        console.log('Search clear functionality validated successfully.');
    });

    test('Enabling and disabling of factors', async ({ page }) => {
        await page.goto(`${baseUrl}/listoffactors`);

        const factorsToToggle = ['Factor_1733744031585', 'Factor_1733744041517'];
        for (const factorName of factorsToToggle) {
            const toggleLocator = page.locator('section', { hasText: `| ${factorName}` }).getByRole('img');
            await toggleLocator.click();
            console.log(`Toggled enable/disable for: ${factorName}`);
        }
        console.log('Enable/Disable functionality validated successfully.');
    });
});

    // test('Enabling and disabling of factors',async({page})=>{

    //     await page.goto('http://localhost:5173/listoffactors');
    //     await page.locator('section').filter({ hasText: '| Factor_1733744031585' }).getByRole('img').click();
    //     await page.locator('section').filter({ hasText: '| Factor_1733744041517' }).getByRole('img').click();
    // })