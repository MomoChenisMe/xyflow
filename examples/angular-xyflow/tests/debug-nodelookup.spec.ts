import { test, expect } from '@playwright/test';

test.describe('Debug NodeLookup', () => {
  test('should check nodeLookup contents', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    // Inject debugging into the page to check nodeLookup
    await page.addInitScript(() => {
      // Wait for Angular to load and then check the store state
      setTimeout(async () => {
        console.log('🔍 Checking nodeLookup after page load...');
        
        // Try to find the Angular Flow service or store
        const elements = document.querySelectorAll('*');
        for (let element of elements) {
          const ngComponent = (element as any).ngComponent;
          if (ngComponent) {
            console.log('🔍 Found Angular component:', ngComponent.constructor.name);
          }
        }
        
        // Try to access the store through window if it's exposed
        if ((window as any).angularFlowStore) {
          const state = (window as any).angularFlowStore.getState();
          console.log('🔍 Store state:', {
            nodesCount: state.nodes?.length,
            nodeLookupSize: state.nodeLookup?.size,
            nodeLookupKeys: Array.from(state.nodeLookup?.keys() || [])
          });
        } else {
          console.log('🔍 No store found on window');
        }
        
        // Check if nodes exist in DOM
        const nodeElements = document.querySelectorAll('[data-id]');
        console.log('🔍 DOM nodes found:', nodeElements.length);
        nodeElements.forEach((el, i) => {
          console.log(`🔍 DOM node ${i}:`, el.getAttribute('data-id'));
        });
        
      }, 3000);
    });

    await page.goto('/');
    await page.waitForTimeout(5000);

    // Try clicking a handle to trigger the nodeLookup check
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection to check nodeLookup...');
      await sourceHandle.click();
      await page.waitForTimeout(300);
      await targetHandle.click();
      await page.waitForTimeout(500);
    }

    // Filter all logs for debugging
    const debugLogs = logs.filter(log => 
      log.includes('🔍') || 
      log.includes('NodeLookup check') ||
      log.includes('Store state') ||
      log.includes('nodes count') ||
      log.includes('DOM node')
    );

    console.log('\n=== NODE LOOKUP DEBUG LOGS ===');
    debugLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END DEBUG LOGS ===\n');
  });
});