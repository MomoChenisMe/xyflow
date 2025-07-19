import { test, expect } from '@playwright/test';

test.describe('Simple Angular XYFlow Test', () => {
  test('should connect to server and load basic page', async ({ page }) => {
    // Set longer timeout for debugging
    test.setTimeout(120000);
    
    // Go to the page
    await page.goto('/');
    
    // Wait for any content to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any JavaScript errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    // Check for basic elements
    const body = await page.locator('body').textContent();
    console.log('Body content preview:', body?.substring(0, 200));
    
    // Check if app-root exists
    await expect(page.locator('app-root')).toBeAttached();
    
    // Check if the page has loaded some content
    expect(body?.length).toBeGreaterThan(0);
  });
});