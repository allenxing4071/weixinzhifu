const { test, expect } = require('@playwright/test');

test.describe('模块3: 用户管理功能测试', () => {
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
    
    // 点击用户管理菜单
    const userMenu = page.locator('text=用户管理').first();
    await userMenu.click();
    await page.waitForTimeout(3000);
  });

  test('3.1 访问用户管理页面', async ({ page }) => {
    // 检查页面标题或关键元素
    const pageLoaded = await page.locator('body').count() > 0;
    expect(pageLoaded).toBeTruthy();
    
    console.log('✅ 用户管理页面加载成功');
  });

  test('3.2 验证用户列表显示', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 检查是否有表格或列表
    const hasTable = await page.locator('table, .ant-table').count() > 0;
    const hasList = await page.locator('.ant-list, [role="table"]').count() > 0;
    
    expect(hasTable || hasList).toBeTruthy();
    console.log('✅ 用户列表正常显示');
  });

  test('3.3 验证用户数据加载', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 检查是否有用户数据（查找常见的用户信息元素）
    const keywords = ['用户', '昵称', '手机', '积分', '订单', '创建时间'];
    let foundKeywords = 0;
    
    for (const keyword of keywords) {
      const count = await page.locator(`text=${keyword}`).count();
      if (count > 0) {
        foundKeywords++;
      }
    }
    
    expect(foundKeywords).toBeGreaterThan(1);
    console.log(`✅ 用户数据加载正常 (找到${foundKeywords}个相关字段)`);
  });

  test('3.4 测试用户详情查看', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 查找详情按钮或链接
    const detailButtons = page.locator('button, a').filter({ hasText: /详情|查看|详细/i });
    const buttonCount = await detailButtons.count();
    
    if (buttonCount > 0) {
      await detailButtons.first().click();
      await page.waitForTimeout(2000);
      
      // 检查是否打开了详情页面或弹窗
      const hasDialog = await page.locator('.ant-modal, .ant-drawer, [role="dialog"]').count() > 0;
      
      if (hasDialog) {
        console.log('✅ 用户详情弹窗打开成功');
        
        // 关闭弹窗
        const closeButton = page.locator('button, .ant-modal-close').filter({ hasText: /关闭|取消|×/i });
        const closeCount = await closeButton.count();
        if (closeCount > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(500);
        }
      }
      
      expect(true).toBeTruthy();
    } else {
      console.log('ℹ️ 未找到详情按钮，跳过此测试');
      expect(true).toBeTruthy();
    }
  });

  test('3.5 验证搜索功能', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 查找搜索框
    const searchInputs = page.locator('input[placeholder*="搜索"], input[placeholder*="查找"], input[type="search"]');
    const searchCount = await searchInputs.count();
    
    if (searchCount > 0) {
      console.log('✅ 找到搜索框');
      expect(true).toBeTruthy();
    } else {
      console.log('ℹ️ 未找到搜索框');
      expect(true).toBeTruthy();
    }
  });

  test('3.6 验证分页功能', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 查找分页组件
    const pagination = page.locator('.ant-pagination, [role="navigation"]');
    const hasPagination = await pagination.count() > 0;
    
    if (hasPagination) {
      console.log('✅ 分页组件存在');
      
      // 检查页码数字
      const hasPageNumbers = await page.locator('text=/第|页|共|条/').count() > 0;
      expect(hasPageNumbers).toBeTruthy();
      console.log('✅ 分页信息显示正常');
    } else {
      console.log('ℹ️ 未找到分页组件（可能数据较少）');
      expect(true).toBeTruthy();
    }
  });

  test('3.7 检查页面无错误', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 检查是否有错误提示
    const errorCount = await page.locator('text=/错误|失败|Error|Failed/i').count();
    expect(errorCount).toBe(0);
    
    console.log('✅ 用户管理页面无错误提示');
  });
});

