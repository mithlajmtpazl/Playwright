const { test, expect } = require('@playwright/test');
const config = require('./../configureModule/config');
const fs = require('fs');


test.describe('Service Module - modular testing ', () => {
    const tokenData = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    const token = tokenData.token;
    test('TC-042 validating delete button for rule', async ({ page, request }) => {
        const uniqueName = `RuleTest-${Date.now()}`; // Unique name for each test
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

            // **3. Open Query Modal for Factors**
            console.log('Opening Query modal...');
            await page.getByRole('img', { name: 'queryIcon' }).click();
            await page.waitForTimeout(1000); // Ensure modal is open

            // **4. Fetch Factor Types Dynamically**
            console.log('Fetching factors list from API...');
            

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
           

            await page.getByRole('button', { name: '⋮' }).click();
            await page.getByRole('button', { name: 'Delete' }).click();
            await page.getByRole('button', { name: 'Yes, I\'m sure' }).click();




            // // **6. Save the Service**
            console.log('Saving the Service...');
            await page.locator('div').filter({ hasText: /^Save$/ }).click();

            // // Wait for confirmation message
            await page.waitForSelector('text=At least one rule is required for a service', { timeout: 7000 });

         } catch (error) {
            console.error('Test failed with error:', error);
            throw error; // Ensure test fails properly
        }
    })

    test(' TC-043 Deleting a component in service', async ({ page, request }) => {
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
            const factorResponse = await request.get(`${config.backendUrl}/getallfactortypes`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            expect(factorResponse.ok()).toBeTruthy();
    
            const factorTypes = await factorResponse.json();
            console.log('Factor types fetched:', factorTypes);
    
            // **6. Add Factors One by One**
            

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
               
    
                // Click Add Rule or Add Component based on condition
                    console.log('Clicking "Add Component" button...');
                    await page.getByRole('button', { name: 'component Component' }).click();
                    console.log('Clicking "Add Rule" button...');
         
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
            await page.getByRole('button', { name: '⋮' }).nth(1).click()
            await page.getByText('Search').click();
    
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
              await page.getByLabel('Search Codes').getByTestId('CloseIcon').click();
              const childInput = page.locator(
                '.flex > div > div:nth-child(2) > div:nth-child(2) > div input[placeholder="Enter the Codes"]'
            );
            await childInput.fill(coderange.toString());
            
            } catch (error) {
              console.error('Error:', error);
            }

            // await page.locator('.text-end').click();
        //  await page.getByRole('button', { name: 'Yes, I\'m sure' }).click();
        //  await page.waitForSelector('text=Component deleted successfully', { timeout: 7000 });


    
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

            console.log('Selecting the first service to edit...');
            await page.getByRole('button', { name: '⋮' }).first().click();
            await page.getByRole('link', { name: 'Edit' }).click();
            console.log('Edit Service page loaded successfully.');

            await page.getByRole('button').nth(2).click();
            await page.getByRole('button', { name: 'Yes, I\'m sure' }).click()

            await page.waitForTimeout(1000)
            await page.waitForSelector('text=Component deleted successfully', { timeout: 7000 });

            //expect the component to be deleted and not present in the ui
        } catch (error) {
            console.error('Test failed:', error);
            throw error; // Rethrow the error to fail the test in Playwright
        }
    });
    
})
