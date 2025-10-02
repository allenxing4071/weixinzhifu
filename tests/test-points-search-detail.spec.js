const { test } = require('@playwright/test');

test('详细测试：积分管理搜索', async ({ page }) => {
  // 监听网络请求
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/v1/admin/points')) {
      requests.push(request.url());
    }
  });
  
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
  
  console.log('\n========== 积分管理搜索详细测试 ==========');
  console.log(`初始加载的API请求: ${requests[requests.length - 1]}`);
  
  const beforeCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`搜索前记录数: ${beforeCount}`);
  
  // 查找搜索框
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  const hasSearchBox = await searchInput.count() > 0;
  console.log(`搜索框存在: ${hasSearchBox ? '✅' : '❌'}`);
  
  if (hasSearchBox) {
    // 获取搜索框信息
    const placeholder = await searchInput.getAttribute('placeholder');
    console.log(`搜索框placeholder: ${placeholder}`);
    
    // 输入搜索
    console.log('\n输入搜索关键字: "积分"');
    await searchInput.fill('积分');
    await page.waitForTimeout(1000);
    
    // 按回车
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);
    
    console.log(`搜索后的API请求: ${requests[requests.length - 1]}`);
    
    const afterCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`搜索后记录数: ${afterCount}`);
    
    // 检查API请求是否包含搜索参数
    const lastRequest = requests[requests.length - 1];
    if (lastRequest && lastRequest.includes('search=')) {
      console.log('✅ API请求包含search参数');
    } else {
      console.log('❌ API请求不包含search参数');
      console.log('这说明前端没有正确发送搜索参数！');
    }
    
    if (afterCount < beforeCount) {
      console.log(`✅ 搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
    } else {
      console.log(`❌ 搜索无效！记录数未变化`);
    }
  }
  
  // 打印所有API请求
  console.log('\n所有API请求:');
  requests.forEach((req, i) => console.log(`${i + 1}. ${req}`));
});

