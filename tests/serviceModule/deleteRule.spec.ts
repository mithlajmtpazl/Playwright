const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Service Module - modular testing ', () => {
    test('validating delete button for rule', async ({ page, request }) => {
        const uniqueName = `RuleTest-${Date.now()}`; // Unique name for each test
        const serviceDescription = 'Test Description';

        try {
            // **1. Navigate to Add Service Page**
            console.log('Navigating to Add Service page...');
            await page.goto(`${config.baseUrl}/addservice`, { timeout: 15000 });
            await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
            console.log('Successfully reached Add Service page.');

            // **2. Fill Service Name and Description**
            console.log('Filling Name and Description...');
            await page.getByPlaceholder('Name').fill(uniqueName);
            await page.locator('#ServiceDescription').fill(serviceDescription);

            // **3. Open Query Modal for Factors**
            console.log('Opening Query modal...');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.waitForTimeout(1000); // Ensure modal is open

            // **4. Fetch Factor Types Dynamically**
            console.log('Fetching factors list from API...');
            

            const codeInput = await page.locator('#CodesInput').fill('20-30')

            await page.getByRole('button', { name: '⋮' }).click();
            await page.getByRole('button', { name: 'Delete' }).click();
            await page.getByRole('button', { name: 'Yes, I\'m sure' }).click();




            // // **6. Save the Service**
            console.log('Saving the Service...');
            await page.locator('div').filter({ hasText: /^Save$/ }).click();

            // // Wait for confirmation message
            await page.waitForSelector('text=At least one rule is required for a service', { timeout: 7000 });
            
            // console.log('Service added successfully!');

            // // **7. Verify Service in the List**
            // console.log('Navigating to Service List page...');
            // await page.goto(`${config.baseUrl}/listofservices`, { timeout: 15000 });
            // await page.waitForLoadState('networkidle');

            // console.log(`Validating the newly added service "${uniqueName}"...`);
            // const serviceRow = await page.getByText(`${uniqueName}`);
            // await expect(serviceRow).toBeVisible();
            // console.log(`Newly added service "${uniqueName}" is successfully displayed in the list.`);

            // // **8. Open the service details using the 3-dot menu**
            // console.log(`Opening details page for the service "${uniqueName}"...`);
            // await page.getByRole('button', { name: '⋮' }).first().click();
            // await page.getByRole('link', { name: 'Edit' }).click();
            // await page.waitForTimeout(1000); // Ensure modal is open



            // // **9. Validate Service Details**
            // console.log('Validating service details...');
            // await page.getByRole('img', { name: 'queryIcon' }).first().click();
            // await page.waitForTimeout(1000); // Ensure modal is open




            // // **10. Validate Rules and Factors**
            // console.log('Validating rules and factors...');
            // for (let index = 0; index < factorTypes.length; index++) {
            //     const factorType = factorTypes[index];
            
            //     // Validate Factor Type
            //     console.log(`Validating factor ${factorType.factor_name}...`);
            //     const factorDropDown = await page.locator(`#FactorsDropdown`).nth(index);
            //     const factorDropDownValue = await factorDropDown.inputValue(); // Retrieve the value of the dropdown
            //     await expect(factorDropDownValue).toBe(factorType.factor_type_id.toString()); // Assert using Playwright's expect
            //     console.log(`Factor dropdown value matches: ${factorDropDownValue}`);
            
            //     // Validate Factor Codes
            //     const codesLocator = await page.getByPlaceholder('Enter the Codes').nth(index); // Assumes codes are displayed in text format
            //     const codesLocatorValue = await codesLocator.inputValue(); // Retrieve the value of the input field
            //     await expect(codesLocatorValue).toBe("1,2,3".toString()); // Assert using Playwright's expect
            //     console.log(`Codes for factor ${factorType.factor_name} are displayed correctly: ${codesLocatorValue}`);
            // }
            
            // console.log('Rules and factors validation successful!');
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    })
})
