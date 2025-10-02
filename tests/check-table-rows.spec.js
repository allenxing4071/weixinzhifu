const { test } = require('@playwright/test');

test('检查表格行数问题', async ({ page }) => {
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
  
  // 搜索
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  await searchInput.fill('张');
  await searchInput.press('Enter');
  await page.waitForTimeout(3000);
  
  // 详细检查每一行
  console.log('\n========== 检查表格行 ==========');
  const rows = await page.locator('.ant-table-tbody tr').all();
  console.log(`总行数: ${rows.length}`);
  
  for (let i = 0; i < rows.length; i++) {
    const rowText = await rows[i].textContent();
    const className = await rows[i].getAttribute('class');
    console.log(`第${i + 1}行: ${className?.includes('empty') ? '[空行]' : ''} ${rowText.substring(0, 100)}`);
  }
  
  // 检查是否有特殊行
  const emptyRow = await page.locator('.ant-table-placeholder').count();
  const loadingRow = await page.locator('.ant-spin').count();
  
  console.log(`\n空行(placeholder): ${emptyRow}`);
  console.log(`加载中(spin): ${loadingRow}`);
});

