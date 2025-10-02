const { test } = require('@playwright/test');

test('最终验证：积分管理搜索功能', async ({ page }) => {
  // 监听所有网络请求和响应
  const apiCalls = [];
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/v1/admin/points')) {
      try {
        const json = await response.json();
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          data: json
        });
      } catch (e) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          error: 'Failed to parse JSON'
        });
      }
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
  
  console.log('\n========== 第1步：初始加载 ==========');
  const initialCall = apiCalls[apiCalls.length - 1];
  console.log(`API URL: ${initialCall.url}`);
  console.log(`返回记录数: ${initialCall.data?.data?.list?.length || 0}`);
  console.log(`总记录数: ${initialCall.data?.data?.pagination?.total || 0}`);
  
  const beforeCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`页面显示记录数: ${beforeCount}`);
  
  // 清空之前的API调用记录
  apiCalls.length = 0;
  
  // 搜索"张"（数据库中有"张建国"、"张霞"等）
  console.log('\n========== 第2步：搜索"张" ==========');
  const searchInput = page.locator('input[placeholder*="搜索"]').first();
  await searchInput.fill('张');
  await page.waitForTimeout(500);
  await searchInput.press('Enter');
  await page.waitForTimeout(3000);
  
  const searchCall = apiCalls[apiCalls.length - 1];
  console.log(`API URL: ${searchCall.url}`);
  console.log(`URL包含search参数: ${searchCall.url.includes('search=') ? '✅ 是' : '❌ 否'}`);
  console.log(`返回记录数: ${searchCall.data?.data?.list?.length || 0}`);
  console.log(`总记录数: ${searchCall.data?.data?.pagination?.total || 0}`);
  
  const afterCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`页面显示记录数: ${afterCount}`);
  
  // 打印实际返回的数据
  if (searchCall.data?.data?.list) {
    console.log('\n返回的记录:');
    searchCall.data.data.list.forEach((record, i) => {
      console.log(`${i + 1}. 用户: ${record.userName}, 商户: ${record.merchantName}, 描述: ${record.description}`);
    });
  }
  
  // 验证
  console.log('\n========== 验证结果 ==========');
  if (searchCall.url.includes('search=')) {
    console.log('✅ 前端正确发送了search参数');
  } else {
    console.log('❌ 前端未发送search参数');
  }
  
  const returnedCount = searchCall.data?.data?.list?.length || 0;
  if (returnedCount < beforeCount) {
    console.log(`✅ 后端正确过滤了数据: ${beforeCount} -> ${returnedCount}`);
  } else {
    console.log(`❌ 后端未过滤数据: ${beforeCount} -> ${returnedCount}`);
  }
  
  if (afterCount === returnedCount) {
    console.log(`✅ 前端正确显示了后端数据: ${returnedCount} 条`);
  } else {
    console.log(`❌ 前端显示不一致: 后端返回${returnedCount}条，前端显示${afterCount}条`);
  }
  
  // 截图
  await page.screenshot({ path: '/tmp/points-search-final-test.png', fullPage: true });
  console.log('\n📸 截图已保存: /tmp/points-search-final-test.png');
  
  // 最终判断
  if (returnedCount > 0 && returnedCount < beforeCount && afterCount === returnedCount) {
    console.log('\n🎉 积分管理搜索功能完全正常！');
  } else {
    console.log('\n⚠️ 积分管理搜索功能仍有问题，需要进一步排查');
  }
});

