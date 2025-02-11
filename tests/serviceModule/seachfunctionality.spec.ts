const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');


test.describe('serviceModuleCodesearchtest', () => {
    const baseUrl = config.baseUrl
    const backendUrl = config.backendUrl

    test('Searching codes by description',async ({page}) => {
            await page.goto('http://localhost:5173/addservice');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.getByRole('button', { name: '⋮' }).click();
            await page.locator('span').filter({ hasText: 'Search' }).first().click();
            await page.getByPlaceholder('Search description').click();
    })
})
