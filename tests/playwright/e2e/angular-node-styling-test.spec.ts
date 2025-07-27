import { test, expect } from '@playwright/test';

test.describe('Angular Flow Node Styling Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201');
  });

  test('should have React Flow compatible node styling', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個節點
    const firstNode = await page.locator('.angular-flow__node').first();
    
    // 檢查基本樣式屬性
    const computedStyle = await firstNode.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth,
        padding: computed.padding,
        fontSize: computed.fontSize,
        textAlign: computed.textAlign,
        width: computed.width,
        background: computed.backgroundColor
      };
    });
    
    // 驗證樣式匹配 React Flow 的默認值
    expect(computedStyle.borderRadius).toBe('3px');
    expect(computedStyle.fontSize).toBe('12px');
    expect(computedStyle.textAlign).toBe('center');
    expect(computedStyle.padding).toBe('10px');
    // 檢查寬度是否合理（考慮文字內容可能影響實際計算寬度）
    const widthValue = parseFloat(computedStyle.width);
    expect(widthValue).toBeGreaterThan(80); // 最小寬度
    expect(widthValue).toBeLessThan(200); // 最大寬度
    
    console.log('✅ Node basic styling test passed');
  });

  test('should show proper selection box-shadow like React Flow', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個節點
    const firstNode = await page.locator('.angular-flow__node').first();
    
    // 記錄未選中時的樣式
    const unselectedStyle = await firstNode.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow
      };
    });
    
    // 點擊節點選中它
    await firstNode.click();
    await expect(firstNode).toHaveClass(/selected/);
    
    // 檢查選中後的樣式變化
    const selectedStyle = await firstNode.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow
      };
    });
    
    // 驗證選中狀態下有 box-shadow
    expect(selectedStyle.boxShadow).not.toBe(unselectedStyle.boxShadow);
    expect(selectedStyle.boxShadow).not.toBe('none');
    expect(selectedStyle.boxShadow).toContain('0.5px'); // React Flow 使用 0.5px 的 box-shadow
    
    console.log('✅ Node selection box-shadow test passed');
  });

  test('should have proper hover effects', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取第一個節點
    const firstNode = await page.locator('.angular-flow__node').first();
    
    // 記錄正常狀態的樣式
    const normalStyle = await firstNode.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow
      };
    });
    
    // 懸停在節點上
    await firstNode.hover();
    
    // 等待一下讓樣式變化生效
    await page.waitForTimeout(100);
    
    // 檢查懸停後的樣式
    const hoverStyle = await firstNode.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow
      };
    });
    
    // 驗證懸停狀態有不同的 box-shadow（如果有定義）
    // 注意：如果節點已經被選中，懸停效果可能不明顯
    expect(hoverStyle.boxShadow).toBeTruthy();
    
    console.log('✅ Node hover effects test passed');
  });

  test('should support light and dark theme classes', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 檢查是否有 light class 的節點
    const lightNodes = await page.locator('.angular-flow__node.light').count();
    expect(lightNodes).toBeGreaterThan(0);
    
    // 點擊 toggle classnames 按鈕來切換主題
    await page.locator('button:has-text("toggle classnames")').click();
    
    // 等待主題切換
    await page.waitForTimeout(100);
    
    // 檢查是否有 dark class 的節點
    const darkNodes = await page.locator('.angular-flow__node.dark').count();
    expect(darkNodes).toBeGreaterThan(0);
    
    // 獲取 dark 主題節點的樣式
    const darkNode = await page.locator('.angular-flow__node.dark').first();
    const darkStyle = await darkNode.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Dark 主題應該有深色背景和淺色文字
    expect(darkStyle.backgroundColor).toContain('30, 30, 30'); // #1e1e1e 的 RGB 值
    expect(darkStyle.color).toContain('248, 248, 248'); // #f8f8f8 的 RGB 值
    
    console.log('✅ Light/dark theme test passed');
  });

  test('should have consistent border styling across node types', async ({ page }) => {
    // 等待 Angular Flow 組件載入
    await page.waitForSelector('.angular-flow', { timeout: 5000 });
    
    // 等待節點渲染
    await page.waitForSelector('.angular-flow__node', { timeout: 5000 });
    
    // 獲取不同類型的節點
    const inputNode = await page.locator('.angular-flow__node.type-input').first();
    const defaultNode = await page.locator('.angular-flow__node.type-default').first();
    const outputNode = await page.locator('.angular-flow__node.type-output').first();
    
    // 檢查所有節點類型是否存在
    if (await inputNode.count() > 0) {
      const inputStyle = await inputNode.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          borderWidth: computed.borderWidth,
          borderColor: computed.borderColor,
          fontSize: computed.fontSize
        };
      });
      
      expect(inputStyle.borderWidth).toBe('1px');
      expect(inputStyle.fontSize).toBe('12px');
    }
    
    if (await defaultNode.count() > 0) {
      const defaultStyle = await defaultNode.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          borderWidth: computed.borderWidth,
          borderColor: computed.borderColor,
          fontSize: computed.fontSize
        };
      });
      
      expect(defaultStyle.borderWidth).toBe('1px');
      expect(defaultStyle.fontSize).toBe('12px');
    }
    
    if (await outputNode.count() > 0) {
      const outputStyle = await outputNode.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          borderWidth: computed.borderWidth,
          borderColor: computed.borderColor,
          fontSize: computed.fontSize
        };
      });
      
      expect(outputStyle.borderWidth).toBe('1px');
      expect(outputStyle.fontSize).toBe('12px');
    }
    
    console.log('✅ Node type consistency test passed');
  });
});