const { test, expect } = require('@playwright/test');

test.describe('模块1: 登录功能测试', () => {
  test('1.1 访问登录页面', async ({ page }) => {
    await page.goto('https://www.guandongfang.cn/admin/');
    await page.waitForTimeout(2000);
    
    // 检查是否有登录表单
    const hasLoginForm = await page.locator('input[type="text"], input[placeholder*="用户名"]').count() > 0;
    expect(hasLoginForm).toBeTruthy();
    
    console.log('✅ 登录页面加载成功');
  });

  test('1.2 测试登录功能', async ({ page }) => {
    await page.goto('https://www.guandongfang.cn/admin/');
    await page.waitForTimeout(2000);
    
    // 查找用户名输入框
    const usernameInput = page.locator('input[type="text"]').first();
    await usernameInput.fill('admin');
    
    // 查找密码输入框
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('admin123');
    
    await page.waitForTimeout(500);
    
    // 查找并点击"立即登录"按钮
    const loginButton = page.getByRole('button', { name: '立即登录' });
    await loginButton.click();
    
    // 等待登录完成
    await page.waitForTimeout(3000);
    
    // 检查是否登录成功（URL变化或页面内容）
    const currentUrl = page.url();
    const hasUserInfo = await page.locator('text=系统管理员').count() > 0 || 
                        await page.locator('text=管理员').count() > 0;
    
    expect(hasUserInfo || !currentUrl.includes('login')).toBeTruthy();
    
    console.log('✅ 登录成功');
    console.log('当前URL:', currentUrl);
  });

  test('1.3 验证登录后页面元素', async ({ page }) => {
    // 登录
    await page.goto('https://www.guandongfang.cn/admin/');
    await page.waitForTimeout(2000);
    
    const usernameInput = page.locator('input[type="text"]').first();
    await usernameInput.fill('admin');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('admin123');
    
    // 查找并点击"立即登录"按钮
    const loginButton = page.getByRole('button', { name: '立即登录' });
    await loginButton.click();
    
    await page.waitForTimeout(3000);
    
    // 检查菜单是否存在
    const menuItems = [
      '仪表板',
      '用户管理',
      '商户管理',
      '订单管理',
      '积分管理',
      '系统设置'
    ];
    
    let foundMenus = 0;
    for (const menuItem of menuItems) {
      const count = await page.locator(`text=${menuItem}`).count();
      if (count > 0) {
        foundMenus++;
        console.log(`✅ 找到菜单: ${menuItem}`);
      }
    }
    
    expect(foundMenus).toBeGreaterThan(3);
    console.log(`✅ 登录后页面菜单验证通过 (${foundMenus}/6)`);
  });
});

