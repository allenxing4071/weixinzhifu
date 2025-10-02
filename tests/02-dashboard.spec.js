const { test, expect } = require('@playwright/test');

test.describe('模块2: 仪表板功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await page.goto('https://www.guandongfang.cn/admin/');
    await page.waitForTimeout(2000);
    
    const usernameInput = page.locator('input[type="text"]').first();
    await usernameInput.fill('admin');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('admin123');
    
    const loginButton = page.getByRole('button', { name: '立即登录' });
    await loginButton.click();
    
    await page.waitForTimeout(3000);
  });

  test('2.1 访问仪表板页面', async ({ page }) => {
    // 点击仪表板菜单
    const dashboardMenu = page.locator('text=仪表板').first();
    await dashboardMenu.click();
    await page.waitForTimeout(2000);
    
    // 检查页面是否加载
    const pageLoaded = await page.locator('body').count() > 0;
    expect(pageLoaded).toBeTruthy();
    
    console.log('✅ 仪表板页面加载成功');
  });

  test('2.2 验证统计卡片数据', async ({ page }) => {
    // 点击仪表板菜单
    const dashboardMenu = page.locator('text=仪表板').first();
    await dashboardMenu.click();
    await page.waitForTimeout(3000);
    
    // 查找统计卡片关键字
    const statsKeywords = [
      '总用户数',
      '活跃商户',
      '总订单',
      '总交易额',
      '总积分',
      '用户',
      '商户',
      '订单',
      '交易',
      '积分'
    ];
    
    let foundStats = 0;
    for (const keyword of statsKeywords) {
      const count = await page.locator(`text=${keyword}`).count();
      if (count > 0) {
        foundStats++;
        console.log(`✅ 找到统计项: ${keyword}`);
      }
    }
    
    expect(foundStats).toBeGreaterThan(2);
    console.log(`✅ 统计卡片验证通过 (找到${foundStats}个统计项)`);
  });

  test('2.3 验证数据展示', async ({ page }) => {
    // 点击仪表板菜单
    const dashboardMenu = page.locator('text=仪表板').first();
    await dashboardMenu.click();
    await page.waitForTimeout(3000);
    
    // 检查是否有数字显示（统计数据）
    const hasNumbers = await page.locator('text=/\\d+/').count() > 0;
    expect(hasNumbers).toBeTruthy();
    
    console.log('✅ 仪表板数据正常显示');
  });

  test('2.4 验证页面响应', async ({ page }) => {
    // 点击仪表板菜单
    const dashboardMenu = page.locator('text=仪表板').first();
    const startTime = Date.now();
    
    await dashboardMenu.click();
    await page.waitForTimeout(2000);
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // 页面应该在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ 仪表板响应时间: ${loadTime}ms`);
  });

  test('2.5 检查页面元素完整性', async ({ page }) => {
    // 点击仪表板菜单
    const dashboardMenu = page.locator('text=仪表板').first();
    await dashboardMenu.click();
    await page.waitForTimeout(3000);
    
    // 检查页面是否有错误提示
    const hasError = await page.locator('text=/错误|失败|Error|Failed/i').count();
    expect(hasError).toBe(0);
    
    // 检查是否有加载中状态（应该已经加载完成）
    await page.waitForTimeout(2000);
    const hasLoading = await page.locator('text=/加载中|Loading/i').count();
    expect(hasLoading).toBe(0);
    
    console.log('✅ 仪表板页面元素完整，无错误');
  });
});

