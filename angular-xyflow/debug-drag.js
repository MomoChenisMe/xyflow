// 簡單的腳本來測試拖拽功能
const puppeteer = require('puppeteer');

async function debugDragFunctionality() {
  console.log('🔍 開始調試 Angular Flow 拖拽功能...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // 監聽頁面控制台輸出
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔧') || text.includes('🎯') || text.includes('✅') || text.includes('❌')) {
      console.log(`[頁面日志] ${text}`);
    }
  });
  
  try {
    console.log('📍 導航到 Angular Flow 應用...');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
    
    console.log('🔍 等待節點載入...');
    await page.waitForSelector('.angular-flow__node', { timeout: 10000 });
    
    console.log('📊 檢查頁面狀態...');
    const nodeCount = await page.$$eval('.angular-flow__node', nodes => nodes.length);
    console.log(`找到 ${nodeCount} 個節點`);
    
    if (nodeCount === 0) {
      throw new Error('沒有找到任何節點');
    }
    
    const firstNode = await page.$('.angular-flow__node');
    const nodeInfo = await firstNode.evaluate(el => ({
      id: el.getAttribute('data-node-id'),
      classes: el.className,
      style: el.getAttribute('style'),
      position: {
        left: el.style.left,
        top: el.style.top,
        transform: el.style.transform
      }
    }));
    
    console.log('🔍 第一個節點信息:', nodeInfo);
    
    console.log('🖱️ 嘗試點擊節點...');
    await firstNode.click();
    await page.waitForTimeout(500);
    
    console.log('🖱️ 嘗試懸停在節點上...');
    await firstNode.hover();
    await page.waitForTimeout(500);
    
    console.log('🖱️ 測試拖拽功能...');
    const initialBox = await firstNode.boundingBox();
    console.log('初始位置:', initialBox);
    
    // 嘗試拖拽
    await page.mouse.move(initialBox.x + initialBox.width/2, initialBox.y + initialBox.height/2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    await page.mouse.move(initialBox.x + 100, initialBox.y + 100);
    await page.waitForTimeout(100);
    
    await page.mouse.up();
    await page.waitForTimeout(1000);
    
    const finalBox = await firstNode.boundingBox();
    console.log('最終位置:', finalBox);
    
    const moved = Math.abs(finalBox.x - initialBox.x) > 50 || Math.abs(finalBox.y - initialBox.y) > 50;
    
    if (moved) {
      console.log('✅ 拖拽成功！節點位置已改變');
    } else {
      console.log('❌ 拖拽失敗！節點位置沒有改變');
    }
    
    console.log('🔍 等待 5 秒以便檢查...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  } finally {
    await browser.close();
  }
}

// 檢查是否安裝了 puppeteer
try {
  debugDragFunctionality();
} catch (error) {
  console.error('需要安裝 puppeteer: npm install puppeteer');
  console.error('或者手動測試：打開 http://localhost:4200 並嘗試拖拽節點');
}