const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Service Module - modular testing ', () => {
    test('TC-042 validating delete button for rule', async ({ page, request }) => {
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

         } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    })

    test(' TC-043 Deleting a component in service', async ({ page, request }) => {
        const uniqueName = `Demoservice-${Date.now()}`; // Unique name for each test
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
    
            // **3. Check Hospital Claims Checkbox**
            console.log('Checking Hospital Claims checkbox...');
            const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
            await hospitalClaimsCheckbox.check();
            expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
    
            // **4. Open Query Modal for Factors**
            console.log('Opening Query modal...');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.waitForTimeout(1000); // Ensure modal is open
    
            // **5. Fetch Factor Types Dynamically**
            console.log('Fetching factors list from API...');
            const factorResponse = await request.get('http://localhost:3000/api/getallfactortypes');
            expect(factorResponse.ok()).toBeTruthy();
    
            const factorTypes = await factorResponse.json();
            console.log('Factor types fetched:', factorTypes);
    
            // **6. Add Factors One by One**
            for (let index = 0; index < factorTypes.length; index++) {
                console.log(`Adding factor ${index + 1}: ${factorTypes[index].factor_name}`);
    
                // Locate dropdown and input dynamically
                let factorDropDown = page.locator('#FactorsDropdown').nth(index);
                let selectedCodes = page.locator('#CodesInput').nth(index);
    
                // Select Factor Type
                await factorDropDown.scrollIntoViewIfNeeded();
                await factorDropDown.selectOption({ value: factorTypes[index].factor_type_id.toString() });
                await expect(factorDropDown).toHaveValue(factorTypes[index].factor_type_id.toString());
    
                // Fill Factor Codes
                console.log('Filling Factor Codes...');
                await selectedCodes.fill('1,2,3');
                await expect(selectedCodes).toHaveValue('1,2,3');
    
                // Click Add Rule or Add Component based on condition
                if (index === factorTypes.length - 1) {
                    console.log('Clicking "Add Component" button...');
                    await page.getByRole('button', { name: 'component Component' }).click();
                } else {
                    console.log('Clicking "Add Rule" button...');
                    await page.getByRole('button', { name: 'Add Rule' }).click();
                    await page.waitForTimeout(500); // Ensure dynamic div loads
                }
            }
    
            // **7. Fill Component Details**
            console.log('Filling Component Details...');
            const componentName = `TestComponent-${Date.now()}`;
            const componentDescription = 'Component Description';
    
            const componentNameField = page.locator('input[name="name"]');
            await componentNameField.fill(componentName);
            await expect(componentNameField).toHaveValue(componentName);
    
            const componentDescriptionField = page.locator('input[name="description"]');
            await componentDescriptionField.fill(componentDescription);
            await expect(componentDescriptionField).toHaveValue(componentDescription);
    
            // **8. Add Criteria Section**
            console.log('Adding Criteria...');
            await page.locator('span').filter({ hasText: 'Criteria' }).nth(2).click();
            const childInput = page.locator(
                '.flex > div > div:nth-child(2) > div:nth-child(2) > div input[placeholder="Enter the Codes"]'
            );
            await childInput.fill('10-20');
            await expect(childInput).toHaveValue('10-20');

            // await page.locator('.text-end').click();
        //  await page.getByRole('button', { name: 'Yes, I\'m sure' }).click();
        //  await page.waitForSelector('text=Component deleted successfully', { timeout: 7000 });


    
            // **9. Save the Service**
            console.log('Saving the Service...');
            await page.locator('div').filter({ hasText: /^Save$/ }).click();
    
            // Wait for confirmation message
            await page.waitForSelector('text=Service saved successfully', { timeout: 7000 });
            console.log('Service added successfully!');
    
            // **10. Verify Service in the List**
            console.log('Navigating to Service List page...');
            await page.goto(`${config.baseUrl}/listofservices`, { timeout: 15000 });
            await page.waitForLoadState('networkidle');
    
            console.log(`Validating the newly added service "${uniqueName}"...`);
            const newServiceLocator = page.locator(`text=${uniqueName}`);
            await expect(newServiceLocator).toBeVisible({ timeout: 5000 });
            console.log(`Newly added service "${uniqueName}" is successfully displayed in the list.`);

            console.log('Selecting the first service to edit...');
            await page.getByRole('button', { name: '⋮' }).first().click();
            await page.getByRole('link', { name: 'Edit' }).click();
            console.log('Edit Service page loaded successfully.');

            await page.getByRole('button').nth(2).click();
            await page.getByRole('button', { name: 'Yes, I\'m sure' }).click()

            await page.waitForTimeout(1000)
            await page.waitForSelector('text=Component deleted successfully', { timeout: 7000 });

            //expect the component to be deleted and not present in the ui
        } catch (error) {
            console.error('Test failed:', error);
            throw error; // Rethrow the error to fail the test in Playwright
        }
    });
    
})
