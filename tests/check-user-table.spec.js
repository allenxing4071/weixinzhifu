const { test, expect } = require('@playwright/test');

test('检查用户表格结构', async ({ page, context }) => {
  // 清除所有cookies和缓存
  await context.clearCookies();
  await context.clearPermissions();
  
  // 登录
  await page.goto('https://www.guandongfang.cn/admin/', { waitUntil: 'networkidle' });
  
  // 强制刷新清除缓存
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: '立即登录' }).click();
  await page.waitForTimeout(3000);
  
  // 进入用户管理
  await page.locator('text=用户管理').first().click();
  await page.waitForTimeout(3000);
  
  // 截图整个页面
  await page.screenshot({ path: '/tmp/user-table-full.png', fullPage: true });
  console.log('📸 完整页面截图已保存');
  
  // 检查表格是否存在
  const tableExists = await page.locator('.ant-table').count() > 0;
  console.log(`表格存在: ${tableExists}`);
  
  if (tableExists) {
    // 获取表格HTML
    const tableHTML = await page.locator('.ant-table').first().innerHTML();
    console.log('\n========== 表格HTML (前500字符) ==========');
    console.log(tableHTML.substring(0, 500));
    
    // 检查是否有操作列
    const hasActionColumn = await page.locator('text=操作').count() > 0;
    console.log(`\n操作列存在: ${hasActionColumn}`);
    
    // 查找所有按钮
    const allButtons = await page.locator('button').allTextContents();
    console.log(`\n所有按钮文本:`, allButtons);
    
    // 特别查找详情按钮
    const detailButtons = await page.locator('button:has-text("详情")').count();
    console.log(`\n详情按钮数量: ${detailButtons}`);
    
    // 查找锁定/解锁按钮
    const lockButtons = await page.locator('button:has-text("锁定"), button:has-text("解锁")').count();
    console.log(`锁定/解锁按钮数量: ${lockButtons}`);
  }
  
  // 获取页面完整文本
  const pageText = await page.locator('body').textContent();
  console.log('\n========== 页面关键文字 ==========');
  if (pageText.includes('用户管理')) console.log('✅ 找到"用户管理"');
  if (pageText.includes('详情')) console.log('✅ 找到"详情"');
  if (pageText.includes('锁定')) console.log('✅ 找到"锁定"');
  if (pageText.includes('解锁')) console.log('✅ 找到"解锁"');
  if (pageText.includes('操作')) console.log('✅ 找到"操作"');
});

