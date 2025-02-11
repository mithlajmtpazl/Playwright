const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx'); // Import the xlsx library


test.describe('Service Module - Testing', () => {
    const baseUrl = config.baseUrl
    test('TC-037- Add a new service with multiple rules and validate rules', async ({ page, request }) => {
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

    test('TC-038 validate the add group button', async ({ page, request }) => {

        function evaluateQuery(query) {
            console.log(query, 'this is the query ');
            let count = 0;
            query.forEach((rule) => {
                if (rule.rules) {
                    count++;
                    evaluateQuery(rule.rules);
                }
            });
            if (count > 0) {
                console.log(count, '-------');
                return true;
            } else {
                return false;
            }
        }
    
        // Test variables
        const uniqueName = `RuleTest-${Date.now()}`; // Unique name for the test
        const serviceDescription = 'Test Description';
        let serviceID;
    
        try {
            // Step 1: Navigate to Add Service Page
            console.log('Navigating to Add Service page...');
            await page.goto(`${config.baseUrl}/addservice`, { timeout: 15000 });
            await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
            console.log('Successfully reached Add Service page.');
    
            // Step 2: Fill Service Name and Description
            console.log('Filling service name and description...');
            await page.getByPlaceholder('Name').fill(uniqueName);
            await page.locator('#ServiceDescription').fill(serviceDescription);
            serviceID = await page.getByPlaceholder('Id').inputValue();
    
            // Step 3: Open Query Modal
            console.log('Opening Query modal...');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.waitForTimeout(1000); // Ensure modal is open
    
            // Step 4: Fetch Factor Types from API
            console.log('Fetching factor types from API...');
            const factorResponse = await request.get(`${baseUrl}/getallfactortypes`);
            expect(factorResponse.ok()).toBeTruthy();
    
            const factorTypes = await factorResponse.json();
            console.log('Factor types fetched:', factorTypes);
    
            // Step 5: Add Factors and Rules
            console.log('Adding initial group and rule...');
            await page.locator('#CodesInput').fill('10-200');
            await page.getByRole('button', { name: 'Add Group' }).click();
            await page.getByRole('button', { name: 'Add Rule' }).nth(1).click();
            await page.waitForTimeout(1000);
    
            for (let index = 0; index < factorTypes.length; index++) {
                console.log(`Adding factor ${index + 1}: ${factorTypes[index].factor_name}`);
    
                const factorDropDown = await page.locator('#FactorsDropdown').nth(index + 1);
                const selectedCodes = await page.locator('#CodesInput').nth(index + 1);
    
                // Select Factor Type
                await factorDropDown.scrollIntoViewIfNeeded();
                await factorDropDown.selectOption({ value: factorTypes[index].factor_type_id.toString() });
                await expect(factorDropDown).toHaveValue(factorTypes[index].factor_type_id.toString());
    
                // Fill Factor Codes
                console.log('Filling factor codes...');
                await selectedCodes.fill('1,2,3');
                await expect(selectedCodes).toHaveValue('1,2,3');
    
                if (index === factorTypes.length - 1) {
                    // Save the Service
                    console.log('Saving the service...');
                    await page.locator('div').filter({ hasText: /^Save$/ }).click();
                    await page.waitForSelector('text=Service saved successfully', { timeout: 7000 });
                    console.log('Service saved successfully!');
    
                    // Verify Service in the List
                    console.log('Navigating to the Service List page...');
                    await page.goto(`${config.baseUrl}/listofservices`, { timeout: 15000 });
                    await page.waitForLoadState('networkidle');
    
                    console.log(`Validating the newly added service "${uniqueName}"...`);
                    const newServiceLocator = page.locator(`text=${uniqueName}`);
                    await expect(newServiceLocator).toBeVisible({ timeout: 5000 });
    
                    console.log('Selecting the first service to edit...');
                    await page.getByRole('button', { name: '⋮' }).first().click();
                    await page.getByRole('link', { name: 'Edit' }).click();
                    console.log('Edit Service page loaded successfully.');
    
                    // Validate Rule Details
                    console.log('Fetching service data for validation...');
                    const serviceResponse = await request.get(`http://localhost:3000/api/getServiceById/${serviceID}`);
                    expect(serviceResponse.ok()).toBeTruthy();
    
                    const serviceData = await serviceResponse.json();
                    console.log('Service data fetched:', serviceData);
    
                    const queryRules = serviceData.data.json.query;
                    console.log('Validating presence of second "rules" key...');
                    expect(evaluateQuery(queryRules.rules)).toBe(true);
    
                    console.log('Validating factor_type_id in query.rules[1].rules...');
                    const factorTypeIds = factorTypes.map((factor) => factor.factor_type_id);
                    for (const factorTypeId of factorTypeIds) {
                        const exists = queryRules.rules.some((rule) => rule.factor_type_id === factorTypeId);
                        console.log(`Checking factor_type_id ${factorTypeId}: ${exists ? 'Found' : 'Not Found'}`);
                        expect(exists).toBe(true);
                    }
                    console.log('All factor_type_id validations passed successfully.');
                } else {
                    console.log('Adding another rule...');
                    await page.getByRole('button', { name: 'Add Rule' }).nth(1).click();
                    await page.waitForTimeout(500); // Ensure dynamic div loads
                }
            }
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    });
    
    test('TC-039 Add a new service, validate clear button with multiple rules', async ({ page, request }) => {
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


    test('TC-040 add negative rule exclusion test with background color check', async ({ page, request }) => {
        const uniqueName = `RuleTest-${Date.now()}`; // Unique name for each test
        const serviceDescription = 'Test Description';
        let serviceID;
    
        try {
            // **Step 1: Navigate to Add Service Page**
            console.log('Step 1: Navigating to the Add Service page...');
            await page.goto(`${config.baseUrl}/addservice`, { timeout: 15000 });
            await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
            console.log('Successfully navigated to Add Service page.');
    
            // **Step 2: Fill Service Name and Description**
            console.log('Step 2: Filling in the Service Name and Description...');
            await page.getByPlaceholder('Name').fill(uniqueName);
            await page.locator('#ServiceDescription').fill(serviceDescription);
    
            // Retrieve the Service ID
            serviceID = await page.getByPlaceholder('Id').inputValue();
            console.log(`Service ID retrieved: ${serviceID}`);
    
            // **Step 3: Open Query Modal and Add Rule**
            console.log('Step 3: Opening Query Modal to add a rule...');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.waitForTimeout(1000);
            console.log('Query Modal opened successfully.');
    
            console.log('Adding a rule to the query...');
            await page.getByPlaceholder('Enter the Codes').fill('1-10');
            await page.getByTestId('RemoveIcon').click();
    
            console.log('Saving the query...');
            await page.locator('div').filter({ hasText: /^Save$/ }).click();
            await page.waitForSelector('text=Service saved successfully', { timeout: 7000 });
            console.log('Query saved successfully.');
    
            // **Step 4: Validate Service in Service List**
            console.log('Step 4: Navigating to the Service List page...');
            await page.goto(`${config.baseUrl}/listofservices`, { timeout: 15000 });
            await page.waitForLoadState('networkidle');
    
            console.log(`Validating the newly added service "${uniqueName}" in the list...`);
            const serviceRow = await page.getByText(`${uniqueName}`);
            await expect(serviceRow).toBeVisible();
            console.log(`Newly added service "${uniqueName}" is successfully displayed in the list.`);
    
            // **Step 5: Open Service Details**
            console.log(`Step 5: Opening the details page for the service "${uniqueName}"...`);
            await page.getByRole('button', { name: '⋮' }).first().click();
            await page.getByRole('link', { name: 'Edit' }).click();
            await page.waitForTimeout(1000);
    
            // **Step 6: Fetch Service Data via API**
            console.log('Step 6: Fetching service data from the API...');
            const serviceResponse = await request.get(`http://localhost:3000/api/getServiceById/${serviceID}`);
            const serviceData = await serviceResponse.json();
            console.log('Service data fetched:', serviceData.data.json.query);
    
            // **Step 7: Validate Rule Inclusion**
            console.log('Step 7: Validating the rule exclusion (inclusion should be false)...');
            const inclusionValue = serviceData.data.json.query.rules[0].inclusion;
    
            // Assertion with Expect
            await expect(inclusionValue).toBe(false); // Ensure inclusion is false
            console.log('✅ Test Passed: The rule is correctly marked as exclusion (inclusion = false).');
            await page.getByRole('img', { name: 'queryIcon' }).click();

    
            // **Step 8: Check Background Color for Exclusion**
            console.log('Step 8: Checking if the background color is bg-red-500 when inclusion is false...');
            const exclusionElement = await page.locator('#exclusion');

            const className = await exclusionElement.getAttribute('class');
            
            // Assert that bg-red-500 is present when inclusion is false
            if (inclusionValue === false) {
                console.log('Step 3: Opening Query Modal to add a rule...');
                await expect(className).toContain('bg-red-500'); // Check if the bg-red-500 class is present
                console.log('✅ Background color is correctly set to red (bg-red-500).');
            } else {
                console.log('❌ Inclusion is not false, background color check skipped.');
            }
    
        } catch (err) {
            console.error('🚨 An error occurred during the test:', err);
            throw err; // Rethrow the error to ensure the test fails
        }
    });
    


    test('TC-041 uploading of codes works perfectly and save', async ({ page }) => {
        const uniqueName = `RuleTest-${Date.now()}`; // Unique name for each test
        const serviceDescription = 'Test Description';
    
        const filePath = path.resolve(__dirname, '../../assets/SAMPLE-XLSX.xlsx');
        const fileName = path.basename(filePath);
    
        try {
            // 1. Navigate to Add Service Page
            console.log('Navigating to Add Service page...');
            await page.goto(`${config.baseUrl}/addservice`, { timeout: 15000 });
            await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
    
            // 2. Fill Service Name and Description
            await page.getByPlaceholder('Name').fill(uniqueName);
            await page.locator('#ServiceDescription').fill(serviceDescription);
    
            // 3. Open Query Modal for Factors
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.getByRole('button', { name: '⋮' }).click();
            await page.getByText('Upload').click();
    
            // 4. Upload File
            console.log(`Uploading file: ${fileName}`);
            await page.setInputFiles('#fileInput', filePath);
    
            // Listen for API response
            let uploadResponse = null;
            page.on('requestfinished', async (request) => {
                if (request.url().includes('/api/upload')) {
                    uploadResponse = await request.response();
                    expect(uploadResponse.status()).toBe(200);
    
                    const responseBody = await uploadResponse.json();
                    expect(responseBody.message).toBe('Data extracted and inserted successfully');
                    expect(responseBody.filename).toBe(fileName);
                }
            });
    
            // 5. Click Add to Existing
            await page.getByRole('button', { name: 'Add to Existing' }).click();
    
            // 6. View Uploaded Codes
            await page.getByRole('button', { name: '⋮' }).click();
            await page.getByTestId('VisibilityIcon').locator('path').click();
            await page.getByText('Uploaded Codes').click();
            await page.waitForSelector('table tbody tr'); // Wait for table rows to load
    
            // 7. Parse Excel File and Validate Data
            const workbook = xlsx.readFile(filePath);
            const firstSheetName = workbook.SheetNames[0];
            const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
    
            const fileCodes = sheetData.slice(0, 10).map(row => `${row['From']} - ${row['To']}`);
            console.log('Extracted file codes:', fileCodes);
    
            const tableRows = await page.locator('table tbody tr').all();
            for (let i = 0; i < Math.min(tableRows.length, fileCodes.length); i++) {
                const row = tableRows[i];
                const displayedCode = await row.locator('td:nth-child(2)').innerText();
                expect(displayedCode.trim()).toBe(fileCodes[i]);
            }
            console.log('✅ First 10 codes validated successfully.');
        } catch (err) {
            console.error('🚨 An error occurred:', err);
            throw err; // Ensure test fails on error
        }
    });
});
