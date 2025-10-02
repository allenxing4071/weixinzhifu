const { test, expect } = require('@playwright/test');

test('深度测试：用户详情数据问题', async ({ page }) => {
  const consoleMessages = [];
  const apiResponses = [];
  
  // 监听控制台
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // 监听API响应
  page.on('response', async response => {
    if (response.url().includes('/api/v1/admin/users')) {
      try {
        const body = await response.text();
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          body: body.substring(0, 1000)
        });
      } catch (e) {}
    }
  });
  
  // 登录
  await page.goto('https://www.guandongfang.cn/admin/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: '立即登录' }).click();
  await page.waitForTimeout(3000);
  
  // 进入用户管理
  await page.locator('text=用户管理').first().click();
  await page.waitForTimeout(3000);
  
  // 截图1：用户列表
  await page.screenshot({ path: '/tmp/user-list.png', fullPage: true });
  console.log('📸 截图1：用户列表页');
  
  // 查找并点击第一个详情按钮
  const detailButtons = page.locator('button').filter({ hasText: /详情|查看/ });
  const buttonCount = await detailButtons.count();
  console.log(`找到 ${buttonCount} 个详情按钮`);
  
  if (buttonCount > 0) {
    await detailButtons.first().click();
    await page.waitForTimeout(3000);
    
    // 截图2：用户详情弹窗
    await page.screenshot({ path: '/tmp/user-detail.png', fullPage: true });
    console.log('📸 截图2：用户详情弹窗');
    
    // 获取详情弹窗的文本内容
    const modalContent = await page.locator('.ant-modal, .ant-drawer').textContent().catch(() => '');
    console.log('\n========== 用户详情内容 ==========');
    console.log(modalContent.substring(0, 500));
    
    // 检查是否有0值
    const hasZeroValues = modalContent.includes('0笔') || 
                         modalContent.includes('0元') || 
                         modalContent.includes('¥ 0') ||
                         modalContent.includes('0分');
    
    if (hasZeroValues) {
      console.log('⚠️ 发现0值数据！');
    }
  }
  
  console.log('\n========== API响应 ==========');
  apiResponses.forEach(resp => {
    console.log(`URL: ${resp.url}`);
    console.log(`Status: ${resp.status}`);
    console.log(`Body: ${resp.body}`);
    console.log('---');
  });
  
  console.log('\n========== 控制台错误 ==========');
  const errors = consoleMessages.filter(msg => msg.includes('error:'));
  errors.forEach(err => console.log(err));
});

