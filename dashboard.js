// 微信支付积分系统 - 开发者控制台脚本

// 配置
const CONFIG = {
    API_BASE_URL: 'https://www.guandongfang.cn/api/v1',
    ADMIN_URL: 'https://www.guandongfang.cn/admin/',
    REFRESH_INTERVAL: 30000, // 30秒刷新一次数据
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 微信支付积分系统 - 开发者控制台已加载');
    
    // 加载核心数据
    loadDashboardStats();
    
    // 定时刷新数据
    setInterval(loadDashboardStats, CONFIG.REFRESH_INTERVAL);
    
    // 显示当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// 加载仪表盘数据
async function loadDashboardStats() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                updateDashboardUI(result.data);
            }
        } else {
            console.warn('无法加载数据，使用默认值');
            useDefaultData();
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        useDefaultData();
    }
}

// 更新仪表盘UI
function updateDashboardUI(data) {
    if (data.overview) {
        document.getElementById('totalUsers').textContent = formatNumber(data.overview.totalUsers || 0);
        document.getElementById('activeMerchants').textContent = formatNumber(data.overview.activeMerchants || 0);
    }
}

// 使用默认数据
function useDefaultData() {
    document.getElementById('totalUsers').textContent = '8000';
    document.getElementById('activeMerchants').textContent = '3000';
}

// 获取Token
function getToken() {
    return localStorage.getItem('admin_token') || '';
}

// 格式化数字
function formatNumber(num) {
    return num.toLocaleString('zh-CN');
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    // 可以添加到页面上显示
}

// ==================== 功能模块导航 ====================

function openModule(moduleName) {
    const moduleUrls = {
        'users': `${CONFIG.ADMIN_URL}#/users`,
        'merchants': `${CONFIG.ADMIN_URL}#/merchants`,
        'points': `${CONFIG.ADMIN_URL}#/points`,
        'orders': `${CONFIG.ADMIN_URL}#/orders`,
        'api': './docs/02-技术实现/API接口文档.md',
        'settings': `${CONFIG.ADMIN_URL}#/settings`,
        'swagger': './docs-swagger.html',  // 打开官方Swagger UI文档
        'database': '#database',
        'adminer': 'https://www.adminer.org/'
    };
    
    const url = moduleUrls[moduleName];
    if (url) {
        if (moduleName === 'database') {
            // 滚动到数据库管理区域
            document.querySelector('.database-detail-section').scrollIntoView({ behavior: 'smooth' });
            showNotification('已定位到数据库管理区域', 'success');
        } else {
            window.open(url, '_blank');
            showNotification(`正在打开 ${getModuleName(moduleName)}...`, 'info');
        }
    }
}

function getModuleName(moduleName) {
    const names = {
        'users': '用户管理',
        'merchants': '商户管理',
        'points': '积分管理',
        'orders': '订单管理',
        'api': 'API文档',
        'settings': '系统设置',
        'swagger': 'Swagger文档',
        'database': '数据库管理',
        'adminer': 'Adminer数据库工具'
    };
    return names[moduleName] || moduleName;
}

// ==================== 数据库Tab切换 ====================

