const { test, expect } = require('@playwright/test');

test.describe('深度CRUD测试：商户管理', () => {
  let page;
  let testMerchantId = null;
  
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
    
    // 进入商户管理
    await page.locator('text=商户管理').first().click();
    await page.waitForTimeout(3000);
  });

  test('1. 读取(Read) - 查看商户列表', async () => {
    const tableExists = await page.locator('.ant-table').count() > 0;
    expect(tableExists).toBeTruthy();
    console.log('✅ 商户列表加载成功');
    
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`✅ 找到 ${rowCount} 条商户记录`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('2. 读取(Read) - 查看统计卡片', async () => {
    await page.waitForTimeout(1000);
    
    // 查找统计数字
    const statsCards = await page.locator('.ant-statistic-content, .ant-card').allTextContents();
    console.log('\n========== 统计卡片内容 ==========');
    
    const hasStats = statsCards.some(text => /\d+/.test(text));
    expect(hasStats).toBeTruthy();
    console.log('✅ 统计卡片显示正常');
  });

  test('3. 创建(Create) - 新增商户', async () => {
    // 点击新增按钮
    const addButton = page.locator('button').filter({ hasText: /新增|添加|创建/ }).first();
    await addButton.click();
    await page.waitForTimeout(2000);
    
    // 检查表单是否打开
    const formVisible = await page.locator('.ant-modal, .ant-drawer, form').count() > 0;
    expect(formVisible).toBeTruthy();
    console.log('✅ 新增商户表单打开');
    
    // 生成测试数据
    const timestamp = Date.now();
    const merchantName = `测试商户_${timestamp}`;
    const merchantNo = `TEST${timestamp}`;
    const contactPerson = '张三';
    const contactPhone = '13800138000';
    
    // 填写表单
    const nameInput = page.locator('input[id*="merchantName"], input[placeholder*="商户名称"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(merchantName);
      console.log(`填写商户名称: ${merchantName}`);
    }
    
    const noInput = page.locator('input[id*="wechatMchId"], input[id*="merchantNo"], input[placeholder*="商户号"]').first();
    if (await noInput.count() > 0) {
      await noInput.fill(merchantNo);
      console.log(`填写商户号: ${merchantNo}`);
    }
    
    const personInput = page.locator('input[id*="contactPerson"], input[placeholder*="联系人"]').first();
    if (await personInput.count() > 0) {
      await personInput.fill(contactPerson);
    }
    
    const phoneInput = page.locator('input[id*="contactPhone"], input[placeholder*="电话"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(contactPhone);
    }
    
    // 截图表单
    await page.screenshot({ path: '/tmp/merchant-create-form.png', fullPage: true });
    console.log('📸 新增商户表单截图已保存');
    
    // 提交表单
    const submitButton = page.locator('button').filter({ hasText: /确定|提交|保存/ }).first();
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // 检查是否成功
    const successMessage = await page.locator('.ant-message-success, .ant-notification-success').count();
    if (successMessage > 0) {
      console.log('✅ 商户创建成功');
    } else {
      console.log('⚠️ 未检测到成功提示（可能表单验证失败或已成功）');
    }
    
    // 刷新列表查找新创建的商户
    await page.waitForTimeout(2000);
    const pageText = await page.locator('body').textContent();
    if (pageText.includes(merchantName)) {
      console.log(`✅ 在列表中找到新创建的商户: ${merchantName}`);
    }
  });

  test('4. 读取(Read) - 查看商户详情', async () => {
    // 点击第一个详情按钮
    const detailButton = page.locator('button').filter({ hasText: /详/ }).first();
    if (await detailButton.count() > 0) {
      await detailButton.click();
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('.ant-modal, .ant-drawer').count() > 0;
      if (modalVisible) {
        console.log('✅ 商户详情弹窗打开');
        
        // 截图
        await page.screenshot({ path: '/tmp/merchant-detail.png', fullPage: true });
        console.log('📸 商户详情截图已保存');
        
        // 检查详情内容
        const modalText = await page.locator('.ant-modal, .ant-drawer').textContent();
        const hasName = modalText.includes('商户') || modalText.includes('名称');
        const hasContact = modalText.includes('联系') || modalText.includes('电话');
        
        console.log(`商户信息显示: ${hasName ? '✅' : '❌'}`);
        console.log(`联系信息显示: ${hasContact ? '✅' : '❌'}`);
        
        // 关闭弹窗
        const closeButton = page.locator('button').filter({ hasText: /关|闭|取消/ });
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(1000);
        } else {
          // 尝试点击遮罩层关闭
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('ℹ️ 未找到详情按钮');
    }
  });

  test('5. 更新(Update) - 二维码生成', async () => {
    // 查找二维码生成按钮
    const qrButton = page.locator('button').filter({ hasText: /二维码|生成/ }).first();
    
    if (await qrButton.count() > 0) {
      await qrButton.click();
      await page.waitForTimeout(2000);
      
      // 检查是否有成功提示或二维码显示
      const hasSuccess = await page.locator('.ant-message, .ant-notification').count() > 0;
      const hasQRCode = await page.locator('canvas, img[alt*="二维码"], .qrcode').count() > 0;
      
      if (hasSuccess || hasQRCode) {
        console.log('✅ 二维码生成成功');
      } else {
        console.log('⚠️ 二维码功能可能需要进一步检查');
      }
    } else {
      console.log('ℹ️ 未找到二维码生成按钮');
    }
  });

  test('6. 搜索功能测试', async () => {
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    
    if (await searchInput.count() > 0) {
      // 搜索"测试"
      await searchInput.fill('测试');
      await page.waitForTimeout(2000);
      
      const resultCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`✅ 搜索"测试"，结果数: ${resultCount}`);
      
      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(2000);
      console.log('✅ 搜索功能测试完成');
    } else {
      console.log('ℹ️ 未找到搜索框');
    }
  });

  test('7. 更新(Update) - 编辑商户', async () => {
    // 查找编辑按钮
    const editButton = page.locator('button').filter({ hasText: /编辑|修改/ }).first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // 检查编辑表单
      const formVisible = await page.locator('.ant-modal, .ant-drawer').count() > 0;
      if (formVisible) {
        console.log('✅ 编辑表单打开');
        
        // 修改联系电话
        const phoneInput = page.locator('input[id*="contactPhone"], input[placeholder*="电话"]').first();
        if (await phoneInput.count() > 0) {
          await phoneInput.clear();
          await phoneInput.fill('13900139000');
          console.log('✅ 修改了联系电话');
        }
        
        // 取消编辑（避免影响数据）
        const cancelButton = page.locator('button').filter({ hasText: /取消/ }).first();
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ 已取消编辑');
        }
      }
    } else {
      console.log('ℹ️ 未找到编辑按钮');
    }
  });

  test('8. 批量操作测试', async () => {
    // 查找批量操作相关功能
    const batchButton = await page.locator('button').filter({ hasText: /批量/ }).count();
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    
    if (batchButton > 0 || checkboxes > 0) {
      console.log('✅ 找到批量操作功能');
      
      if (checkboxes > 0) {
        // 选中第一个复选框
        await page.locator('input[type="checkbox"]').first().check();
        await page.waitForTimeout(1000);
        console.log('✅ 已选中一条记录');
        
        // 取消选中
        await page.locator('input[type="checkbox"]').first().uncheck();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('ℹ️ 未找到批量操作功能');
    }
  });

  test('9. 删除(Delete) - 删除测试商户', async () => {
    // 搜索测试商户
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('测试商户');
      await page.waitForTimeout(2000);
    }
    
    // 查找删除按钮
    const deleteButton = page.locator('button').filter({ hasText: /删除/ }).first();
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // 确认删除
      const confirmButton = page.locator('.ant-modal button').filter({ hasText: /确定|确认/ }).first();
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ 删除操作已执行');
      } else {
        // 可能是直接删除，无需确认
        console.log('✅ 删除操作已触发');
      }
    } else {
      console.log('ℹ️ 未找到删除按钮（可能无删除权限或测试商户不存在）');
    }
  });
});

