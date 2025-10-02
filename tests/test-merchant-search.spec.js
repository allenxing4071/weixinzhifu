const { test } = require('@playwright/test');

test('深度测试：商户搜索功能', async ({ page }) => {
  // 登录
  await page.goto('https://www.guandongfang.cn/admin/');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: '立即登录' }).click();
  await page.waitForTimeout(3000);
  
  // 进入商户管理
  await page.locator('text=商户管理').first().click();
  await page.waitForTimeout(3000);
  
  // 截图初始状态
  await page.screenshot({ path: '/tmp/merchant-before-search.png', fullPage: true });
  console.log('📸 搜索前截图');
  
  // 获取搜索前的记录数
  const beforeCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`搜索前记录数: ${beforeCount}`);
  
  // 查找搜索框
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  const hasSearchBox = await searchInput.count() > 0;
  console.log(`\n搜索框存在: ${hasSearchBox ? '✅' : '❌'}`);
  
  if (hasSearchBox) {
    // 输入搜索关键字"长沙江南味道"
    console.log('\n输入搜索关键字: "长沙江南味道"');
    await searchInput.fill('长沙江南味道');
    await page.waitForTimeout(1000);
    
    // 截图输入后
    await page.screenshot({ path: '/tmp/merchant-input-search.png', fullPage: true });
    console.log('📸 输入搜索词后截图');
    
    // 点击搜索按钮或按回车
    const searchButton = page.locator('button').filter({ hasText: /搜索|查询/ });
    if (await searchButton.count() > 0) {
      console.log('点击搜索按钮');
      await searchButton.first().click();
    } else {
      console.log('按Enter键搜索');
      await searchInput.press('Enter');
    }
    
    await page.waitForTimeout(3000);
    
    // 截图搜索后
    await page.screenshot({ path: '/tmp/merchant-after-search.png', fullPage: true });
    console.log('📸 搜索后截图');
    
    // 获取搜索后的记录数
    const afterCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`\n搜索后记录数: ${afterCount}`);
    
    // 检查是否有筛选效果
    if (afterCount < beforeCount) {
      console.log(`✅ 搜索有效！从 ${beforeCount} 条缩减到 ${afterCount} 条`);
    } else if (afterCount === beforeCount) {
      console.log(`⚠️ 搜索无效！记录数未变化（仍为 ${afterCount} 条）`);
      console.log('这说明搜索功能没有真正工作！');
    }
    
    // 检查表格中是否包含搜索关键字
    const tableText = await page.locator('.ant-table').textContent();
    if (tableText.includes('长沙江南味道')) {
      console.log('✅ 表格中找到"长沙江南味道"');
    } else {
      console.log('❌ 表格中没有找到"长沙江南味道"');
    }
    
    // 检查前端是否发送了API请求
    console.log('\n等待并检查网络请求...');
    await page.waitForTimeout(2000);
  }
  
  // 获取页面HTML查看搜索框的事件绑定
  const searchInputHTML = await searchInput.evaluate(el => el.outerHTML);
  console.log('\n搜索框HTML:', searchInputHTML);
});

