const { test } = require('@playwright/test');

test('测试积分搜索：搜索"广州"', async ({ page }) => {
  // 登录
  await page.goto('https://www.guandongfang.cn/admin/');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: '立即登录' }).click();
  await page.waitForTimeout(3000);
  
  // 进入积分管理
  await page.locator('text=积分管理').first().click();
  await page.waitForTimeout(3000);
  
  console.log('\n========== 搜索"广州" ==========');
  const beforeCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`搜索前记录数: ${beforeCount}`);
  
  // 输入搜索
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  await searchInput.fill('广州');
  await searchInput.press('Enter');
  await page.waitForTimeout(3000);
  
  const afterCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`搜索"广州"后记录数: ${afterCount}`);
  
  // 截图
  await page.screenshot({ path: '/tmp/points-search-guangzhou.png', fullPage: true });
  
  // 检查表格内容
  const tableText = await page.locator('.ant-table').textContent();
  if (tableText.includes('广州')) {
    console.log('✅ 表格中找到"广州"');
  } else {
    console.log('❌ 表格中未找到"广州"');
  }
  
  if (afterCount > 0 && afterCount < beforeCount) {
    console.log(`✅ 搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
  } else if (afterCount === 0) {
    console.log('⚠️ 搜索结果为0条');
  } else {
    console.log(`❌ 搜索无效！记录数未变化 (${afterCount})`);
  }
});