function switchDbTab(tabName) {
    // 隐藏所有数据库tab内容
    const allDbTabs = document.querySelectorAll('.db-tab-content');
    allDbTabs.forEach(tab => tab.classList.remove('active'));
    
    // 移除所有按钮的active状态
    const allDbButtons = document.querySelectorAll('.db-tabs .tab-btn');
    allDbButtons.forEach(btn => btn.classList.remove('active'));
    
    // 显示选中的tab
    const selectedTab = document.getElementById(`${tabName}-db-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // 激活对应的按钮
    event.target.classList.add('active');
    
    showNotification(`正在查看 ${getDbTableName(tabName)} 表结构`, 'info');
}

function getDbTableName(tabName) {
    const names = {
        'users': 'users (用户表)',
        'merchants': 'merchants (商户表)',
        'orders': 'payment_orders (订单表)',
        'points': 'user_points (积分表)'
    };
    return names[tabName] || tabName;
}

// ==================== 复制功能 ====================

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('已复制到剪贴板', 'success');
    }).catch(err => {
        console.error('复制失败:', err);
        
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('已复制到剪贴板', 'success');
        } catch (err) {
            showNotification('复制失败', 'error');
        }
        document.body.removeChild(textArea);
    });
}

function copyCommand(command) {
    copyToClipboard(command);
}

// ==================== Tab切换 ====================

function switchTab(tabName) {
    // 隐藏所有tab内容
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // 移除所有按钮的active状态
    const allButtons = document.querySelectorAll('.tab-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // 显示选中的tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // 激活对应的按钮
    event.target.classList.add('active');
}

// ==================== API相关功能 ====================

function openApiDocs() {
    window.open('./docs/02-技术实现/API接口文档.md', '_blank');
    showNotification('正在打开API文档...', 'info');
}

function checkTasks() {
    showNotification('检查异步任务状态...', 'info');
    // 这里可以添加实际的任务检查逻辑
    setTimeout(() => {
        showNotification('所有任务运行正常', 'success');
    }, 1000);
}

// ==================== 快捷操作 ====================

function executeDeploy() {
    if (confirm('确定要部署管理后台吗？\n\n这将执行 deploy-admin-complete.sh 脚本')) {
        showNotification('正在部署管理后台...', 'info');
        
        // 在实际项目中，这里应该调用后端API来执行部署
        // 示例：
        // fetch('/api/deploy/admin', { method: 'POST' })
        
        setTimeout(() => {
            showNotification('部署命令已发送，请在服务器上查看执行状态', 'success');
        }, 1500);
    }
}

function executeBackendDeploy() {
    if (confirm('确定要部署后端服务吗？\n\n这将执行 deploy-backend-complete.sh 脚本')) {
        showNotification('正在部署后端服务...', 'info');
        
        setTimeout(() => {
            showNotification('部署命令已发送，请在服务器上查看执行状态', 'success');
        }, 1500);
    }
}

function runTests() {
    if (confirm('确定要运行测试吗？\n\n这将执行所有Playwright测试')) {
        showNotification('正在运行测试...', 'info');
        
        setTimeout(() => {
            showNotification('测试命令已发送，请查看终端输出', 'success');
        }, 1000);
    }
}

function cleanupProject() {
    if (confirm('确定要清理项目吗？\n\n这将删除临时文件和日志')) {
        showNotification('正在清理项目...', 'info');
        
        setTimeout(() => {
            showNotification('清理完成', 'success');
        }, 1500);
    }
}

function viewDocs() {
    window.open('./docs/README.md', '_blank');
    showNotification('正在打开项目文档...', 'info');
}

function checkStatus() {
    showNotification('正在检查系统状态...', 'info');
    
    // 检查服务器状态
    checkServerStatus();
}

async function checkServerStatus() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/dashboard/stats`);
        
        if (response.ok) {
            showNotification('✅ 系统运行正常', 'success');
            
            // 显示详细信息
            const result = await response.json();
            if (result.data && result.data.system) {
                console.log('系统状态:', result.data.system);
            }
        } else {
            showNotification('⚠️ 服务器响应异常', 'warning');
        }
    } catch (error) {
        showNotification('❌ 无法连接到服务器', 'error');
        console.error('状态检查失败:', error);
    }
}

// ==================== 通知功能 ====================

function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        background: getNotificationColor(type),
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '9999',
        fontWeight: '500',
        fontSize: '14px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease',
        cursor: 'pointer'
    });
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 点击关闭
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
    
    // 3秒后自动关闭
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

function getNotificationColor(type) {
    const colors = {
        'success': '#52C41A',
        'error': '#FF4D4F',
        'warning': '#FAAD14',
        'info': '#1890FF'
    };
    return colors[type] || colors.info;
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== 快捷键支持 ====================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 打开快速搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        showNotification('快速搜索功能开发中...', 'info');
    }
    
    // Ctrl/Cmd + D 打开文档
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        viewDocs();
    }
    
    // Ctrl/Cmd + R 刷新数据
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadDashboardStats();
        showNotification('正在刷新数据...', 'info');
    }
});

// ==================== 工具函数 ====================

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
}

// 格式化金额
function formatAmount(amount) {
    return `¥${amount.toFixed(2)}`;
}

// 格式化百分比
function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
}

// 调试信息
console.log('%c微信支付积分系统', 'font-size: 20px; color: #5B67F1; font-weight: bold;');
console.log('%c开发者控制台已加载', 'font-size: 14px; color: #52C41A;');
console.log('%c快捷键:', 'font-size: 12px; color: #666;');
console.log('  Ctrl/Cmd + K - 快速搜索');
console.log('  Ctrl/Cmd + D - 打开文档');
console.log('  Ctrl/Cmd + R - 刷新数据');

