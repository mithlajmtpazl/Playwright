const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Service Module - Add Service Functionality', () => {
  test('Add Service - Positive Flow', async ({ page }) => {
    // Unique test data
    const uniqueName = `Demoservice-${Date.now()}`;
    const serviceDescription = 'Test Description';
    const componentName = 'TestComponentOne';
    const componentDescription = 'TestComponentDescription';
    const childInputValue = '2,3';

    try {
      // Navigate to the Add Service page
      console.log('Navigating to the Add Service page...');
      await page.goto(`${config.baseUrl}/addservice`);
      await page.waitForTimeout(1000); // Allow the page to load fully
      await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
      console.log('Successfully navigated to Add Service page.');

      // Fill in the "Name" field
      console.log('Filling in the Name field...');
      const nameField = page.getByPlaceholder('Name');
      await nameField.click();
      await page.waitForTimeout(500); // Minor delay for UI stabilization
      await nameField.fill('');
      await nameField.fill(uniqueName);
      console.log(`Filled Name field with: ${uniqueName}`);
      await expect(nameField).toHaveValue(uniqueName);

      // Fill in the "Description" field
      console.log('Filling in the Description field...');
      const descriptionField = page.getByPlaceholder(' Enter  Your Description');
      await descriptionField.click();
      await page.waitForTimeout(500);
      await descriptionField.fill('');
      await descriptionField.fill(serviceDescription);
      console.log(`Filled Description field with: ${serviceDescription}`);
      await expect(descriptionField).toHaveValue(serviceDescription);

      // Check the "hospitalClaims" checkbox
      console.log('Marking the hospitalClaims checkbox...');
      const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
      await hospitalClaimsCheckbox.check();
      await page.waitForTimeout(500);
      const isChecked = await hospitalClaimsCheckbox.isChecked();
      expect(isChecked).toBeTruthy();
      console.log(`Checkbox checked status: ${isChecked}`);

      // Add Query
      console.log('Adding Query...');
      await page.getByRole('img', { name: 'queryIcon' }).click();
      const queryInput = page.getByPlaceholder('Enter the Codes');
      await queryInput.fill('2');
      await page.waitForTimeout(500);
      console.log('Query added with value: 2');
      await expect(queryInput).toHaveValue('2');

      // Add Component
      console.log('Adding Component...');
      await page.getByRole('button', { name: 'component Component' }).click();
      const componentNameField = page.locator('input[name="name"]');
      await componentNameField.fill(componentName);
      console.log(`Filled Component Name with: ${componentName}`);
      await expect(componentNameField).toHaveValue(componentName);

      const componentDescriptionField = page.locator('input[name="description"]');
      await componentDescriptionField.fill(componentDescription);
      console.log(`Filled Component Description with: ${componentDescription}`);
      await expect(componentDescriptionField).toHaveValue(componentDescription);

      // Add Criteria
      console.log('Adding Criteria...');
      await page.locator('span').filter({ hasText: 'Criteria' }).nth(2).click();
      await page.waitForTimeout(500);

      // Fill the child input field inside the specific div
      console.log('Filling the child input field with specific placeholder...');
      const childInput = page.locator(
        '.flex > div > div:nth-child(2) > div:nth-child(2) > div input[placeholder="Enter the Codes"]'
      );
      await childInput.fill(childInputValue);
      console.log(`Filled the child input field with value: ${childInputValue}`);
      await expect(childInput).toHaveValue(childInputValue);

      // Save the Service
      console.log('Saving the Service...');
      const saveButton = page.locator('div').filter({ hasText: /^Save$/ });
      await saveButton.click();
      await page.waitForTimeout(1000); // Wait for save confirmation to appear
      const successMessage = page.getByText('Service saved successfully');
      await expect(successMessage).toBeVisible();
      console.log('Service saved successfully message displayed.');

      // Verify redirection to the List of Services page
      console.log('Verifying redirection to the List of Services page...');
      await page.waitForURL(`${config.baseUrl}/listofservices`);
      await expect(page).toHaveURL(`${config.baseUrl}/listofservices`);
      console.log('Redirected to List of Services page.');

      // Verify the newly created service is visible
      console.log('Verifying the newly created service...');
      const createdService = page.locator(`text=${uniqueName}`);
      await expect(createdService).toBeVisible();
      console.log(`Newly created service is visible: ${uniqueName}`);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error; // Re-throw the error to mark the test as failed
    }
  });
});
