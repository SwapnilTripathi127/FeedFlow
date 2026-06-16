const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  try {
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle' });
    // Wait 5 seconds just to see what settles
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'ig_screenshot.png' });
    console.log('Screenshot saved to ig_screenshot.png');
    console.log('Title:', await page.title());
    console.log('URL:', page.url());
    
    // Check if username input exists
    const inputs = await page.$$eval('input', els => els.map(e => e.name));
    console.log('Inputs found:', inputs);
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
