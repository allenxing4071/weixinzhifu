const { test, expect } = require('@playwright/test');

test('调试用户管理页面', async ({ page }) => {
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
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: '/tmp/user-page.png', fullPage: true });
  
  // 打印页面文本内容
  const bodyText = await page.locator('body').textContent();
  console.log('页面内容:', bodyText.substring(0, 500));
  
  // 打印所有网络请求
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API: ${response.status()} ${response.url()}`);
    }
  });
  
  await page.waitForTimeout(2000);
});

