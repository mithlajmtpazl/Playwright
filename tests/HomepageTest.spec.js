// Importing 'test' and 'expect' from Playwright's testing library.
// 'test' is used to define a test block, and 'expect' is used for assertions.
const { test, expect } = require('@playwright/test');


test('render initial page', async ({page})=>{
    //navigating to the frontend page

    await page.goto('http://localhost:5173')

     const pageTitle = await page.title() 
    console.log(pageTitle)

    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page).toHaveTitle('DOFR - User Management')
    

})
