const { test } = require('@playwright/test');

// 登录函数
async function login(page) {
  await page.goto('https://www.guandongfang.cn/admin/');
  await page.waitForTimeout(2000);
  await page.locator('input[type="text"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('admin123');
  await page.getByRole('button', { name: '立即登录' }).click();
  await page.waitForTimeout(3000);
}

test.describe('全面测试：所有模块搜索功能', () => {
  
  test('1. 用户管理 - 搜索功能测试', async ({ page }) => {
    await login(page);
    
    await page.locator('text=用户管理').first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n========== 用户管理搜索测试 ==========');
    const beforeCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`搜索前记录数: ${beforeCount}`);
    
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.count() > 0) {
      // 获取第一个用户的昵称
      const firstUserText = await page.locator('.ant-table-tbody tr').first().textContent();
      console.log(`第一条记录文本: ${firstUserText.substring(0, 100)}`);
      
      await searchInput.fill('用户');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      
      const afterCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`搜索后记录数: ${afterCount}`);
      
      if (afterCount === beforeCount) {
        console.log('❌ 用户管理搜索无效！');
      } else {
        console.log(`✅ 用户管理搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
      }
      
      await page.screenshot({ path: '/tmp/search-users.png', fullPage: true });
    } else {
      console.log('ℹ️ 未找到搜索框');
    }
  });

  test('2. 商户管理 - 搜索功能测试', async ({ page }) => {
    await login(page);
    
    await page.locator('text=商户管理').first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n========== 商户管理搜索测试 ==========');
    const beforeCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`搜索前记录数: ${beforeCount}`);
    
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('长沙');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      
      const afterCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`搜索"长沙"后记录数: ${afterCount}`);
      
      if (afterCount === beforeCount) {
        console.log('❌ 商户管理搜索无效！');
      } else {
        console.log(`✅ 商户管理搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
      }
      
      await page.screenshot({ path: '/tmp/search-merchants.png', fullPage: true });
    }
  });

  test('3. 订单管理 - 搜索功能测试', async ({ page }) => {
    await login(page);
    
    await page.locator('text=订单管理').first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n========== 订单管理搜索测试 ==========');
    const beforeCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`搜索前记录数: ${beforeCount}`);
    
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.count() > 0) {
      // 获取第一个订单号
      const firstRow = await page.locator('.ant-table-tbody tr').first().textContent();
      const orderMatch = firstRow.match(/order_\w+/);
      
      if (orderMatch) {
        const orderId = orderMatch[0];
        console.log(`搜索订单号: ${orderId}`);
        
        await searchInput.fill(orderId);
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);
        
        const afterCount = await page.locator('.ant-table-tbody tr').count();
        console.log(`搜索后记录数: ${afterCount}`);
        
        if (afterCount === beforeCount) {
          console.log('❌ 订单管理搜索无效！');
        } else {
          console.log(`✅ 订单管理搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
        }
      } else {
        console.log('⚠️ 无法提取订单号');
      }
      
      await page.screenshot({ path: '/tmp/search-orders.png', fullPage: true });
    }
  });

  test('4. 积分管理 - 搜索功能测试', async ({ page }) => {
    await login(page);
    
    await page.locator('text=积分管理').first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n========== 积分管理搜索测试 ==========');
    const beforeCount = await page.locator('.ant-table-tbody tr').count();
    console.log(`搜索前记录数: ${beforeCount}`);
    
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('积分');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      
      const afterCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`搜索后记录数: ${afterCount}`);
      
      if (afterCount === beforeCount) {
        console.log('❌ 积分管理搜索无效！');
      } else {
        console.log(`✅ 积分管理搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
      }
      
      await page.screenshot({ path: '/tmp/search-points.png', fullPage: true });
    }
  });

  test('5. 系统设置 - 搜索功能测试', async ({ page }) => {
    await login(page);
    
    await page.locator('text=系统设置').first().click();
    await page.waitForTimeout(3000);
    
    console.log('\n========== 系统设置搜索测试 ==========');
    const tableExists = await page.locator('.ant-table').count() > 0;
    
    if (tableExists) {
      const beforeCount = await page.locator('.ant-table-tbody tr').count();
      console.log(`搜索前记录数: ${beforeCount}`);
      
      const searchInput = page.locator('input[placeholder*="搜索"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('admin');
        await searchInput.press('Enter');
        await page.waitForTimeout(2000);
        
        const afterCount = await page.locator('.ant-table-tbody tr').count();
        console.log(`搜索后记录数: ${afterCount}`);
        
        if (afterCount === beforeCount) {
          console.log('❌ 系统设置搜索无效！');
        } else {
          console.log(`✅ 系统设置搜索有效！从 ${beforeCount} 变为 ${afterCount}`);
        }
        
        await page.screenshot({ path: '/tmp/search-settings.png', fullPage: true });
      } else {
        console.log('ℹ️ 系统设置无搜索框');
      }
    } else {
      console.log('ℹ️ 系统设置页面无表格');
    }
  });
});

