import { test, expect } from '@playwright/test';
const config = require('./../configureModule/config');

test.describe('Delete Non-Existent Service by Mimicking Backend Response', () => {
  const baseUrl = config.baseUrl;
  const backendUrl = config.backendUrl;

  test('TC-047 Mock API response and attempt to delete a non-existent service', async ({ page, context }) => {
    // Step 1: Intercept the request and provide a mocked response
    await context.route(`${backendUrl}/listservices?searchterm&page=1&limit=10`, async (route) => {
      // Mimic the backend response with a fake service
      const mockedResponse = {
        totalRecords: 1,
        totalComponentsRecords: 0,
        totalPages: 1,
        currentPage: 1,
        data: [
          {
            service: {
              service_name: 'FakeService-NonExistent',
              service_id: 999999, // Non-existent ID
              service_description: 'This is a fake service for testing purposes.',
              create_date: new Date().toISOString(),
              missing_word: [],
              components: []
            }
          }
        ]
      };

      // Fulfill the intercepted request with the mocked response
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(mockedResponse),
      });
    });

    // Step 2: Navigate to the service list page
    await page.goto(`${baseUrl}/listofservices`);
    await page.waitForSelector('text=List of Services', { state: 'visible' });
    await page.waitForTimeout(1000); // 2000 milliseconds = 2 seconds


    // Step 3: Attempt to delete the fake service
    await page.locator('.service_dots').last().click(); // Assuming it's the only item in the list
    await page.waitForTimeout(1000); // 2000 milliseconds = 2 seconds

    await page.locator('#serviceDeleteButton').click();
    await page.waitForTimeout(1000); // 2000 milliseconds = 2 seconds


    // Step 4: Validate the error message
    const errorMessage = await page.locator('text=Service not found').isVisible(); // currently its showing not found 404
    expect(errorMessage).toBeTruthy(); // Adjust the selector and message as per your app's behavior

    await page.waitForTimeout(1000); // 2000 milliseconds = 2 seconds

    // Step 5: Ensure the UI remains functional
    await expect(page).toHaveURL(`${baseUrl}/listofservices`);
    console.log('UI is stable after attempting to delete a non-existent service.');
  });
});
