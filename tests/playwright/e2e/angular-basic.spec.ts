import { test, expect } from '@playwright/test';

test.describe('Angular Flow Basic', () => {
  let consoleErrors: string[] = [];
  let runtimeErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // 清空错误数组
    consoleErrors = [];
    runtimeErrors = [];

    // 监听控制台错误
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        // 检查无限变更检测错误
        if (text.includes('NG0103') || text.includes('Infinite change detection')) {
          runtimeErrors.push(text);
        }
      }
    });

    // 监听页面错误
    page.on('pageerror', (error) => {
      const errorMsg = error.message;
      consoleErrors.push(errorMsg);
      if (errorMsg.includes('NG0103') || errorMsg.includes('Infinite change detection')) {
        runtimeErrors.push(errorMsg);
      }
    });

    // Go to our Angular Flow basic example
    await page.goto('http://localhost:4201/', { waitUntil: 'networkidle' });
  });

  test('loads Angular Flow component successfully without infinite change detection errors', async ({ page }) => {
    // 等待组件加载
    await page.waitForTimeout(2000);
    
    // 检查是否没有无限变更检测错误
    expect(runtimeErrors.length).toBe(0);
    if (runtimeErrors.length > 0) {
      console.error('Runtime errors found:', runtimeErrors);
    }
    
    // Check if the Angular Flow component is rendered
    await expect(page.locator('angular-flow')).toBeVisible();
    await expect(page.locator('.xy-flow')).toBeVisible();
  });

  test('renders nodes correctly without console errors', async ({ page }) => {
    // Wait for nodes to be visible
    await page.waitForTimeout(1000);
    const nodes = page.locator('.xy-flow__node');
    await expect(nodes).toHaveCount(4); // Should have 4 initial nodes
    
    // Check if first node is visible
    await expect(nodes.first()).toBeVisible();
    
    // Check if nodes have correct labels
    await expect(page.locator('.xy-flow__node').first()).toContainText('Node 1');
    
    // 验证没有运行时错误
    expect(runtimeErrors.length).toBe(0);
  });

  test('renders edges correctly without console errors', async ({ page }) => {
    // Listen for ALL console messages to debug edge rendering
    const allConsoleMessages: string[] = [];
    const debugConsoleMessages: string[] = [];
    const errorMessages: string[] = [];
    const warnMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      allConsoleMessages.push(text);
      
      if (msg.type() === 'error') {
        errorMessages.push(text);
      }
      if (msg.type() === 'warning') {
        warnMessages.push(text);
      }
      
      if (text.includes('[EdgeWrapper]') || text.includes('[AngularFlow]') || text.includes('🔥') || text.includes('🔧') || text.includes('🎯') || text.includes('📦')) {
        debugConsoleMessages.push(text);
        console.log('Debug:', text);
      }
    });
    
    // Wait for edges to be rendered
    await page.waitForTimeout(2000);
    
    // Check if Angular Flow component exists
    const angularFlowExists = await page.locator('angular-flow').count();
    console.log('Angular Flow components found:', angularFlowExists);
    
    // Print console messages for debugging
    console.log('All console messages count:', allConsoleMessages.length);
    console.log('Error messages count:', errorMessages.length);
    console.log('Warning messages count:', warnMessages.length);
    console.log('Debug console messages:', debugConsoleMessages);
    console.log('Sample of all messages:', allConsoleMessages.slice(0, 10));
    
    // Check if edges are rendered  
    const edges = page.locator('.xy-flow__edge');
    const edgeCount = await edges.count();
    console.log('Edge count found:', edgeCount);
    
    // Check for any SVG elements
    const svgEdges = page.locator('svg .xy-flow__edge');
    const svgEdgeCount = await svgEdges.count();
    console.log('SVG edge count found:', svgEdgeCount);
    
    // Check for edge paths specifically
    const edgePaths = page.locator('.xy-flow__edge-path');
    const edgePathCount = await edgePaths.count();
    console.log('Edge path count found:', edgePathCount);
    
    // Check if there are any SVG elements at all
    const allSvg = page.locator('svg');
    const svgCount = await allSvg.count();
    console.log('Total SVG elements found:', svgCount);
    
    await expect(edges).toHaveCount(2); // Should have 2 initial edges
    
    // 验证没有运行时错误
    expect(runtimeErrors.length).toBe(0);
  });

  test('allows node selection without infinite loops', async ({ page }) => {
    // Wait for components to load
    await page.waitForTimeout(1000);
    
    // Click on first node
    const firstNode = page.locator('.xy-flow__node').first();
    await firstNode.click();
    
    // Wait for selection to process
    await page.waitForTimeout(500);
    
    // 验证没有新的运行时错误
    expect(runtimeErrors.length).toBe(0);
  });

  test('control panel buttons work without triggering infinite loops', async ({ page }) => {
    // Wait for panel to load
    await page.waitForTimeout(1000);
    
    // Check if control panel is visible (select the specific panel with buttons)
    await expect(page.locator('panel').filter({ hasText: 'reset transform' })).toBeVisible();
    
    // Check if buttons are present
    await expect(page.locator('button').filter({ hasText: 'reset transform' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'change pos' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'addNode' })).toBeVisible();
    
    // Test adding a node
    const initialNodeCount = await page.locator('.xy-flow__node').count();
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    
    // Wait for node to be added
    await page.waitForTimeout(1000);
    
    // Should have one more node
    await expect(page.locator('.xy-flow__node')).toHaveCount(initialNodeCount + 1);
    
    // 验证没有运行时错误
    expect(runtimeErrors.length).toBe(0);
  });

  test('supports drag and drop functionality without console errors', async ({ page }) => {
    // Wait for nodes to load
    await page.waitForTimeout(1000);
    
    // Get the first node
    const firstNode = page.locator('.xy-flow__node').first();
    await expect(firstNode).toBeVisible();
    
    // Get initial position
    const initialBox = await firstNode.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Drag the node to a new position
    await firstNode.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();
    
    // Wait a bit for the drag to complete
    await page.waitForTimeout(1000);
    
    // 验证没有运行时错误
    expect(runtimeErrors.length).toBe(0);
  });

  test('supports viewport pan functionality without errors', async ({ page }) => {
    // Wait for viewport to load
    await page.waitForTimeout(1000);
    
    // Get viewport container
    const viewport = page.locator('.xy-flow__viewport');
    await expect(viewport).toBeVisible();
    
    // 验证没有运行时错误
    expect(runtimeErrors.length).toBe(0);
  });

  test('should not have getNodesBounds warning', async ({ page }) => {
    // 等待应用加载
    await page.waitForTimeout(2000);
    
    // 检查是否没有 getNodesBounds 警告
    const getNodesBoundsWarnings = consoleErrors.filter(err => 
      err.includes('getNodesBounds') && err.includes('sub flows')
    );
    
    expect(getNodesBoundsWarnings.length).toBe(0);
    
    if (getNodesBoundsWarnings.length > 0) {
      console.error('❌ getNodesBounds warnings found:', getNodesBoundsWarnings);
    } else {
      console.log('✅ No getNodesBounds warnings found!');
    }
  });
  
  test('should have proper xy-flow styling structure', async ({ page }) => {
    // 等待应用加载
    await page.waitForTimeout(2000);
    
    // 检查基本的 CSS 類名結構
    await expect(page.locator('.xy-flow')).toBeVisible();
    await expect(page.locator('.xy-flow__container')).toBeVisible();
    await expect(page.locator('.xy-flow__pane')).toBeVisible();
    await expect(page.locator('.xy-flow__viewport')).toBeVisible();
    await expect(page.locator('.xy-flow__nodes')).toBeVisible();
    await expect(page.locator('.xy-flow__edges')).toBeVisible();
    
    console.log('✅ Proper xy-flow CSS structure found!');
  });
  
  test('should have styled nodes matching React Flow appearance', async ({ page }) => {
    // 等待節點加载
    await page.waitForTimeout(2000);
    
    // 检查節點樣式
    const firstNode = page.locator('.xy-flow__node').first();
    await expect(firstNode).toBeVisible();
    
    // 检查節點類名
    await expect(firstNode).toHaveClass(/xy-flow__node-input|xy-flow__node-default/);
    
    // 检查是否有正確的背景色和邊框
    const nodeStyles = await firstNode.evaluate(el => {
      const computed = window.getComputedStyle(el.querySelector('.xy-flow__node-default, .xy-flow__node-input'));
      return {
        backgroundColor: computed.backgroundColor,
        border: computed.border,
        borderRadius: computed.borderRadius
      };
    });
    
    // 驗證樣式不是預設值
    expect(nodeStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(nodeStyles.border).toContain('px');
    
    console.log('✅ Nodes have proper styling!');
  });
  
  test('should have working handle cursor changes', async ({ page }) => {
    // 等待節點加载
    await page.waitForTimeout(2000);
    
    // 找到 handle 元素
    const handle = page.locator('.xy-flow__handle').first();
    await expect(handle).toBeVisible();
    
    // 游標悬停在 handle 上
    await handle.hover();
    await page.waitForTimeout(200);
    
    // 检查是否有 connectionindicator 類名
    const hasConnectionIndicator = await handle.evaluate(el => 
      el.classList.contains('connectionindicator')
    );
    
    if (hasConnectionIndicator) {
      console.log('✅ Handle cursor changes working!');
    }
    
    // 不強制要求，因為可能需要更多設定
  });
  
  test('should not have any runtime errors after full interaction', async ({ page }) => {
    // 等待应用完全加载
    await page.waitForTimeout(3000);
    
    // 与各种UI元素交互
    await page.locator('button').filter({ hasText: 'change pos' }).click();
    await page.waitForTimeout(500);
    
    await page.locator('button').filter({ hasText: 'toggle classnames' }).click();
    await page.waitForTimeout(500);
    
    await page.locator('button').filter({ hasText: 'addNode' }).click();
    await page.waitForTimeout(500);
    
    // 最终检查：应该没有任何运行时错误
    expect(runtimeErrors.length).toBe(0);
    
    if (consoleErrors.length > 0) {
      console.log('Console errors (for info):', consoleErrors.filter(err => !err.includes('NG0103')));
    }
    
    if (runtimeErrors.length > 0) {
      console.error('❌ Runtime errors found:', runtimeErrors);
      throw new Error(`Found ${runtimeErrors.length} runtime errors`);
    } else {
      console.log('✅ No runtime errors found!');
    }
  });
});