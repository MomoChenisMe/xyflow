import { test, expect } from '@playwright/test';

test.describe('Angular XYFlow Simple Drag Debug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/examples/basic');
    await page.waitForSelector('.react-flow__nodes', { timeout: 10000 });
  });

  test('debug node drag functionality', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser console: ${msg.type()} - ${msg.text()}`);
    });

    // Wait for nodes to be rendered
    await page.waitForSelector('.xy-flow__node', { timeout: 5000 });
    
    // Get initial position of first node
    const node = await page.locator('.xy-flow__node').first();
    const initialBox = await node.boundingBox();
    console.log('Initial position:', initialBox);

    // Try to drag the node
    await node.hover();
    await page.mouse.down();
    await page.waitForTimeout(100); // Small delay
    
    // Move mouse
    await page.mouse.move(
      initialBox!.x + initialBox!.width / 2 + 100,
      initialBox!.y + initialBox!.height / 2 + 100,
      { steps: 10 }
    );
    
    await page.waitForTimeout(100); // Small delay
    await page.mouse.up();

    // Wait a bit for position update
    await page.waitForTimeout(500);

    // Check final position
    const finalBox = await node.boundingBox();
    console.log('Final position:', finalBox);

    // Verify the node moved
    expect(finalBox!.x).not.toBe(initialBox!.x);
    expect(finalBox!.y).not.toBe(initialBox!.y);
  });

  test('check node drag events', async ({ page }) => {
    // Inject console tracker
    await page.evaluate(() => {
      window.dragEvents = [];
      const originalLog = console.log;
      console.log = (...args) => {
        originalLog(...args);
        const message = args.join(' ');
        if (message.includes('drag') || message.includes('MOUSE') || message.includes('NodeWrapper')) {
          window.dragEvents.push(message);
        }
      };
    });

    // Wait for nodes
    await page.waitForSelector('.xy-flow__node', { timeout: 5000 });
    
    // Try to drag
    const node = await page.locator('.xy-flow__node').first();
    await node.hover();
    await page.mouse.down();
    await page.mouse.move(300, 300, { steps: 5 });
    await page.mouse.up();

    // Get captured events
    const events = await page.evaluate(() => window.dragEvents);
    console.log('\nCaptured drag events:');
    events.forEach(event => console.log('  -', event));

    // Check if drag events were triggered
    expect(events.some(e => e.includes('handleMouseDown'))).toBe(true);
    expect(events.some(e => e.includes('drag start'))).toBe(true);
  });
});