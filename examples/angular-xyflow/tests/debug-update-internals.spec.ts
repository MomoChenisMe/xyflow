import { test, expect } from '@playwright/test';

test.describe('Debug Update Internals', () => {
  test('should check if updateNodeInternals is called', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(5000); // Wait longer for everything to load

    // Filter logs for updateNodeInternals
    const updateLogs = logs.filter(log => 
      log.includes('updateNodeInternals') ||
      log.includes('Processing nodes for internals update') ||
      log.includes('handle bounds') ||
      log.includes('DOM element not found') ||
      log.includes('No domNode available')
    );

    console.log('\n=== UPDATE INTERNALS LOGS ===');
    updateLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END UPDATE LOGS ===\n');

    // Also check what nodes exist in the nodeLookup
    const lookupLogs = logs.filter(log => 
      log.includes('nodeLookup') ||
      log.includes('setNodes') ||
      log.includes('Node from lookup')
    );

    console.log('\n=== NODE LOOKUP LOGS ===');
    lookupLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END LOOKUP LOGS ===\n');

    // Check all logs for any mention of nodes
    const nodeLogs = logs.filter(log => 
      log.includes('node') && !log.includes('NodeLookup check')
    );

    console.log('\n=== ALL NODE RELATED LOGS ===');
    nodeLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END NODE LOGS ===\n');
  });
});