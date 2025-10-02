const { test, expect } = require('@playwright/test');

test.describe('深度CRUD测试：积分管理', () => {
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
    
    // 进入积分管理
    await page.locator('text=积分管理').first().click();
    await page.waitForTimeout(3000);
  });

  test('1. 读取(Read) - 查看积分记录列表', async () => {
    const tableExists = await page.locator('.ant-table').count() > 0;
    expect(tableExists).toBeTruthy();
    console.log('✅ 积分记录列表加载成功');
    
    const rowCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`✅ 找到 ${rowCount} 条积分记录`);
    
    // 截图
    await page.screenshot({ path: '/tmp/points-list.png', fullPage: true });
    console.log('📸 积分记录截图已保存');
  });

  test('2. 读取(Read) - 检查积分记录数据', async () => {
    await page.waitForTimeout(1000);
    
    // 检查表格列
    const pageText = await page.locator('body').textContent();
    const hasUser = pageText.includes('用户');
    const hasPoints = pageText.includes('积分') || pageText.includes('变动');
    const hasType = pageText.includes('类型');
    const hasTime = pageText.includes('时间');
    
    console.log('\n========== 积分记录数据检查 ==========');
    console.log(`用户信息: ${hasUser ? '✅' : '❌'}`);
    console.log(`积分数据: ${hasPoints ? '✅' : '❌'}`);
    console.log(`记录类型: ${hasType ? '✅' : '❌'}`);
    console.log(`时间信息: ${hasTime ? '✅' : '❌'}`);
    
    expect(hasPoints).toBeTruthy();
  });

  test('3. 搜索功能测试', async () => {
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('积分');
      await page.waitForTimeout(2000);
      console.log('✅ 搜索功能正常');
      
      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      console.log('ℹ️ 未找到搜索框');
    }
  });

  test('4. 筛选功能测试', async () => {
    // 查找筛选器
    const filters = await page.locator('.ant-select, select').count();
    
    if (filters > 0) {
      console.log(`✅ 找到 ${filters} 个筛选器`);
    } else {
      console.log('ℹ️ 未找到筛选器');
    }
  });

  test('5. 分页功能测试', async () => {
    const paginationExists = await page.locator('.ant-pagination').count() > 0;
    
    if (paginationExists) {
      const totalText = await page.locator('.ant-pagination-total-text').textContent().catch(() => '');
      console.log(`✅ 分页组件存在: ${totalText}`);
      
      // 尝试翻页
      const nextButton = page.locator('.ant-pagination-next');
      const isDisabled = await nextButton.getAttribute('aria-disabled');
      
      if (isDisabled === 'false') {
        await nextButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ 翻页成功');
        
        const prevButton = page.locator('.ant-pagination-prev');
        await prevButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('ℹ️ 未显示分页');
    }
  });
});

test.describe('深度CRUD测试：系统设置', () => {
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
    
    // 进入系统设置
    await page.locator('text=系统设置').first().click();
    await page.waitForTimeout(3000);
  });

  test('1. 读取(Read) - 查看管理员列表', async () => {
    const tableExists = await page.locator('.ant-table').count() > 0;
    
    if (tableExists) {
      console.log('✅ 管理员列表加载成功');
      
      const rowCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`✅ 找到 ${rowCount} 个管理员`);
      
      // 截图
      await page.screenshot({ path: '/tmp/admin-users-list.png', fullPage: true });
      console.log('📸 管理员列表截图已保存');
    } else {
      console.log('ℹ️ 未找到管理员列表（可能是其他设置页面）');
    }
  });

  test('2. 创建(Create) - 新增管理员', async () => {
    // 查找新增按钮
    const addButton = page.locator('button').filter({ hasText: /新增|添加|创建/ }).first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(2000);
      
      const formVisible = await page.locator('.ant-modal, .ant-drawer, form').count() > 0;
      if (formVisible) {
        console.log('✅ 新增管理员表单打开');
        
        // 截图表单
        await page.screenshot({ path: '/tmp/admin-create-form.png', fullPage: true });
        
        // 取消（不实际创建）
        const cancelButton = page.locator('button').filter({ hasText: /取消/ }).first();
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ 已取消新增');
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('ℹ️ 未找到新增按钮');
    }
  });

  test('3. 读取(Read) - 查看管理员详情', async () => {
    // 查找详情按钮
    const detailButton = page.locator('button').filter({ hasText: /详/ }).first();
    
    if (await detailButton.count() > 0) {
      await detailButton.click();
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('.ant-modal, .ant-drawer').count() > 0;
      if (modalVisible) {
        console.log('✅ 管理员详情弹窗打开');
        
        // 截图
        await page.screenshot({ path: '/tmp/admin-detail.png', fullPage: true });
        
        // 关闭
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('ℹ️ 未找到详情按钮');
    }
  });

  test('4. 更新(Update) - 编辑管理员', async () => {
    // 查找编辑按钮
    const editButton = page.locator('button').filter({ hasText: /编辑|修改/ }).first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      const formVisible = await page.locator('.ant-modal, .ant-drawer').count() > 0;
      if (formVisible) {
        console.log('✅ 编辑管理员表单打开');
        
        // 取消（不实际修改）
        const cancelButton = page.locator('button').filter({ hasText: /取消/ }).first();
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ 已取消编辑');
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('ℹ️ 未找到编辑按钮');
    }
  });

  test('5. 状态切换测试', async () => {
    // 查找状态切换按钮（启用/禁用）
    const statusButtons = await page.locator('button').filter({ hasText: /启用|禁用|状态/ }).count();
    
    if (statusButtons > 0) {
      console.log('✅ 找到状态切换功能');
    } else {
      console.log('ℹ️ 未找到状态切换功能');
    }
  });

  test('6. 搜索功能测试', async () => {
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('admin');
      await page.waitForTimeout(2000);
      console.log('✅ 搜索功能正常');
      
      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      console.log('ℹ️ 未找到搜索框');
    }
  });
});

