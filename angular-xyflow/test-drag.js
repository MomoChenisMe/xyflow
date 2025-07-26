// Simple Node.js script to test drag functionality
const puppeteer = require('puppeteer');

async function testNodeDragging() {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  
  try {
    console.log('🔧 Navigating to Angular Flow app...');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
    
    console.log('🔧 Waiting for Angular Flow component to load...');
    await page.waitForSelector('.angular-flow__node', { timeout: 10000 });
    
    console.log('🔧 Finding first node...');
    const firstNode = await page.$('.angular-flow__node');
    if (!firstNode) {
      throw new Error('No nodes found');
    }
    
    console.log('🔧 Getting initial position...');
    const initialBox = await firstNode.boundingBox();
    console.log('Initial position:', initialBox);
    
    console.log('🔧 Performing drag operation...');
    // Hover over the node
    await page.hover('.angular-flow__node');
    
    // Start drag
    await page.mouse.down();
    console.log('Mouse down at:', initialBox.x + initialBox.width/2, initialBox.y + initialBox.height/2);
    
    // Move to new position
    const newX = initialBox.x + 100;
    const newY = initialBox.y + 100;
    await page.mouse.move(newX, newY);
    console.log('Moving to:', newX, newY);
    
    // Release mouse
    await page.mouse.up();
    console.log('Mouse up');
    
    // Wait for position to update
    await page.waitForTimeout(1000);
    
    console.log('🔧 Checking new position...');
    const newBox = await firstNode.boundingBox();
    console.log('New position:', newBox);
    
    // Check if position changed
    const moved = Math.abs(newBox.x - initialBox.x) > 50 || Math.abs(newBox.y - initialBox.y) > 50;
    
    if (moved) {
      console.log('✅ Node dragging is working! Position changed from', 
        `(${initialBox.x}, ${initialBox.y})`, 'to', `(${newBox.x}, ${newBox.y})`);
    } else {
      console.log('❌ Node dragging is NOT working! Position did not change significantly.');
      console.log('Difference:', {
        x: newBox.x - initialBox.x,
        y: newBox.y - initialBox.y
      });
    }
    
    // Keep browser open for manual inspection
    console.log('🔧 Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNodeDragging();