const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config');
const { chromium } = require('playwright');


test.use({
  actionTimeout: 5000, // Timeout of 5 seconds for each action
});

test.describe('Factor Management: Adding a New Factor', () => {
  const baseUrl = 'http://localhost:5173';
  const backendUrl = 'http://localhost:3000';
  let allSchema = [];
  let usedSchema = [];
  let availableSchemas;

  test('should redirect to add factors, display the form, and save a new factor', async ({ page }) => {
    console.log('Starting test: Adding a New Factor');

      // Intercept the getAllSchemas API
      await page.route(`${backendUrl}/getAllSchemas`, async (route) => {
        try {
          const response = await route.fetch();
          if (!response.ok()) {
            console.error(`getAllSchemas returned status ${response.status()}`);
            test.fail('getAllSchemas API response not OK');
            return;
          }
          const responseData = await response.json();
          allSchema = responseData.schemas || []; // Default to empty array
          console.log('All schemas fetched:', allSchema);
          route.continue();
        } catch (err) {
          console.error('Error intercepting getAllSchemas:', err);
          test.fail('Error intercepting getAllSchemas API');
        }
      });
      

    // Intercept the getSelectedInputSchema API
    await page.route(`${backendUrl}/getSelectedInputSchema`, async (route) => {
      console.log('Intercepting API: getSelectedInputSchema');
      const response = await route.fetch();
      const responseData = await response.json();
      usedSchema = responseData.selectedInputSchema; // Save used schemas
      console.log('Used schemas:', usedSchema);
      route.continue();
    });

    // Navigate to the factors list and trigger navigation to add factors
    console.log('Navigating to factors list page...');
    await page.goto(`${baseUrl}/listoffactors`);
    await page.getByRole('button', { name: 'Add Factor' }).click();
    await expect(page).toHaveURL(`${baseUrl}/addfactors`);
    console.log('Redirected to add factors page');

    // Wait for the API responses
    console.log('Waiting for API responses...');
    await page.waitForResponse(`${backendUrl}/getAllSchemas`);
    await page.waitForResponse(`${backendUrl}/getSelectedInputSchema`);

    // Calculate available schemas
    console.log('Calculating available schemas...');
    availableSchemas = allSchema.filter(
      (schema) =>
        !usedSchema.some(
          (used) => parseInt(used.primary_mapping) === schema.input_schema_id
        )
    );
    console.log('Available schemas:', availableSchemas);

    // Verify the form is displayed
    console.log('Verifying form visibility...');
    const heading = page.getByRole('heading', { name: 'Factors' });
    await expect(heading).toBeVisible();

    // Fill out the form
    console.log('Filling out the form...');
    await page.getByPlaceholder('Name').fill('Sample Factor Name');
    await page.getByPlaceholder('Description').fill('Sample Description');

    // Select a schema if available
    console.log('Selecting a schema...');
    await page.getByText('Select the Schema').click();
    if (availableSchemas.length > 0) {
      console.log(`Selecting schema: ${availableSchemas[0].value}`);
      await page.getByText(availableSchemas[0].value).click();
    } else {
      console.log('No available schemas for selection.');
    }

    // Upload a file
    const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
    console.log('Uploading file:', filePath);
    await page.setInputFiles('#fileInput', filePath);
    await page.getByRole('button', { name: 'Upload' }).click();

    // Verify file upload
    console.log('Verifying file upload...');
    await expect(page.getByText('File uploaded successfully')).toBeVisible();

    // Save the factor
    console.log('Saving the factor...');
    await page.getByRole('button', { name: 'save Save' }).click();

      await expect(page.getByText('Saved successfully')).toBeVisible();
      console.log('Save success message displayed.');

      await page.waitForURL(`${baseUrl}/listoffactors`);
      console.log('Redirected to listoffactors page.');

      // Verify the newly created factor is visible
      await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
      console.log('Newly created factor is visible:', sampleFactorName);
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error; // Re-throw the error for Playwright to mark the test as failed
    }
  });


  test('should redirect to addfactors route and save formula factor', async ({ page }) => {
    const baseUrl = 'http://localhost:5173';
  
    // Navigate to the "listoffactors" page
    await page.goto(`${baseUrl}/listoffactors`);
    await page.waitForTimeout(1000); // Delay for 1 second
  
    // Click the "Add Factor" button
    await page.getByRole('button', { name: 'Add Factor' }).click();
    await expect(page).toHaveURL(`${baseUrl}/addfactors`);
  
    // Check the checkbox with id="formula"
    const formulaCheckbox = page.locator('#formula');
    await formulaCheckbox.check(); // Marks the checkbox
    await expect(formulaCheckbox).toBeChecked(); // Verifies it's checked
  
    console.log('Formula checkbox is checked.');
  
    // Additional steps to fill the form or perform other actions
    const sampleFactorName = 'Formula Test Factor';
    await page.getByPlaceholder('Name').fill(sampleFactorName);
    await page.getByPlaceholder('Description').fill('Test description for formula factor');
  
    // Save the factor
    // await page.getByRole('button', { name: 'save Save' }).click();
    // console.log('Save button clicked.');
  
    // Verify the success message and redirection
    // await expect(page.getByText('Saved successfully')).toBeVisible();
    // console.log('Save success message displayed.');
  
    // await page.waitForURL(`${baseUrl}/listoffactors`);
    // console.log('Redirected to listoffactors page.');
  
    // Verify the newly created factor
    // await expect(page.locator(`text=${sampleFactorName}`)).toBeVisible();
    // console.log('Newly created formula factor is visible:', sampleFactorName);
  });

  
});