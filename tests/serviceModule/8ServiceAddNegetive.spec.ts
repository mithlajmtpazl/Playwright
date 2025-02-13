const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');
const fs= require('fs');




test.describe('Service Module - Negative Test Scenarios For Adding A Service', () => {
  let uniqueServiceName = `DemoService-${Date.now()}`; // Generate a unique name for each test
  const serviceDescription = 'Test Description';
  const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));
      const token = tokenData.token;


  test('TC-030 Error displayed when adding a service without a rule', async ({ page }) => {
    try {
      console.log('[Step 1] Navigating to the Add Service page...');
      await page.goto(`${config.baseUrl}/addservice`, { timeout: 20000 });
      await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
      console.log('[Step 1] Successfully navigated to the Add Service page.');

      console.log('[Step 2] Filling Service Name and Description fields...');
      await page.getByPlaceholder('Name').fill(uniqueServiceName);
      await page.locator('#ServiceDescription').fill(serviceDescription);

      console.log('[Step 3] Selecting Hospital Claims checkbox...');
      const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
      await hospitalClaimsCheckbox.check();
      expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
      console.log('[Step 3] Hospital Claims checkbox is selected.');

      console.log('[Step 4] Attempting to save service without rules...');
      await page.getByRole('img', { name: 'queryIcon' }).click();
      await page.waitForTimeout(1000); // Ensures modal is open
      await page.getByRole('button', { name: 'clear' }).click();
      await page.getByRole('button', { name: "Yes, I'm sure" }).click();
      await page.locator('div').filter({ hasText: /^Save$/ }).click();

      console.log('[Step 5] Verifying error message...');
      await page.waitForSelector('text=At least one rule is required for a service', { timeout: 7000 });
      console.log('[Step 5] Error message displayed as expected.');
    } catch (error) {
      console.error('Test failed due to an error:', error);
      throw error;
    }
   })

  test('TC-031 Error displayed when Service Name contains only spaces', async ({ page }) => {

    try {
      
      console.log('[Step 1] Navigating to the Add Service page...');
      await page.goto(`${config.baseUrl}/addservice`, { timeout: 20000 });
      await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
      console.log('[Step 1] Successfully navigated to the Add Service page.');

      console.log('[Step 2] Filling Service Name with spaces and Description field...');
      await page.getByPlaceholder('Name').fill(' '); // Invalid input
      await page.locator('#ServiceDescription').fill(serviceDescription);

      console.log('[Step 3] Selecting Hospital Claims checkbox...');
      const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
      await hospitalClaimsCheckbox.check();
      expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
      console.log('[Step 3] Hospital Claims checkbox is selected.');

      console.log('[Step 4] Attempting to save service with invalid name...');
      await page.getByRole('img', { name: 'queryIcon' }).click();
      await page.waitForTimeout(1000); // Ensures modal is open
      await page.getByRole('button', { name: '⋮' }).click();
      await page.getByText('Search').click();
      
      let coderange;
     const serviceId = await page.getByPlaceholder('Id').inputValue()
     
      const payload = {
        service_id: serviceId,  // Keep existing service_id
      };
      
      try {
        const response = await fetch(`${config.backendUrl}/createFactorId`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
      
        const data = await response.json();
        console.log('Response:', data);
      
        if (!data.success || !data.data.factor_type_id) {
            throw new Error("Failed to retrieve factor_type_id");
        }
      
        const factorTypeID = data.data.factor_type_id;
        console.log('Factor Type ID:', factorTypeID);
      
        // Second API call: Get All Codes
        const getAllCodesUrl = `${config.backendUrl}/getAllCodes?factor_type=procedure&search_name=&codes=&codesFrom=&codesTo=&filterText=&factorTypeId=${factorTypeID}`;
        
        const codesResponse = await fetch(getAllCodesUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
      
        const codesData = await codesResponse.json();
      
        if (!codesData || codesData.length === 0 || !codesData[0].start_code) {
            throw new Error("Start code not found in response");
        }
      
        // Convert start_code from string to number safely
        const startCode = parseInt(codesData[0].start_code, 10);
        
        if (isNaN(startCode)) {
            throw new Error("Invalid start_code received");
        }
      
        console.log('Start Code as Number:', startCode);
      
        // Store it in a variable
        let coderange = startCode;
      
        // Close the modal or perform UI action
        await page.getByTestId('CloseIcon').click();
      
        // Fill the input field with the converted code (as a string)
        await page.getByPlaceholder('Enter the Codes').fill(coderange.toString());
      
      } catch (error) {
        console.error('Error:', error);
      }
      

    // await page.getByPlaceholder('Enter the Codes').fill('10-20');
      await page.locator('div').filter({ hasText: /^Save$/ }).click();

      console.log('[Step 5] Verifying error message...');
      await page.waitForSelector('text=Make sure to fill all the required fields', { timeout: 7000 });
      console.log('[Step 5] Error message displayed as expected.');
    } catch (error) {
      console.error('Test failed due to an error:', error);
      throw error;
    }
  });

  test('TC-032 Error Dispayed when user tries to save service without specifying code',async({page})=>{
    try {
        console.log('[Step 1] Navigating to the Add Service page...');
        await page.goto(`${config.baseUrl}/addservice`, { timeout: 20000 });
        await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
        console.log('[Step 1] Successfully navigated to the Add Service page.');
  
        console.log('[Step 2] Filling Service Name with spaces and Description field...');
        await page.getByPlaceholder('Name').fill(uniqueServiceName); // Invalid input
        await page.locator('#ServiceDescription').fill(serviceDescription);
  
        console.log('[Step 3] Selecting Hospital Claims checkbox...');
        const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
        await hospitalClaimsCheckbox.check();
        expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
        console.log('[Step 3] Hospital Claims checkbox is selected.');
  
        console.log('[Step 4] Attempting to save service without code...');
        await page.getByRole('img', { name: 'queryIcon' }).click();
        await page.waitForTimeout(1000); // Ensures modal is open
        await page.locator('div').filter({ hasText: /^Save$/ }).click();
  
        console.log('[Step 5] Verifying error message...');
        await page.waitForSelector('text=Make sure to fill all the required fields', { timeout: 7000 });
        console.log('[Step 5] Error message displayed as expected.');
      } catch (error) {
        console.error('Test failed due to an error:', error);
        throw error;
      }
  })

  test('TC-033 ensure service cannot be saved with just a group without rules init', async ({ page }) => {
    try {
      console.log('[Step 1] Navigating to the Add Service page...');
      await page.goto(`${config.baseUrl}/addservice`, { timeout: 20000 });
      await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
      console.log('[Step 1] Successfully navigated to the Add Service page.');
  
      console.log('[Step 2] Filling Service Name with spaces and Description field...');
      await page.getByPlaceholder('Name').fill(uniqueServiceName); // Invalid input
      await page.locator('#ServiceDescription').fill(serviceDescription);
  
      console.log('[Step 3] Selecting Hospital Claims checkbox...');
      const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
      await hospitalClaimsCheckbox.check();
      expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
      console.log('[Step 3] Hospital Claims checkbox is selected.');
  
      console.log('[Step 4] Attempting to save service without code...');
      await page.getByRole('img', { name: 'queryIcon' }).click();
      await page.waitForTimeout(1000); // Ensures modal is open
      await page.getByRole('button', { name: 'clear' }).click();
      await page.getByRole('button', { name: "Yes, I'm sure" }).click();
      await page.getByRole('button', { name: 'Add Group' }).click();
      await page.locator('div').filter({ hasText: /^Save$/ }).click();
  
      console.log('[Step 5] Verifying error message...');
      await page.waitForSelector('text=Make sure to fill all required fields', { timeout: 7000 });
      console.log('[Step 5] Error message displayed as expected.');
    } catch (error) {
      console.error('Test failed due to an error:', error);
      throw error;
    }
  });
  
  test('TC-034 system should not allow user to save service without required fields in component', async ({ page }) => {
    try {
      console.log('[Step 1] Navigating to the Add Service page...');
      await page.goto(`${config.baseUrl}/addservice`, { timeout: 20000 });
      await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
      console.log('[Step 1] Successfully navigated to the Add Service page.');
  
      console.log('[Step 2] Filling Service Name with spaces and Description field...');
      await page.getByPlaceholder('Name').fill(uniqueServiceName); // Invalid input
      await page.locator('#ServiceDescription').fill(serviceDescription);
  
      console.log('[Step 3] Selecting Hospital Claims checkbox...');
      const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
      await hospitalClaimsCheckbox.check();
      expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
      console.log('[Step 3] Hospital Claims checkbox is selected.');
  
      console.log('[Step 4] Attempting to save service with invalid name...');
      await page.getByRole('img', { name: 'queryIcon' }).click();
      await page.waitForTimeout(1000); // Ensures modal is open
      await page.getByPlaceholder('Enter the Codes').fill('10-20');
      await page.getByRole('button', { name: 'component Component' }).click();
  
      console.log('[Step 5] Filling component details...');
      const componentName = `TestComponent-${Date.now()}`;
      const componentDescription = 'Component Description';
  
      const componentNameField = page.locator('input[name="name"]');
      await componentNameField.fill(componentName);
      await expect(componentNameField).toHaveValue(componentName);
  
      const componentDescriptionField = page.locator('input[name="description"]');
      await componentDescriptionField.fill(componentDescription);
      await expect(componentDescriptionField).toHaveValue(componentDescription);
  
      console.log('[Step 6] Attempting to save service without filling all required fields...');
      await page.locator('div').filter({ hasText: /^Save$/ }).click();
  
      console.log('[Step 7] Verifying error message...');
      await page.waitForSelector('text=Make sure to fill all the required fields', { timeout: 7000 });
      console.log('[Step 7] Error message displayed as expected.');
    } catch (error) {
      console.error('Test failed due to an error:', error);
      throw error;
    }
  });  

  test('TC-035 should display error on invalid date',async ({page}) => {

    console.log('[Step 1] Navigating to the Add Service page...');
    await page.goto(`${config.baseUrl}/addservice`, { timeout: 20000 });
    await expect(page).toHaveURL(`${config.baseUrl}/addservice`);
    console.log('[Step 1] Successfully navigated to the Add Service page.');

    console.log('[Step 2] Filling Service Name with spaces and Description field...');
    await page.getByPlaceholder('Name').fill(uniqueServiceName); // Invalid input
    await page.locator('#ServiceDescription').fill(serviceDescription);

    console.log('[Step 3] Selecting Hospital Claims checkbox...');
    const hospitalClaimsCheckbox = page.locator('input[name="hospitalClaims"]');
    await hospitalClaimsCheckbox.check();
    expect(await hospitalClaimsCheckbox.isChecked()).toBeTruthy();
    console.log('[Step 3] Hospital Claims checkbox is selected.');

    console.log('[Step 4] Attempting to save service with invalid name...');
    await page.getByRole('img', { name: 'queryIcon' }).click();
    await page.waitForTimeout(1000); // Ensures modal is open
    await page.getByRole('button', { name: '⋮' }).click();
    await page.getByText('Search').click();
    let coderange;
    const serviceId = await page.getByPlaceholder('Id').inputValue()
    
     const payload = {
       service_id: serviceId,  // Keep existing service_id
     };
     
     try {
       const response = await fetch(`${config.backendUrl}/createFactorId`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`
           },
           body: JSON.stringify(payload)
       });
     
       const data = await response.json();
       console.log('Response:', data);
     
       if (!data.success || !data.data.factor_type_id) {
           throw new Error("Failed to retrieve factor_type_id");
       }
     
       const factorTypeID = data.data.factor_type_id;
       console.log('Factor Type ID:', factorTypeID);
     
       // Second API call: Get All Codes
       const getAllCodesUrl = `${config.backendUrl}/getAllCodes?factor_type=procedure&search_name=&codes=&codesFrom=&codesTo=&filterText=&factorTypeId=${factorTypeID}`;
       
       const codesResponse = await fetch(getAllCodesUrl, {
           method: 'GET',
           headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`
           }
       });
     
       const codesData = await codesResponse.json();
     
       if (!codesData || codesData.length === 0 || !codesData[0].start_code) {
           throw new Error("Start code not found in response");
       }
     
       // Convert start_code from string to number safely
       const startCode = parseInt(codesData[0].start_code, 10);
       
       if (isNaN(startCode)) {
           throw new Error("Invalid start_code received");
       }
     
       console.log('Start Code as Number:', startCode);
     
       // Store it in a variable
       let coderange = startCode;
     
       // Close the modal or perform UI action
       await page.getByTestId('CloseIcon').click();
     
       // Fill the input field with the converted code (as a string)
       await page.getByPlaceholder('Enter the Codes').fill(coderange.toString());
     
     } catch (error) {
       console.error('Error:', error);
     }
    
    const invalidStartDate = '2024-12-31'; // Future date
    const invalidExpiryDate = '2024-12-01'; // Earlier than start date

    await page.locator('#service_startDate').fill(invalidStartDate);
    await page.locator('#service-endDate').fill(invalidExpiryDate);

    // Step 5: Submit the form
    await page.locator('div').filter({ hasText: /^Save$/ }).click();

    // Step 6: Validate the error message
    const errorMessage = await page.locator('text=Effective to date should be greater than effective from date'); // Adjustthe actual error message
    await expect(errorMessage).toBeVisible();

    console.log('Verified: Error message is displayed for invalid date selection.');
  })
});
