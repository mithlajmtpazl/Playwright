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

    test('TC-001 - should display factors from API in the UI', async ({ page }) => {
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);

        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible on the page.`);
        }

        console.log('All factors are displayed correctly in the UI.');
    });

    test('TC-004 - should validate the search functionality', async ({ page }) => {
        const searchTerm = factorNamesFromApi[0]; // Pick the first factor name
        let expectedResults = [];
    
        // Intercept the API request for the search and capture the expected results
        await page.route(`${backendUrl}/factorSearch?search=${encodeURIComponent(searchTerm)}&page=1&limit=10`, async (route) => {
            const response = await route.fetch();
            const data = await response.json();
            console.log('Intercepted API Response:', data);
    
            // Validate the API response structure
            expect(data).toHaveProperty('factorList');
            expect(Array.isArray(data.factorList)).toBeTruthy();
            expect(data.factorList.length).toBeGreaterThan(0);
    
            // Extract expected factor names
            expectedResults = data.factorList.map((factor) => factor.factor_name);
    
            // Ensure each factor name includes the search term
            for (const factorName of expectedResults) {
                expect(factorName.toLowerCase()).toContain(searchTerm.toLowerCase());
            }
    
            route.continue();
        });
    
        // Navigate to the factors listing page
        await page.goto(`${baseUrl}/listoffactors`);
        await expect(page).toHaveURL(`${baseUrl}/listoffactors`);
    
        // Perform the search
        const searchInput = page.getByPlaceholder('Search Factors...');
        const searchButton = page.getByRole('button', { name: 'Search' });
    
        await searchInput.fill(searchTerm);
        await searchButton.click();
    
        // Wait for search results to load (verify API call)
        await page.waitForResponse((response) => 
            response.url().includes('/factorSearch') && response.status() === 200
        );
    
        // Validate the search results in the UI
        for (const factorName of expectedResults) {
            const factorLocator = await page.locator(`text=| ${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible in the search results.`);
        }
    
        // Validate there are no unexpected results displayed
        const visibleFactors = await page.locator('.factor-item').allTextContents(); // Adjust selector to match your UI
        for (const factor of visibleFactors) {
            expect(factor.toLowerCase()).toContain(searchTerm.toLowerCase());
        }
    
        // Clear the search and validate all factors are displayed again
        const clearButton = page.getByTestId('CloseIcon');
        await clearButton.click();
    
        // Wait for the full list to reload
        await page.waitForResponse(`${backendUrl}/getFactorsList?search=&page=1&limit=10`);
    
        // Validate all factors are listed again
        for (const factorName of factorNamesFromApi) {
            const factorLocator = page.locator(`text=${factorName}`);
            await expect(factorLocator).toBeVisible();
            console.log(`Verified: ${factorName} is visible after clearing the search.`);
        }
    
        console.log('Search functionality validated successfully.');
    });
    

    test('TC-1122 - should validate code ranges in the UI', async ({ page, request }) => {
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

    test('TC-005 -  should validate factor enable/disable functionality', async ({ page, request }) => {
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
