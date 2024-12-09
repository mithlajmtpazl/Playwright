const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');

test.describe('Functional Test of Add Service', () => {
  test('functional test for service', async ({ page }) => {
    // Navigate to the add service page
    await page.goto(`${config.baseUrl}/addservice`);

    // Click on the Name field
    await page.getByPlaceholder('Name').click();

    // Clear any existing value in the Name field
    await page.getByPlaceholder('Name').fill('');

    // Write a unique value into the Name field
    const uniqueName = `Demoservice-${Date.now()}`;
    await page.getByPlaceholder('Name').fill(uniqueName);

    console.log('Filled Name field with:', uniqueName);

      await page.getByPlaceholder(' Enter  Your Description').click();

      await page.getByPlaceholder(' Enter  Your Description').fill('');
      await page.getByPlaceholder(' Enter  Your Description').fill('Test Description');

// Ensure the checkbox is checked
console.log('Marking the checkbox as checked...');
await page.locator('input[name="hospitalClaims"]').check();

// Verify that the checkbox is now checked
const isChecked = await page.locator('input[name="hospitalClaims"]').isChecked();
console.log('Checkbox checked status:', isChecked);

  await page.getByRole('img', { name: 'queryIcon' }).click();

  // await page.getByPlaceholder('Enter the Codes').click();
  await page.getByPlaceholder('Enter the Codes').fill('2');
  await page.getByRole('button', { name: 'component Component' }).click();

  
  // await page.getByRole('checkbox').nth(3).check();
  await page.locator('input[name="name"]').fill('TestComponentOne')
  await page.locator('input[name="description"]').fill('TestComponentDescription')

  await page.locator('span').filter({ hasText: 'Criteria' }).nth(2).click();

// Locate the container element
// Locate the parent container first
const container = page.locator('div').filter({ 
  hasText: /^-ANDORAdd RuleAdd GroupclearProcedurea;17337193062801733719615041⋮$/ 
}).nth(2);

// Locate the parent div first and then scope to the child input
const childInput = page.locator(
  '.flex > div > div:nth-child(2) > div:nth-child(2) > div input[placeholder="Enter the Codes"]'
);

// Fill the scoped input field with "hey"
await childInput.fill('2,3');

console.log('Filled the input field inside the child div with value: hey');

await page.locator('div').filter({ hasText: /^Save$/ }).click();



await expect(page.getByText('Service saved successfully')).toBeVisible();
console.log('Save success message displayed.');

await page.waitForURL(`${config.baseUrl}/listofservices`);
console.log('Redirected to listoffactors page.');

// Verify the newly created factor is visible
await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
console.log('Newly created factor is visible:', uniqueName);
  });
});
