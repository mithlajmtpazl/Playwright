const { test, expect } = require('@playwright/test');
const axios = require('axios');
const config = require('./../configureModule/config');

test.describe('Form Automation Test', () => {
  let contractVersionId;

  test('should add and edit a contract, and validate contract_version_id', async ({ page }) => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;

    // Fetch data with error handling
    let healthPlans, ipaList, hospitalList;
    try {
      const [plansResponse, ipaResponse, hospitalsResponse] = await Promise.all([
        axios.get(`${backendUrl}/plans`),
        axios.get(`${backendUrl}/ipa`),
        axios.get(`${backendUrl}/hospitals`),
      ]);

      healthPlans = plansResponse.data.data;
      ipaList = ipaResponse.data.data;
      hospitalList = hospitalsResponse.data.data;
    } catch (error) {
      console.error('Error fetching API data:', error);
      throw new Error('Failed to fetch test data.');
    }

    if (!healthPlans.length || !ipaList.length || !hospitalList.length) {
      throw new Error('One or more data sources returned empty results.');
    }

    const randomPlan = healthPlans[Math.floor(Math.random() * healthPlans.length)];
    const randomIPA = ipaList[Math.floor(Math.random() * ipaList.length)];
    const randomHospital = hospitalList[Math.floor(Math.random() * hospitalList.length)];

    await page.goto(`${baseUrl}/addcontract`);
    await page.waitForLoadState('networkidle');

    const randomName = `Health Contract ${Date.now()}`;
    const randomDescription = `Description ${Date.now()}`;

    await page.fill('input[placeholder="Health Net Contract"]', randomName);
    await page.fill('input[placeholder="Description"]', randomDescription);
    await page.selectOption('select[name="health_plan_id"]', `${randomPlan.health_plan_id}`);
    await page.selectOption('select[name="ipa_id"]', `${randomIPA.ipa_id}`);
    await page.check('input[value="dualOrFull"]');
    await page.selectOption('select[name="hospital_id"]', `${randomHospital.hospital_id}`);

    const apiResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/update-contract') && response.status() === 200
    );

    await page.click('button:has-text("Add & Save Version")');

    const apiResponse = await apiResponsePromise;
    const responseBody = await apiResponse.json();
    contractVersionId = responseBody.data.newVersion[0].contract_version_id;

    console.log(`Intercepted Contract Version ID: ${contractVersionId}`);

    const successMessageLocator = await page.getByText('Contract added successfully');
    await expect(successMessageLocator).toBeVisible();

    console.log('Contract added successfully');

    await page.getByRole('link').nth(2).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const expectedUrl = `${baseUrl}/contracts/${contractVersionId}`;
    const currentUrl = page.url();
    expect(currentUrl).toBe(expectedUrl);

    // Locate all checkboxes in the table
    const checkboxes = await page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    // Select a random checkbox and tick it
    if (checkboxCount > 0) {
      const randomIndex = Math.floor(Math.random() * checkboxCount);
      await checkboxes.nth(randomIndex).click();
      console.log(`Random checkbox at index ${randomIndex} clicked.`);
    } else {
      console.warn('No checkboxes found to select.');
    }

    const editedName = `Edited Contract ${Date.now()}`;
    const editedDescription = `Edited Description ${Date.now()}`;

    await page.fill('input[placeholder="Description"]', editedDescription);

    expect(await page.inputValue('input[placeholder="Description"]')).toBe(editedDescription);
// Locate the "Save DOFR" button
const saveButton = page.getByRole('button', { name: 'Save DOFR' });

// Assert that the button is visible
await expect(saveButton).toBeVisible();

// Click the button
await saveButton.click();
console.log('Button with text "Save DOFR" clicked successfully.');

// Optionally, check for any success message or state change after clicking the button
const successMessage = page.getByText('Contract updated successfully!');
await expect(successMessage).toBeVisible();


  });
});
