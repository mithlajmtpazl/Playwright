const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Service Editing Functional Tests ', () => {
    const baseUrl = config.baseUrl;

    test('Edit an existing service and verify changes', async ({ page }) => {
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


});
