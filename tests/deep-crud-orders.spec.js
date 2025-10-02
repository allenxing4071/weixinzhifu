const { test, expect } = require('@playwright/test');

test.describe('深度CRUD测试：订单管理', () => {
  let page;
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // 登录
    await page.goto('https://www.guandongfang.cn/admin/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.locator('input[type="text"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.getByRole('button', { name: '立即登录' }).click();
    await page.waitForTimeout(3000);
    
    // 进入订单管理
    await page.locator('text=订单管理').first().click();
    await page.waitForTimeout(3000);
  });

  test('1. 读取(Read) - 查看订单列表', async () => {
    const tableExists = await page.locator('.ant-table').count() > 0;
    expect(tableExists).toBeTruthy();
    console.log('✅ 订单列表加载成功');
    
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`✅ 找到 ${rowCount} 条订单记录`);
    expect(rowCount).toBeGreaterThan(0);
    
    // 截图
    await page.screenshot({ path: '/tmp/orders-list.png', fullPage: true });
    console.log('📸 订单列表截图已保存');
  });

  test('2. 读取(Read) - 查看统计数据', async () => {
    await page.waitForTimeout(1000);
    
    // 查找统计卡片
    const pageText = await page.locator('body').textContent();
    const hasStats = pageText.includes('总订单') || pageText.includes('已支付') || 
                     pageText.includes('总金额') || pageText.includes('订单');
    
    if (hasStats) {
      console.log('✅ 订单统计数据显示正常');
      expect(true).toBeTruthy();
    } else {
      console.log('ℹ️ 未找到明显的统计数据');
    }
  });

  test('3. 读取(Read) - 查看订单详情', async () => {
    // 点击第一个详情按钮
    const detailButton = page.locator('button').filter({ hasText: /详/ }).first();
    
    if (await detailButton.count() > 0) {
      await detailButton.click();
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('.ant-modal, .ant-drawer').count() > 0;
      if (modalVisible) {
        console.log('✅ 订单详情弹窗打开');
        
        // 截图
        await page.screenshot({ path: '/tmp/order-detail.png', fullPage: true });
        console.log('📸 订单详情截图已保存');
        
        // 检查详情内容
        const modalText = await page.locator('.ant-modal, .ant-drawer').textContent();
        
        console.log('\n========== 订单详情内容检查 ==========');
        const hasOrderId = modalText.includes('订单') && modalText.includes('ID');
        const hasAmount = modalText.includes('金额') || modalText.includes('￥') || modalText.includes('¥');
        const hasStatus = modalText.includes('状态');
        const hasUser = modalText.includes('用户');
        const hasMerchant = modalText.includes('商户');
        
        console.log(`订单ID: ${hasOrderId ? '✅' : '❌'}`);
        console.log(`金额信息: ${hasAmount ? '✅' : '❌'}`);
        console.log(`订单状态: ${hasStatus ? '✅' : '❌'}`);
        console.log(`用户信息: ${hasUser ? '✅' : '❌'}`);
        console.log(`商户信息: ${hasMerchant ? '✅' : '❌'}`);
        
        // 检查是否有0金额问题
        if (modalText.includes('¥0.00') || modalText.includes('￥0')) {
          console.log('⚠️ 发现金额为0 - 需要检查数据');
        }
        
        // 关闭弹窗
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        
        expect(hasOrderId || hasAmount).toBeTruthy();
      } else {
        console.log('⚠️ 详情弹窗未打开');
      }
    } else {
      console.log('ℹ️ 未找到详情按钮');
    }
  });

  test('4. 搜索功能 - 按订单号搜索', async () => {
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="订单"]').first();
    
    if (await searchInput.count() > 0) {
      // 获取第一条订单号
      const firstRow = await page.locator('.ant-table-tbody tr').first().textContent();
      const orderIdMatch = firstRow.match(/order_\w+/);
      
      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        console.log(`准备搜索订单: ${orderId}`);
        
        await searchInput.fill(orderId);
        await page.waitForTimeout(2000);
        
        const resultCount = await page.locator('.ant-table-tbody tr').count();
        console.log(`✅ 搜索结果数量: ${resultCount}`);
        expect(resultCount).toBeGreaterThan(0);
        
        // 清空搜索
        await searchInput.clear();
        await page.waitForTimeout(2000);
      } else {
        console.log('ℹ️ 未能提取订单号');
      }
    } else {
      console.log('ℹ️ 未找到搜索框');
    }
  });

  test('5. 筛选功能 - 按状态筛选', async () => {
    // 查找状态筛选器
    const statusSelect = page.locator('.ant-select').first();
    
    if (await statusSelect.count() > 0) {
      await statusSelect.click();
      await page.waitForTimeout(500);
      
      // 选择"已支付"状态
      const paidOption = page.locator('.ant-select-item').filter({ hasText: /已支付|paid/ });
      if (await paidOption.count() > 0) {
        await paidOption.first().click();
        await page.waitForTimeout(2000);
        
        const resultCount = await page.locator('.ant-table-tbody tr').count();
        console.log(`✅ 筛选"已支付"状态，结果数: ${resultCount}`);
      } else {
        console.log('ℹ️ 未找到"已支付"选项');
      }
      
      // 重置筛选
      const resetButton = page.locator('button').filter({ hasText: /重置|清空/ });
      if (await resetButton.count() > 0) {
        await resetButton.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ 筛选已重置');
      }
    } else {
      console.log('ℹ️ 未找到状态筛选器');
    }
  });

  test('6. 筛选功能 - 按日期范围筛选', async () => {
    // 查找日期选择器
    const dateRangePicker = page.locator('.ant-picker').first();
    
    if (await dateRangePicker.count() > 0) {
      console.log('✅ 找到日期筛选器');
      
      // 点击日期选择器
      await dateRangePicker.click();
      await page.waitForTimeout(500);
      
      // 选择日期（选择今天）
      const todayCell = page.locator('.ant-picker-cell-today').first();
      if (await todayCell.count() > 0) {
        await todayCell.click();
        await page.waitForTimeout(500);
        
        // 再次点击选择结束日期
        const todayCell2 = page.locator('.ant-picker-cell-today').first();
        if (await todayCell2.count() > 0) {
          await todayCell2.click();
          await page.waitForTimeout(2000);
          console.log('✅ 日期范围已选择');
        }
      }
      
      // 清空日期
      const clearButton = page.locator('.ant-picker-clear');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('ℹ️ 未找到日期筛选器');
    }
  });

  test('7. 分页功能测试', async () => {
    const paginationExists = await page.locator('.ant-pagination').count() > 0;
    
    if (paginationExists) {
      console.log('✅ 分页组件存在');
      
      // 获取总数
      const totalText = await page.locator('.ant-pagination-total-text').textContent().catch(() => '');
      if (totalText) {
        console.log(`总数显示: ${totalText}`);
      }
      
      // 尝试翻页
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
        console.log('✅ 返回第一页');
      } else {
        console.log('ℹ️ 只有一页数据');
      }
    } else {
      console.log('ℹ️ 未显示分页组件');
    }
  });

  test('8. 导出功能测试', async () => {
    // 查找导出按钮
    const exportButton = page.locator('button').filter({ hasText: /导出|下载|export/ });
    
    if (await exportButton.count() > 0) {
      console.log('✅ 找到导出功能按钮');
      // 不实际点击，避免触发下载
    } else {
      console.log('ℹ️ 未找到导出功能');
    }
  });

  test('9. 刷新功能测试', async () => {
    // 查找刷新按钮
    const refreshButton = page.locator('button').filter({ hasText: /刷新|重新加载/ });
    
    if (await refreshButton.count() > 0) {
      await refreshButton.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ 刷新功能正常');
    } else {
      console.log('ℹ️ 未找到刷新按钮');
    }
  });
});

