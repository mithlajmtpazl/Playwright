import { test, expect } from '@playwright/test';
import { waitForDebugger } from 'inspector';
const config = require('./../configureModule/config');

test.describe('Delete One service', () => {
    const baseUrl = config.baseUrl;
    const backendUrl = config.backendUrl;

    test('Delete a single service from the service list page', async ({ page, request }) => {
        // Step 1: Navigate to the service list page
        await page.goto(`${baseUrl}/listofservices`);
    
        // Step 2: Wait until the "List of Services" is visible
        await page.waitForSelector('text=List of Services', { state: 'visible' });
    
        // Step 3: Fetch the list of services via the API
        const response = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`);
        const serviceData = await response.json();
    
        if (serviceData.data.length === 0) {
            console.log('No services found to delete.');
            return;
        }
    
        const serviceName = serviceData.data[0].service.service_name;
    
        // Step 4: Delete the first service
        // Click the 3-dot menu for the first service
        await page.locator('.service_dots').first().click();
    
        // Step 5: Wait for the modal to appear
        // await page.waitForSelector('#serviceDeleteModal', { state: 'visible', timeout: 5000 }); // Ensure the modal is visible
    
        // Step 6: Click the "Delete" button
        await page.locator('#serviceDeleteButton').click();
        await page.waitForTimeout(1000); // 2000 milliseconds = 2 seconds
    
        // Wait for the success message (assumed to be "Service deleted successfully!")
        await page.waitForSelector('text=Service deleted successfully!', { timeout: 5000 });
    
        console.log(`Service Deleted: ${serviceName}`);
    
        // Wait for the success message to disappear
        // await page.getByText('Service deleted successfully!').nth(3)
    
        // Step 7: Validate that the service has been deleted
        const finalResponse = await request.get(`${backendUrl}/listservices?searchterm&page=1&limit=10`);
        const finalServiceData = await finalResponse.json();
    
        expect(finalServiceData.data.some(service => service.service.service_name === serviceName)).toBe(false);
    
        console.log(`Service '${serviceName}' successfully deleted!`);
    });
    
});
