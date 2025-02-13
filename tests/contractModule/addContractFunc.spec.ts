const { test, expect } = require('@playwright/test');
const axios = require('axios');
const config = require('./../configureModule/config');
const fs = require('fs');


test.describe('Form Automation Test', () => {
  let contractVersionId;

  test('should add and edit a contract, and validate contract_version_id', async ({ page }) => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;
    const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    const token = tokenData.token;


    // Fetch data with error handling
    let healthPlans, ipaList, hospitalList;
    try {
      const [plansResponse, ipaResponse, hospitalsResponse] = await Promise.all([
        axios.get(`${backendUrl}/plans`,{
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${backendUrl}/ipa`,{
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${backendUrl}/hospitals`,{
          headers: { Authorization: `Bearer ${token}` },
        }),
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
    // await page.check('input[value="dualOrFull"]');
    await page.selectOption('select[name="hospital_id"]', `${randomHospital.hospital_id}`);

    const apiResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/update-contract') && response.status() === 200
    );

    await page.getByRole('button', { name: 'Add Version' }).click();
    

    const apiResponse = await apiResponsePromise;
    const responseBody = await apiResponse.json();


    const successMessageLocator = await page.getByText('Contract added successfully');
    await expect(successMessageLocator).toBeVisible();

    console.log('Contract added successfully');


    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0]; // Get tomorrow's date in YYYY-MM-DD format
    
    await page.locator('#effective_date_from').fill(today.toISOString().split('T')[0]); // Today's date
    await page.locator('#effective_date_to').fill(tomorrowFormatted); // Tomorrow's date

    await page.getByRole('button', { name: 'Save Version' }).click()

    const successMessageLocator2 = await page.getByText('Version created successfully');
    await expect(successMessageLocator2).toBeVisible();
    await page.waitForTimeout(4000)

    await page.getByRole('link').nth(2).click()
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);


      // Locate all checkboxes in the table
      await page.getByRole('link').nth(2).click()
      const checkboxes = await page.locator('#input-checkbox');
      const checkboxCount = await checkboxes.count();
      console.log(`Number of checkboxes: ${checkboxCount}`);

//     // Select a random checkbox and tick it
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
