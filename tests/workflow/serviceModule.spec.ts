const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Service Module - Test', () => {
    let baseUrl = config.baseUrl
    let backendUrl = config.backendUrl
    test('Add a new service with multiple factors and component', async ({ page, request }) => {
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
                let factorDropDown = index === 0 
                    ? page.locator('#FactorsDropdown')
                    : page.locator(`#FactorsDropdown`).nth(index);

                let selectedCodes = index === 0 
                    ? page.locator('#CodesInput')
                    : page.locator(`#CodesInput`).nth(index);

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

        } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    });

    test('Edit', async ({ page }) => {
        const updatedServiceName = `Edited Service - ${Date.now()}`; // Unique name for the test
        const updatedDescription = 'Updated Description for the service';

        try {
            // **1. Navigate to Service List Page**
            console.log('Navigating to the Service List page...');
            await page.goto(`${baseUrl}/listofservices`, { timeout: 15000 });
            await page.waitForLoadState('networkidle');
            console.log('Successfully reached the Service List page.');

            // **2. Select a Service to Edit**
            console.log('Selecting the first service to edit...');
            await page.getByRole('button', { name: '⋮' }).first().click();
            await page.getByRole('link', { name: 'Edit' }).click();
            console.log('Edit Service page loaded successfully.');

            // **3. Edit Service Fields**
            console.log('Updating service name...');
            const serviceNameField = page.locator('input[name="service_name"]');
            await serviceNameField.fill(updatedServiceName);
            await expect(serviceNameField).toHaveValue(updatedServiceName);

            console.log('Updating service description...');
            const descriptionField = await page.locator('input[name="service_description"]');
            await descriptionField.fill(updatedDescription);
            await expect(descriptionField).toHaveValue(updatedDescription);

            console.log('Managing the checkboxes...');
            const professionalClaimsCheckbox = page.locator('#professionalClaims').first();
            const hospitalClaimsCheckbox = page.locator('#hospitalClaims').first();

            // Uncheck "Hospital Claims" if it is checked
            if (await hospitalClaimsCheckbox.isChecked()) {
                console.log('Unchecking Hospital Claims checkbox...');
                await hospitalClaimsCheckbox.uncheck();
                expect(await hospitalClaimsCheckbox.isChecked()).toBeFalsy();
            } else {
                console.log('Hospital Claims checkbox is already unchecked.');
            }

            // Check "Professional Claims" if it is not checked
            if (!(await professionalClaimsCheckbox.isChecked())) {
                console.log('Checking Professional Claims checkbox...');
                await professionalClaimsCheckbox.check();
                expect(await professionalClaimsCheckbox.isChecked()).toBeTruthy();
            } else {
                console.log('Professional Claims checkbox is already checked.');
            }

            // **4. Save the Changes**
            console.log('Saving the changes...');
            await page.locator('div').filter({ hasText: /^Save$/ }).click();

            // **5. Verify Success Message**
            console.log('Verifying the success message...');
            await page.waitForSelector('text=Service saved successfully', { timeout: 7000 });
            console.log('Service updated successfully!');

            // **6. Validate Changes in the Service List**
            console.log('Validating the updated service in the Service List...');
            await page.goto(`${baseUrl}/listofservices`, { timeout: 15000 });
            await page.waitForLoadState('networkidle');
            const updatedServiceLocator = page.locator(`text=${updatedServiceName}`);
            await expect(updatedServiceLocator).toBeVisible({ timeout: 5000 });
            console.log('Updated service is successfully displayed in the list.');

        } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    });


    test('validate add rule',async({page})=>{
    })


     test('Delete a single service from the service list page', async ({ page, request }) => {
            // Step 1: Navigate to the service list page
            await page.goto(`${baseUrl}/listofservices`);
        
            // Step 2: Wait until the "List of Services" is visible
            await page.waitForSelector('text=List of Services', { state: 'visible' });
        
            // Step 3: Fetch the list of services via the API
            const response = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`);
            const serviceData = await response.json();
        
            if (serviceData.data.length === 0) {
                console.log('No services found to delete.');
                return;
            }
        
            const serviceName = serviceData.data[0].service.service_name;
        
            // Step 4: Delete the first service
            // Click the 3-dot menu for the first service
            await page.locator('.service_dots').first().click();
        
            // Step 5: Wait for the modal to appear
            // await page.waitForSelector('#serviceDeleteModal', { state: 'visible', timeout: 5000 }); // Ensure the modal is visible
        
            // Step 6: Click the "Delete" button
            await page.locator('#serviceDeleteButton').click();
            await page.waitForTimeout(1000); // 2000 milliseconds = 2 seconds
        
            // Wait for the success message (assumed to be "Service deleted successfully!")
            await page.waitForSelector('text=Service deleted successfully!', { timeout: 5000 });
        
            console.log(`Service Deleted: ${serviceName}`);
        
            // Wait for the success message to disappear
            // await page.getByText('Service deleted successfully!').nth(3)
        
            // Step 7: Validate that the service has been deleted
            const finalResponse = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`);
            const finalServiceData = await finalResponse.json();
        
            expect(finalServiceData.data.some(service => service.service.service_name === serviceName)).toBe(false);
        
            console.log(`Service '${serviceName}' successfully deleted!`);
        });

});



