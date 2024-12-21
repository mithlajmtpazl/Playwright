const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Service Module - Testing', () => {
    test('Add a new service with multiple rules and validate rules', async ({ page, request }) => {
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
            const factorResponse = await request.get('http://localhost:3000/api/getallfactortypes');
            expect(factorResponse.ok()).toBeTruthy();

            const factorTypes = await factorResponse.json();
            console.log('Factor types fetched:', factorTypes);

            // **5. Add Factors One by One**
            for (let index = 0; index < factorTypes.length; index++) {
                console.log(`Adding factor ${index + 1}: ${factorTypes[index].factor_name}`);

                // Locate dropdown dynamically
                let factorDropDown = index === 0 
                    ? page.locator('#FactorsDropdown') 
                    : page.locator(`#FactorsDropdown`).nth(index);

                // Select Factor Type
                await factorDropDown.scrollIntoViewIfNeeded();
                await factorDropDown.selectOption({ value: factorTypes[index].factor_type_id.toString() });

                // Validate Dropdown Value
                await expect(factorDropDown).toHaveValue(factorTypes[index].factor_type_id.toString());
                const selectedValue = await factorDropDown.inputValue();
                console.log(`Dropdown value selected: ${selectedValue}`);

                // Check if #CodesInput exists before interacting
                const codeInputExists = await page.locator('#CodesInput').nth(index).isVisible().catch(() => false);

                if (codeInputExists) {
                    console.log('Filling Factor Codes...');
                    let selectedCodes = index === 0 
                        ? page.locator('#CodesInput') 
                        : page.locator(`#CodesInput`).nth(index);

                    await selectedCodes.fill('1,2,3');
                    await expect(selectedCodes).toHaveValue('1,2,3');
                    console.log('Factor Codes filled successfully.');
                } else {
                    console.log(`No codes input available for factor ${factorTypes[index].factor_name}. Skipping code input.`);
                }

                // Click "Add Rule" button or save
                if (index === factorTypes.length - 1) {
                    console.log('Saving the Service...');
                    await page.locator('div').filter({ hasText: /^Save$/ }).click();
                } else {
                    console.log('Clicking "Add Rule" button...');
                    await page.getByRole('button', { name: 'Add Rule' }).click();
                    await page.waitForTimeout(500); // Ensure next field loads
                }
            }

            // **6. Save the Service**
            console.log('Saving the Service...');
            await page.locator('div').filter({ hasText: /^Save$/ }).click();

            // Wait for confirmation message
            await page.waitForSelector('text=Service saved successfully', { timeout: 7000 });
            console.log('Service added successfully!');

            // **7. Verify Service in the List**
            console.log('Navigating to Service List page...');
            await page.goto(`${config.baseUrl}/listofservices`, { timeout: 15000 });
            await page.waitForLoadState('networkidle');

            console.log(`Validating the newly added service "${uniqueName}"...`);
            const serviceRow = await page.getByText(`${uniqueName}`);
            await expect(serviceRow).toBeVisible();
            console.log(`Newly added service "${uniqueName}" is successfully displayed in the list.`);

            // **8. Open the service details using the 3-dot menu**
            console.log(`Opening details page for the service "${uniqueName}"...`);
            await page.getByRole('button', { name: '⋮' }).first().click();
            await page.getByRole('link', { name: 'Edit' }).click();
            await page.waitForTimeout(1000); // Ensure modal is open



            // **9. Validate Service Details**
            console.log('Validating service details...');
            await page.getByRole('img', { name: 'queryIcon' }).first().click();
            await page.waitForTimeout(1000); // Ensure modal is open




            // **10. Validate Rules and Factors**
            console.log('Validating rules and factors...');
            for (let index = 0; index < factorTypes.length; index++) {
                const factorType = factorTypes[index];
            
                // Validate Factor Type
                console.log(`Validating factor ${factorType.factor_name}...`);
                const factorDropDown = await page.locator(`#FactorsDropdown`).nth(index);
                const factorDropDownValue = await factorDropDown.inputValue(); // Retrieve the value of the dropdown
                await expect(factorDropDownValue).toBe(factorType.factor_type_id.toString()); // Assert using Playwright's expect
                console.log(`Factor dropdown value matches: ${factorDropDownValue}`);
            
                // Validate Factor Codes
                const codesLocator = await page.getByPlaceholder('Enter the Codes').nth(index); // Assumes codes are displayed in text format
                const codesLocatorValue = await codesLocator.inputValue(); // Retrieve the value of the input field
                await expect(codesLocatorValue).toBe("1,2,3".toString()); // Assert using Playwright's expect
                console.log(`Codes for factor ${factorType.factor_name} are displayed correctly: ${codesLocatorValue}`);
            }
            
            console.log('Rules and factors validation successful!');
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    });

    test('ensure valid codes can be uploaded and displayed', ({page}) => {

    })


    test('validate the add group button', async ({ page, request }) => {
        const uniqueName = `RuleTest-${Date.now()}`; // Unique name for each test
        const serviceDescription = 'Test Description';
        let serviceID;
    
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

             serviceID = await page.getByPlaceholder('Id').inputValue();
    
            // **3. Open Query Modal for Factors**
            console.log('Opening Query modal...');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.waitForTimeout(1000); // Ensure modal is open
    
            // **4. Fetch Factor Types Dynamically**
            console.log('Fetching factors list from API...');
            const factorResponse = await request.get('http://localhost:3000/api/getallfactortypes');
            expect(factorResponse.ok()).toBeTruthy();
    
            const factorTypes = await factorResponse.json();
            console.log('Factor types fetched:', factorTypes);


            await page.locator('#CodesInput').fill('10-200')
            await page.getByRole('button', { name: 'Add Group' }).click()

            await page.getByRole('button', { name: 'Add Rule' }).nth(1).click()
            page.waitForTimeout(1000)
            
    
            // **5. Add Factors One by One**
            for (let index = 0; index < factorTypes.length; index++) {
                console.log(`Adding factor ${index + 1}: ${factorTypes[index].factor_name}`);
    
                // Locate dropdown and input dynamically
                let factorDropDown =await page.locator('#FactorsDropdown').nth(index+1);
    
                let selectedCodes = await page.locator('#CodesInput').nth(index+1);
    
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

            // **11. Validate Rule Details* // Replace with dynamic ID if necessary
        const serviceResponse = await request.get(`http://localhost:3000/api/getServiceById/${serviceID}`);
        expect(serviceResponse.ok()).toBeTruthy();

        const serviceData = await serviceResponse.json();
        console.log('Service data fetched:', serviceData);

        const queryRules = serviceData.data.json.query.rules[1].rules;

        console.log('Validating factor_type_id in query.rules[1].rules...');
        const factorTypeIds = factorTypes.map((factor) => factor.factor_type_id);
        for (const factorTypeId of factorTypeIds) {
            const exists = queryRules.some((rule) => rule.factor_type_id === factorTypeId);
            console.log(`Checking factor_type_id ${factorTypeId}: ${exists ? 'Found' : 'Not Found'}`);
            expect(exists).toBe(true);
        }
        console.log('All factor_type_id validations passed successfully.');

    
                } else {
                    console.log('Clicking "Add Rule" button...');
                    await page.getByRole('button', { name: 'Add Rule' }).nth(1).click();
                    await page.waitForTimeout(500); // Ensure dynamic div loads
                }
            }
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Rethrow the error to fail the test
        }
    });

    test('Add a new service, validate clear button with multiple rules', async ({ page, request }) => {
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
            const factorResponse = await request.get('http://localhost:3000/api/getallfactortypes');
            expect(factorResponse.ok()).toBeTruthy();
    
            const factorTypes = await factorResponse.json();
            console.log('Factor types fetched:', factorTypes);
    
            // **5. Add Factors One by One**
            for (let index = 0; index < factorTypes.length; index++) {
                console.log(`Adding factor ${index + 1}: ${factorTypes[index].factor_name}`);
    
                // Locate dropdown dynamically
                let factorDropDown = index === 0
                    ? page.locator('#FactorsDropdown')
                    : page.locator('#FactorsDropdown').nth(index);
    
                // Select Factor Type
                await factorDropDown.scrollIntoViewIfNeeded();
                await factorDropDown.selectOption({ value: factorTypes[index].factor_type_id.toString() });
    
                // Validate Dropdown Value
                await expect(factorDropDown).toHaveValue(factorTypes[index].factor_type_id.toString());
                const selectedValue = await factorDropDown.inputValue();
                console.log(`Dropdown value selected: ${selectedValue}`);
    
                // Check if #CodesInput exists before interacting
                const codeInputExists = await page.locator('#CodesInput').nth(index).isVisible().catch(() => false);
    
                if (codeInputExists) {
                    console.log('Filling Factor Codes...');
                    let selectedCodes = index === 0
                        ? page.locator('#CodesInput')
                        : page.locator('#CodesInput').nth(index);
    
                    await selectedCodes.fill('1,2,3');
                    await expect(selectedCodes).toHaveValue('1,2,3');
                    console.log('Factor Codes filled successfully.');
                } else {
                    console.log(`No codes input available for factor ${factorTypes[index].factor_name}. Skipping code input.`);
                }
    
                // Click "Add Rule" button if more rules are left
                if (index < factorTypes.length - 1) {
                    console.log('Clicking "Add Rule" button...');
                    await page.getByRole('button', { name: 'Add Rule' }).click();
                    await page.waitForTimeout(500); // Ensure next field loads
                }
            }
    
            // **6. Click Clear Button**
            console.log('Clicking "Clear" button...');
            await page.getByRole('button', { name: 'clear' }).click();
    
            // **7. Confirm Clear Action**
            console.log('Confirming Clear action...');
            await page.getByRole('button', { name: "Yes, I'm sure" }).click();

            await page.locator('div').filter({ hasText: /^Save$/ }).click()
    
            // **8. Verify Error Message**
            console.log('Verifying error message...');
            await page.waitForSelector('text=At least one rule is required for a service', { timeout: 7000 });
            console.log('Error message validated successfully: At least one rule is required for a service');
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    });
});
