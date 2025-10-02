const { test, expect } = require('@playwright/test');

test.describe('深度CRUD测试：用户管理', () => {
  let page;
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // 清除缓存并登录
    await page.goto('https://www.guandongfang.cn/admin/', { waitUntil: 'networkidle' });
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
  });

  test('1. 读取(Read) - 查看用户列表', async () => {
    // 检查表格存在
    const tableExists = await page.locator('.ant-table').count() > 0;
    expect(tableExists).toBeTruthy();
    console.log('✅ 用户列表加载成功');
    
    // 检查是否有数据
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`✅ 找到 ${rowCount} 条用户记录`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('2. 读取(Read) - 查看用户详情', async () => {
    // 点击第一个详情按钮（使用filter匹配包含"详"的按钮）
    const detailButton = page.locator('button').filter({ hasText: /详/ }).first();
    await detailButton.click();
    await page.waitForTimeout(2000);
    
    // 检查详情弹窗是否打开
    const modalVisible = await page.locator('.ant-modal').count() > 0;
    expect(modalVisible).toBeTruthy();
    console.log('✅ 用户详情弹窗打开成功');
    
    // 截图
    await page.screenshot({ path: '/tmp/user-detail-modal.png', fullPage: true });
    console.log('📸 用户详情截图已保存');
    
    // 检查详情内容
    const modalText = await page.locator('.ant-modal').textContent();
    console.log('\n========== 用户详情内容检查 ==========');
    
    // 检查基本信息
    const hasUserId = modalText.includes('用户ID') || modalText.includes('ID');
    const hasNickname = modalText.includes('昵称');
    const hasPoints = modalText.includes('积分') || modalText.includes('余额');
    
    console.log(`用户ID显示: ${hasUserId ? '✅' : '❌'}`);
    console.log(`昵称显示: ${hasNickname ? '✅' : '❌'}`);
    console.log(`积分信息显示: ${hasPoints ? '✅' : '❌'}`);
    
    // 检查是否有数据显示为0的问题
    const hasZeroOrders = modalText.includes('0 笔订单') || modalText.includes('0笔');
    const hasZeroAmount = modalText.includes('¥0.00') || modalText.includes('￥0');
    
    if (hasZeroOrders) {
      console.log('⚠️ 发现订单数为0 - 可能是正常（用户没有订单）');
    }
    if (hasZeroAmount) {
      console.log('⚠️ 发现金额为0 - 可能是正常（用户没有消费）');
    }
    
    // 打印积分相关数据
    const pointsMatch = modalText.match(/余额[：:]\s*(\d+)/);
    const earnedMatch = modalText.match(/获得[：:]\s*(\d+)/);
    const spentMatch = modalText.match(/消费[：:]\s*(\d+)/);
    
    if (pointsMatch) console.log(`当前积分余额: ${pointsMatch[1]}`);
    if (earnedMatch) console.log(`累计获得: ${earnedMatch[1]}`);
    if (spentMatch) console.log(`累计消费: ${spentMatch[1]}`);
    
    // 关闭弹窗
    const closeButton = page.locator('.ant-modal button').filter({ hasText: /关闭|取消/ }).first();
    await closeButton.click();
    await page.waitForTimeout(1000);
    
    console.log('✅ 用户详情查看完成');
  });

  test('3. 更新(Update) - 切换用户状态', async () => {
    // 找到第一个解锁/锁定按钮
    const statusButton = page.locator('button').filter({ hasText: /锁|解/ }).first();
    const buttonText = await statusButton.textContent();
    console.log(`\n当前按钮文本: "${buttonText}"`);
    
    // 点击按钮
    await statusButton.click();
    await page.waitForTimeout(2000);
    
    // 检查是否有成功提示
    const successMessage = page.locator('.ant-message-success, .ant-notification-notice-success');
    const hasSuccess = await successMessage.count() > 0;
    
    if (hasSuccess) {
      const messageText = await successMessage.textContent();
      console.log(`✅ 状态切换成功: ${messageText}`);
    } else {
      console.log('⚠️ 未检测到成功提示消息');
    }
    
    // 等待列表刷新
    await page.waitForTimeout(2000);
    
    // 再次点击恢复原状态
    const newStatusButton = page.locator('button').filter({ hasText: /锁|解/ }).first();
    await newStatusButton.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ 用户状态切换测试完成');
  });

  test('4. 搜索功能测试', async () => {
    // 获取第一个用户的昵称
    const firstUserNickname = await page.locator('.ant-table-tbody tr').first()
      .locator('td').first().textContent();
    
    // 提取昵称（去掉ID等其他信息）
    const nicknameMatch = firstUserNickname.match(/^([^\n]+)/);
    const nickname = nicknameMatch ? nicknameMatch[1].trim() : '';
    
    console.log(`\n准备搜索用户: ${nickname}`);
    
    // 在搜索框输入
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    await searchInput.fill(nickname);
    await page.waitForTimeout(2000);
    
    // 检查搜索结果
    const searchResultCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`✅ 搜索结果数量: ${searchResultCount}`);
    
    // 清空搜索
    await searchInput.clear();
    await page.waitForTimeout(2000);
    
    console.log('✅ 搜索功能测试完成');
  });

  test('5. 筛选功能测试', async () => {
    // 测试状态筛选
    const statusSelect = page.locator('.ant-select').filter({ hasText: /状态|全部/ }).first();
    await statusSelect.click();
    await page.waitForTimeout(500);
    
    // 选择"正常"状态
    const activeOption = page.locator('.ant-select-item').filter({ hasText: /正常/ });
    if (await activeOption.count() > 0) {
      await activeOption.first().click();
      await page.waitForTimeout(2000);
      
      const resultCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`✅ 筛选"正常"状态，结果数: ${resultCount}`);
    }
    
    // 重置筛选
    const resetButton = page.locator('button').filter({ hasText: /重置/ });
    if (await resetButton.count() > 0) {
      await resetButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 筛选已重置');
    }
    
    console.log('✅ 筛选功能测试完成');
  });

  test('6. 分页功能测试', async () => {
    // 检查分页组件
    const paginationExists = await page.locator('.ant-pagination').count() > 0;
    
    if (paginationExists) {
      console.log('✅ 分页组件存在');
      
      // 获取总数
      const totalText = await page.locator('.ant-pagination-total-text').textContent();
      console.log(`总数显示: ${totalText}`);
      
      // 尝试翻页（如果有下一页）
      const nextButton = page.locator('.ant-pagination-next');
      const isDisabled = await nextButton.getAttribute('aria-disabled');
      
      if (isDisabled === 'false') {
        await nextButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ 翻页成功');
        
        // 返回第一页
        const prevButton = page.locator('.ant-pagination-prev');
        await prevButton.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('ℹ️ 只有一页数据，无法测试翻页');
      }
    } else {
      console.log('ℹ️ 数据较少，未显示分页');
    }
    
    console.log('✅ 分页功能测试完成');
  });
});

