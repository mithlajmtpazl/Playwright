const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.use({
    actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Factors Listing and Search Functionality Tests', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;
    let factorNamesFromApi = [];

    // Helper function to fetch factors from the API
    const fetchFactors = async (request, search = '', page = 1, limit = 10) => {
        const response = await request.get(`${backendUrl}/getFactorsList?search=${search}&page=${page}&limit=${limit}`);
        expect(response.ok()).toBeTruthy(); // Ensure the API call is successful

        const data = await response.json();
        expect(data.factorList).not.toBeNull();
        return data.factorList;
    };

    test.beforeAll(async ({ request }) => {
        const factors = await fetchFactors(request);
        factorNamesFromApi = factors.map(factor => factor.factor_name);
        expect(factorNamesFromApi.length).toBeGreaterThan(0);
    });

    test('should display factors from API in the UI', async ({ page }) => {
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible on the page.`);
        }

        console.log('All factors are displayed correctly in the UI.');
    });

    test('should validate the search functionality', async ({ page }) => {
        const searchTerm = factorNamesFromApi[0]; // Use the first factor name as the search term

        await page.route(`${backendUrl}/factorSearch?search=${encodeURIComponent(searchTerm)}&page=1&limit=10`, async (route) => {
            const response = await route.fetch();
            const data = await response.json();

            expect(data.factorList).not.toBeNull();
            const expectedResults = data.factorList.map(factor => factor.factor_name);

            for (const factorName of expectedResults) {
                expect(factorName.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            route.continue();
        });

        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        await page.getByPlaceholder('Search Factors...').fill(searchTerm);
        await page.getByRole('button', { name: 'Search' }).click();

        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible in search results.`);
        }

        await page.getByTestId('CloseIcon').click();
        await page.waitForResponse(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);

        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible after clearing the search.`);
        }

        console.log('Search functionality validated successfully.');
    });

    test('should validate code ranges in the UI', async ({ page, request }) => {
        const factors = await fetchFactors(request);

        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        for (const factor of factors) {
            if (factor.factor_type === 'field') {
                const factorLocator = page.locator('section', { hasText: `| ${factor.factor_name}` });
                const codeRangeLocator = factorLocator.locator('h5');
                const displayedValue = await codeRangeLocator.textContent();

                console.log(`Factor Name: ${factor.factor_name}, Expected Code Range: ${factor.totalCodes}, Displayed Code Range: ${displayedValue}`);

                expect(parseInt(displayedValue, 10)).toBe(factor.totalCodes);
                expect(factor.totalCodes).toBeGreaterThan(0);
            }
        }

        console.log('Code ranges validation completed successfully.');
    });

    test('should validate factor enable/disable functionality', async ({ page, request }) => {
        const factors = await fetchFactors(request);

        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        for (const factor of factors) {
            const factorLocator = page.locator('section', { hasText: `| ${factor.factor_name}` });

            if (factor.enabled) {
                await expect(factorLocator.locator('img#enabled')).toBeVisible();
            } else {
                await expect(factorLocator.locator('img#disabled')).toBeVisible();
            }

            const toggleButton = factorLocator.locator('img#enabled, img#disabled');
            await toggleButton.click();

            if (factor.enabled) {
                await expect(factorLocator.locator('img#disabled')).toBeVisible();
            } else {
                await expect(factorLocator.locator('img#enabled')).toBeVisible();
            }

            await page.reload();

            const refreshedFactors = await fetchFactors(request);
            const refreshedFactor = refreshedFactors.find(f => f.factor_type_id === factor.factor_type_id);

            if (refreshedFactor.enabled) {
                await expect(factorLocator.locator('img#enabled')).toBeVisible();
            } else {
                await expect(factorLocator.locator('img#disabled')).toBeVisible();
            }
        }

        console.log('Enabled/Disabled status validation completed successfully.');
    });
});
