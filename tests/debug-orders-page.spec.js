const { test } = require('@playwright/test');

test('调试订单管理页面', async ({ page }) => {
  // 登录
  await page.goto('https://www.guandongfang.cn/admin/');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: '立即登录' }).click();
  await page.waitForTimeout(3000);
  
  // 进入订单管理
  await page.locator('text=订单管理').first().click();
  await page.waitForTimeout(5000);
  
  // 截图
  await page.screenshot({ path: '/tmp/orders-page-debug.png', fullPage: true });
  console.log('📸 订单页面截图已保存');
  
  // 获取页面文本
  const pageText = await page.locator('body').textContent();
  console.log('\n========== 页面文本内容 (前1000字符) ==========');
  console.log(pageText.substring(0, 1000));
  
  // 检查是否有错误
  const hasError = pageText.includes('错误') || pageText.includes('Error') || 
                   pageText.includes('失败') || pageText.includes('加载中');
  console.log(`\n页面是否有错误: ${hasError ? '❌ 是' : '✅ 否'}`);
  
  // 检查API请求
  console.log('\n等待API响应...');
  await page.waitForTimeout(3000);
});

