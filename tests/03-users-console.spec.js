const { test, expect } = require('@playwright/test');

test('检查用户管理页面控制台错误', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];
  
  // 监听控制台消息
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  // 监听请求失败
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()}`);
  });
  
  // 登录
  await page.goto('https://www.guandongfang.cn/admin/');
  await page.waitForTimeout(2000);
  
  const usernameInput = page.locator('input[type="text"]').first();
  await usernameInput.fill('admin');
  
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('admin123');
  
  const loginButton = page.getByRole('button', { name: '立即登录' });
  await loginButton.click();
  
  await page.waitForTimeout(3000);
  
  // 点击用户管理菜单
  const userMenu = page.locator('text=用户管理').first();
  await userMenu.click();
  await page.waitForTimeout(5000);
  
  // 打印所有错误
  console.log('\n========== 控制台消息 ==========');
  consoleMessages.forEach(msg => console.log(msg));
  
  console.log('\n========== 页面错误 ==========');
  errors.forEach(err => console.log(err));
  
  // 检查网络请求
  const response = await page.waitForResponse(
    response => response.url().includes('/api/v1/admin/users'),
    { timeout: 5000 }
  ).catch(() => null);
  
  if (response) {
    console.log('\n========== API响应 ==========');
    console.log('Status:', response.status());
    const body = await response.text();
    console.log('Body:', body.substring(0, 500));
  } else {
    console.log('\n========== 未捕获到用户API请求 ==========');
  }
});

