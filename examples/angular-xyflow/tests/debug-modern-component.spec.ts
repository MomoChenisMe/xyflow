import { test, expect } from '@playwright/test';

/**
 * Debug test for the Angular Basic Modern Component
 * This test helps us understand what's actually being rendered
 */

test.describe('Debug Angular Basic Modern Component', () => {
  test('should show what elements are actually present in DOM', async ({ page }) => {
    // Navigate to the page
    await page.goto('/');
    
    // Wait a bit for Angular to bootstrap
    await page.waitForTimeout(2000);
    
    // Get the page title to verify it loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get all elements in the body
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Body content length:', bodyContent.length);
    console.log('Body content (first 1000 chars):', bodyContent.substring(0, 1000));
    
    // Check what the main app element contains
    const appRoot = await page.locator('app-basic').innerHTML();
    console.log('App root content (first 500 chars):', appRoot.substring(0, 500));
    
    // Check if router outlet is working
    const routerOutlet = page.locator('router-outlet');
    console.log('Router outlet present:', await routerOutlet.count());
    
    // Check what's actually being rendered in the router outlet
    const routerContent = await page.locator('router-outlet ~ *').innerHTML();
    console.log('Router content:', routerContent.substring(0, 500));
    
    // Check if our component is present with any selector
    const modernComponent = page.locator('app-angular-basic-modern');
    console.log('Modern component count:', await modernComponent.count());
    
    if (await modernComponent.count() > 0) {
      const modernContent = await modernComponent.innerHTML();
      console.log('Modern component content:', modernContent.substring(0, 500));
    }
    
    // Check for any Angular components
    const allElements = await page.$$eval('*', (elements) => 
      elements.map(el => el.tagName.toLowerCase()).filter(tag => 
        tag.includes('app-') || tag.includes('angular-') || tag.includes('xy-')
      )
    );
    console.log('Angular-like elements:', allElements);
    
    // This test always passes, it's just for debugging
    expect(true).toBe(true);
  });

  test('should check for JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    const logs: string[] = [];
    
    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      } else if (msg.type() === 'log') {
        logs.push(`Console log: ${msg.text()}`);
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    console.log('Errors:', errors);
    console.log('Logs (first 10):', logs.slice(0, 10));
    
    // Report if there are critical errors
    const criticalErrors = errors.filter(err => 
      err.includes('Cannot find module') || 
      err.includes('ReferenceError') || 
      err.includes('TypeError')
    );
    
    console.log('Critical errors:', criticalErrors);
    
    expect(true).toBe(true);
  });
});