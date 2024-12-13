const { test, expect } = require('@playwright/test');
const path = require('path');
const config = require('./../configureModule/config');

/**
 * Factors Editing Functional Tests
 *
 * Tests for editing field and formula factors, including uploading files and verifying factor details.
 */
test.describe('Factors Editing Functional Tests', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;
  let fieldFactors = [];
  let formulaFactors = [];

  // Fetch factors data before each test
  test.beforeEach(async ({ request }) => {
    console.log('Fetching factor data from API...');
    const response = await request.get(`${backendUrl}/getFactorsList?search=&page=1&limit=10`, { timeout: 10000 });
    expect(response.ok()).toBeTruthy(); // Ensure API call is successful

    const responseBody = await response.json();
    fieldFactors = responseBody.factorList.filter(factor => factor.factor_type === 'field');
    formulaFactors = responseBody.factorList.filter(factor => factor.factor_type === 'formula');

    console.log('Field Factors:', fieldFactors.map(factor => factor.factor_name));
    console.log('Formula Factors:', formulaFactors.map(factor => factor.factor_name));
  });

  // Test for editing field factors
  test('Edit field factors and verify uploaded data', async ({ page }) => {
    console.log('Navigating to field factors page...');
    await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });

    // Validate and click on the first field factor
    const factorName = fieldFactors[0].factor_name;
    console.log(`Looking for field factor: ${factorName}`);
    const factorLocator = page.locator(`text=| ${factorName}`);
    await expect(factorLocator).toBeVisible({ timeout: 5000 });
    console.log('Field factor is visible, clicking on it...');
    await factorLocator.click();

    // Wait for the page to navigate to the factor details
    const expectedUrl = `${baseUrl}/listoffactors/${fieldFactors[0].factor_type_id}`;
    console.log(`Waiting for URL to change to: ${expectedUrl}`);
    await page.waitForURL(expectedUrl, { timeout: 10000 });

    // Upload the file
    console.log('Uploading file...');
    await page.getByRole('button', { name: 'Upload' }).click();
    const filePath = path.resolve(__dirname, '../../assets/Proc_smaple_codes.xlsx');
    await page.setInputFiles('#fileInput', filePath);
    await page.getByRole('button', { name: 'Upload' }).click();

    // Verify the upload success message
    console.log('Verifying upload success message...');
    await expect(page.getByText('File uploaded successfully')).toBeVisible({ timeout: 5000 });
    console.log('File uploaded successfully and verified.');
  });

  // Test for editing formula factors
  test('Edit formula factors and navigate to details page', async ({ page }) => {
    console.log('Navigating to formula factors page...');
    await page.goto(`${baseUrl}/listoffactors`, { timeout: 15000 });

    // Validate and click on the first formula factor
    const factorName = formulaFactors[0].factor_name;
    console.log(`Looking for formula factor: ${factorName}`);
    const factorLocator = page.locator(`text=| ${factorName}`);
    await expect(factorLocator).toBeVisible({ timeout: 5000 });
    console.log('Formula factor is visible, clicking on it...');
    await factorLocator.click();

    // Wait for the page to navigate to the factor details
    const expectedUrl = `${baseUrl}/listoffactors/${formulaFactors[0].factor_type_id}`;
    console.log(`Waiting for URL to change to: ${expectedUrl}`);
    await page.waitForURL(expectedUrl, { timeout: 10000 });
    console.log('Navigated to formula factor details page successfully.');
// Locate the factor name on the new page
const factorNameOnDetailsPage = page.locator('text=' + factorName); // Adjust the locator as needed
await expect(factorNameOnDetailsPage).toBeVisible();
  });
});