const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Adding a New Factor - Negative Test Cases', () => {
  const baseUrl = 'http://localhost:5173';
  const backendUrl = 'http://localhost:3000';


  test('should throw an error when required fields are empty', async({page})=>{
    console.log('Testing empty form submission...');
    await page.goto(`${baseUrl}/addfactors`);

    await page.getByRole('button', { name: 'save Save' }).click();
    await expect(page.getByText('Please fill all the required fields.')).toBeVisible();

    console.log('Validation error messages are displayed for empty fields.');
  })

  test('should throw an error for invalid schema selection',async ({page})=>{
    console.log('Testing invalid schema selection...');
    await page.goto(`${baseUrl}/addfactors`);

    const sampleFactorName = Date.now().toString();
      console.log('Filling out form with Factor Name:', sampleFactorName);
      await page.getByPlaceholder('Name').fill(sampleFactorName);
      await page.getByPlaceholder('Description').fill('test Description')
      const filePath = path.resolve(__dirname, '../../assets/Spec_sample_codes.xlsx');
      console.log('Uploading file from path:', filePath);
      await page.getByRole('button', { name: 'Upload' }).click();
      await page.setInputFiles('#fileInput', filePath);
      await page.getByRole('button', { name: 'Upload' }).click();
      console.log('File uploaded.');

      // Verify file upload success message
      await expect(page.getByText('File uploaded successfully')).toBeVisible();
      console.log('File upload success message displayed.');

      await page.getByRole('button', { name: 'save Save' }).click();
      await expect(page.getByText('Please fill all the required fields.')).toBeVisible();
  })

  test('should show an error for invalid file upload', async ({ page }) => {
    console.log('Testing invalid file upload...');
    await page.goto(`${baseUrl}/addfactors`);

    // Upload an unsupported file format
    const invalidFilePath = path.resolve(__dirname, '../../assets/a-fail-pass-checkbox-with-red-fail-checked-WPHN08.webp');

    await page.getByRole('button', { name: 'Upload' }).click();
    await page.setInputFiles('#fileInput', invalidFilePath);

    // Check for error message
    await expect(page.getByText('Only xlsx and csv files are allowed.')).toBeVisible();
    console.log('Error message for invalid file format is displayed.');
  });

  test('should handle oversized file uploads gracefully', async ({ page }) => {
    console.log('Testing oversized file upload...');
    await page.goto(`${baseUrl}/addfactors`);

    // Upload an oversized file
    const oversizedFilePath = path.resolve(__dirname, '../../assets/oversized_file.xlsx');
    await page.getByRole('button', { name: 'Upload' }).click();
    await page.setInputFiles('#fileInput', oversizedFilePath);

    // Check for error message
    await expect(page.getByText('File is too large')).toBeVisible();
    console.log('Error message for oversized file is displayed.');
  });
})