import { test, expect } from '@playwright/test';

test.describe('React Flow Feature Comparison', () => {
  test('should have basic flow elements like React Flow', async ({ page }) => {
    await page.goto('/');
    
    // Check main structure
    await expect(page.locator('app-root')).toBeVisible();
    await expect(page.locator('simple-flow')).toBeVisible();
    
    // Check flow container (equivalent to ReactFlow component)
    await expect(page.locator('.flow-container')).toBeVisible();
    
    // Check nodes (equivalent to React Flow nodes)
    const nodes = page.locator('.node');
    await expect(nodes).toHaveCount(2);
    
    // Check that nodes have content
    await expect(nodes.nth(0)).toHaveText('Node 1');
    await expect(nodes.nth(1)).toHaveText('Node 2');
    
    // Check SVG for edges (equivalent to React Flow edges)
    await expect(page.locator('svg')).toBeVisible();
    await expect(page.locator('svg path')).toBeVisible();
    
    // Check that nodes are positioned absolutely (like React Flow)
    const node1 = page.locator('.node').nth(0);
    const node1Style = await node1.getAttribute('style');
    expect(node1Style).toContain('position: absolute');
    
    // Check basic interactivity
    await node1.hover();
    await node1.click();
    
    // Take screenshot for visual comparison
    await page.screenshot({ path: 'angular-flow-features.png' });
  });
  
  test('should display node count (equivalent to React Flow state)', async ({ page }) => {
    await page.goto('/');
    
    // Check that node count is displayed (equivalent to React Flow state management)
    await expect(page.locator('text=Node count: 2')).toBeVisible();
  });
  
  test('should have proper layout and styling', async ({ page }) => {
    await page.goto('/');
    
    // Check container dimensions
    const container = page.locator('.flow-container');
    const containerBox = await container.boundingBox();
    
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
    
    // Check that nodes are properly spaced
    const node1Box = await page.locator('.node').nth(0).boundingBox();
    const node2Box = await page.locator('.node').nth(1).boundingBox();
    
    expect(Math.abs((node1Box?.x || 0) - (node2Box?.x || 0))).toBeGreaterThan(50);
    expect(Math.abs((node1Box?.y || 0) - (node2Box?.y || 0))).toBeGreaterThan(50);
  });
  
  test('should support basic React Flow features', async ({ page }) => {
    await page.goto('/');
    
    // Features that should be present (similar to React Flow):
    
    // 1. Multiple nodes
    await expect(page.locator('.node')).toHaveCount(2);
    
    // 2. Visual connections between nodes
    await expect(page.locator('svg path')).toBeVisible();
    
    // 3. Hover interactions
    const node = page.locator('.node').first();
    await node.hover();
    
    // 4. Click interactions
    await node.click();
    
    // 5. Proper positioning
    const nodes = page.locator('.node');
    for (let i = 0; i < await nodes.count(); i++) {
      const nodeStyle = await nodes.nth(i).getAttribute('style');
      expect(nodeStyle).toContain('position: absolute');
    }
    
    // 6. SVG rendering for connections
    await expect(page.locator('svg')).toHaveAttribute('style', /position: absolute/);
    
    // 7. Arrow markers (like React Flow) - check if they exist
    await expect(page.locator('svg marker')).toHaveCount(1);
  });
});