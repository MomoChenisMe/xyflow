import { test, expect } from '@playwright/test';

test.describe('Angular XY Flow - Current Implementation', () => {
  test('should load the app with angular-flow-simple component', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main app loads
    await expect(page.locator('app-root')).toBeVisible();
    
    // Check if title is visible
    await expect(page.locator('h1')).toContainText('Angular XY Flow Demo');
    
    // Check if the angular-flow-simple component is visible
    await expect(page.locator('angular-flow-simple')).toBeVisible();
    
    // Check if the flow container is visible
    await expect(page.locator('.flow-container')).toBeVisible();
    
    // Check if the xy-flow component is present
    await expect(page.locator('.xy-flow')).toBeVisible();
  });

  test('should render nodes in the current implementation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow-simple component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Wait for nodes to be rendered
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
    
    // Count nodes
    const nodeCount = await page.locator('.xy-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
    
    // Check if specific initial nodes exist
    await expect(page.locator('.xy-flow__node').first()).toBeVisible();
    
    console.log(`Found ${nodeCount} nodes`);
  });

  test('should render edges in the current implementation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow-simple component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Wait for edges to be rendered
    await page.waitForSelector('.xy-flow__edge', { timeout: 10000 });
    
    // Count edges
    const edgeCount = await page.locator('.xy-flow__edge').count();
    expect(edgeCount).toBeGreaterThan(0);
    
    console.log(`Found ${edgeCount} edges`);
  });

  test('should have interactive controls', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow-simple component to load
    await page.waitForSelector('angular-flow-simple');
    
    // Check if controls are present
    await expect(page.locator('controls')).toBeVisible();
    
    // Check if minimap is present
    await expect(page.locator('minimap')).toBeVisible();
    
    // Check if background is present
    await expect(page.locator('background')).toBeVisible();
  });

  test('should show connection handles on nodes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the angular-flow-simple component to load
    await page.waitForSelector('angular-flow-simple');
    await page.waitForSelector('.xy-flow__node', { timeout: 10000 });
    
    // Check if handles are present
    const handleCount = await page.locator('.xy-flow__handle').count();
    expect(handleCount).toBeGreaterThan(0);
    
    console.log(`Found ${handleCount} connection handles`);
  });

  test('should have info panel with interactive buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check if info panel is visible
    await expect(page.locator('.info-panel')).toBeVisible();
    
    // Check if add node button exists and is clickable
    const addButton = page.locator('button:has-text("Add Node")');
    await expect(addButton).toBeVisible();
    
    // Check if clear button exists
    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).toBeVisible();
    
    // Test adding a node
    const initialNodeCount = await page.locator('.xy-flow__node').count();
    await addButton.click();
    
    // Wait a bit for the node to be added
    await page.waitForTimeout(500);
    
    const newNodeCount = await page.locator('.xy-flow__node').count();
    expect(newNodeCount).toBe(initialNodeCount + 1);
    
    console.log(`Node count increased from ${initialNodeCount} to ${newNodeCount}`);
  });
});