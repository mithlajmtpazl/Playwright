const { test, expect } = require('@playwright/test');



    test.describe('factors modules test listng page test',()=>{   //describe is used to group test
                const baseUrl = 'http://localhost:5173'

        test.beforeEach(async ({ page }) => { //beforeEach make this test executed before each test in the describe block
            // Navigate to the factors listing page before each test
            await page.goto(`${baseUrl}/listoffactors`)
          });

          test('show factors when api returns data',async ({page})=>{
            
          })




        
    })




    // test('test', async ({ page }) => {
    //     await page.goto('http://localhost:5173/listoffactors');
    //     await page.getByPlaceholder('Search Factors...').click();
    //     await page.getByRole('button', { name: 'Search' }).click();
    //     await page.getByText('Total Records:').click();
    //     await page.getByLabel('Go to page').click();
    //     await page.getByLabel('Go to previous page').click();
    //     const downloadPromise = page.waitForEvent('download');
    //     await page.getByRole('button', { name: 'Download' }).click();
    //     const download = await downloadPromise;
    //     await page.getByText('Factors ListAdd FactorDownload').click();
    //     await page.getByRole('button', { name: 'Add Factor' }).click();
    //     const a = await page.getByRole('heading', { name: 'Factors' }).click();
    //     console.log(a);

    //   });