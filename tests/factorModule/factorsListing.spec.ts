const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.use({
    actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Factors listing tests', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;

    test('should verify all factor names are displayed in the UI', async ({ page }) => {
        let factorNamesFromApi = [];

        // Intercept the API call and extract factor names
        await page.route(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, async (route) => {
            const response = await route.fetch();
            const data = await response.json();
            console.log('API Response:', data);

            // Validate the API response
            expect(data.factorList).not.toBeNull();
            expect(data.factorList.length).toBeGreaterThan(0);

            // Extract all factor names
            factorNamesFromApi = data.factorList.map(factor => factor.factor_name);

            // Continue the API request
            route.continue();
        });

        // Navigate to the page where factors are listed
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        // Wait for the page to load data
        await page.waitForResponse(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);

        // Verify each factor name is displayed in the UI
        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text="| ${factorName}"`); // Assumes `factor_name` is displayed as text
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible on the page.`);
        }

        console.log('All factor names are displayed correctly in the UI.');
    });
});
