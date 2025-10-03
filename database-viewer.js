// 数据库查看器脚本

// 配置
const CONFIG = {
    API_BASE_URL: 'https://www.guandongfang.cn/api/v1',  // 使用生产环境API
    AUTO_REFRESH_INTERVAL: 30000, // 30秒自动刷新
    REFRESH_ON_FOCUS: true, // 窗口获得焦点时刷新
};

// 状态
let state = {
    currentTable: null,
    currentTab: 'structure',
    currentPage: 1,
    pageSize: 20,
    sortBy: null,
    sortOrder: 'DESC',
    tables: [],
    autoRefreshTimer: null,
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🗄️ 数据库管理界面已加载');
    
    // 加载数据库统计
    await loadDatabaseStats();
    
    // 加载表列表
    await loadTables();
    
    // 初始化Tab切换
    initTabs();
    
    // 初始化表搜索
    initTableSearch();
    
    // 启动自动刷新
    startAutoRefresh();
    
    // 窗口获得焦点时刷新
    if (CONFIG.REFRESH_ON_FOCUS) {
        window.addEventListener('focus', () => {
            refreshAll();
        });
    }
});

// ==================== API请求 ====================

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('admin_token');
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers,
        },
    });
    
    return await response.json();
}

// ==================== 数据加载 ====================

async function loadDatabaseStats() {
    try {
        const result = await apiRequest('/admin/database/stats');
        if (result.success) {
            document.getElementById('dbName').textContent = result.data.database;
            document.getElementById('tableCount').textContent = result.data.tableCount;
            document.getElementById('totalRows').textContent = result.data.totalRows.toLocaleString();
            document.getElementById('dbSize').textContent = result.data.size;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('zh-CN');
        }
    } catch (error) {
        console.error('加载数据库统计失败:', error);
        showNotification('加载数据库统计失败', 'error');
    }
}

async function loadTables() {
    try {
        const result = await apiRequest('/admin/database/tables');
        if (result.success) {
            state.tables = result.data.tables;
            renderTablesList(state.tables);
        }
    } catch (error) {
        console.error('加载表列表失败:', error);
        showNotification('加载表列表失败', 'error');
    }
}

async function loadTableSchema(tableName) {
    try {
        const result = await apiRequest(`/admin/database/tables/${tableName}/schema`);
        if (result.success) {
            renderTableSchema(result.data);
            
            // 更新排序列下拉框
            const sortSelect = document.getElementById('sortColumnSelect');
            sortSelect.innerHTML = '<option value="">排序字段</option>' +
                result.data.columns.map(col => 
                    `<option value="${col.name}">${col.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('加载表结构失败:', error);
        showNotification('加载表结构失败', 'error');
    }
}

async function loadTableData(tableName, page = 1) {
    try {
        const params = new URLSearchParams({
            page,
            pageSize: state.pageSize,
        });
        
        if (state.sortBy) {
            params.append('sortBy', state.sortBy);
            params.append('sortOrder', state.sortOrder);
        }
        
        const result = await apiRequest(`/admin/database/tables/${tableName}/data?${params}`);
        if (result.success) {
            renderTableData(result.data);
        }
    } catch (error) {
        console.error('加载表数据失败:', error);
        showNotification('加载表数据失败', 'error');
    }
}

// ==================== 渲染函数 ====================

function renderTablesList(tables) {
    const listContainer = document.getElementById('tablesList');
    
    if (tables.length === 0) {
        listContainer.innerHTML = '<div class="loading">没有找到数据表</div>';
        return;
    }
    
    listContainer.innerHTML = tables.map(table => `
        <div class="table-item" onclick="selectTable('${table.name}')">
            <div class="table-item-name">${table.name}</div>
            <div class="table-item-meta">${table.rowCount} rows · ${table.size}</div>
        </div>
    `).join('');
}

function renderTableSchema(data) {
    const { tableName, columns, indexes } = data;
    
    // 更新表头
    document.getElementById('currentTableName').textContent = tableName;
    const tableInfo = state.tables.find(t => t.name === tableName);
    if (tableInfo) {
        document.getElementById('tableRowCount').textContent = `${tableInfo.rowCount} rows`;
        document.getElementById('tableSize').textContent = tableInfo.size;
    }
    
    // 渲染列信息
    const columnsTable = document.getElementById('columnsTable').querySelector('tbody');
    columnsTable.innerHTML = columns.map(col => `
        <tr>
            <td><strong>${col.name}</strong></td>
            <td>${col.type}</td>
            <td class="${col.nullable ? 'nullable-yes' : 'nullable-no'}">
                ${col.nullable ? 'YES' : 'NOT NULL'}
            </td>
            <td>
                ${col.key === 'PRI' ? '<span class="key-badge primary">PRIMARY</span>' : ''}
                ${col.key === 'UNI' ? '<span class="key-badge unique">UNIQUE</span>' : ''}
                ${col.key && col.key !== 'PRI' && col.key !== 'UNI' ? col.key : ''}
            </td>
            <td>${col.default || '-'}</td>
            <td>${col.extra || '-'}</td>
            <td>${col.comment || '-'}</td>
        </tr>
    `).join('');
    
    // 渲染索引
    const indexesTable = document.getElementById('indexesTable').querySelector('tbody');
    if (indexes.length > 0) {
        indexesTable.innerHTML = indexes.map(idx => `
            <tr>
                <td>${idx.name}</td>
                <td>${idx.column}</td>
                <td>${idx.unique ? 'YES' : 'NO'}</td>
                <td>${idx.type}</td>
            </tr>
        `).join('');
    } else {
        indexesTable.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #999;">无索引</td></tr>';
    }
}

function renderTableData(data) {
    const { rows, pagination } = data;
    
    const thead = document.getElementById('dataTableHead');
    const tbody = document.getElementById('dataTableBody');
    
    if (rows.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="100" style="text-align:center; padding: 40px; color: #999;">暂无数据</td></tr>';
        return;
    }
    
    // 渲染表头
    const columns = Object.keys(rows[0]);
    thead.innerHTML = `
        <tr>
            <th style="width: 50px;">#</th>
            ${columns.map(col => `<th>${col}</th>`).join('')}
        </tr>
    `;
    
    // 渲染数据
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    tbody.innerHTML = rows.map((row, index) => `
        <tr>
            <td style="color: #999;">${startIndex + index + 1}</td>
            ${columns.map(col => `<td>${formatValue(row[col])}</td>`).join('')}
        </tr>
    `).join('');
    
    // 渲染分页
    renderPagination(pagination);
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    const { page, totalPages, total } = pagination;
    
    container.innerHTML = `
        <button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
            上一页
        </button>
        <span class="page-info">
            第 ${page} / ${totalPages} 页，共 ${total} 条
        </span>
        <button onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
            下一页
        </button>
    `;
}

// ==================== 交互函数 ====================

function selectTable(tableName) {
    state.currentTable = tableName;
    state.currentPage = 1;
    state.sortBy = null;
    
    // 更新选中状态
    document.querySelectorAll('.table-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.table-item').classList.add('active');
    
    // 显示表详情
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('tableView').style.display = 'block';
    
    // 加载表结构
    loadTableSchema(tableName);
    
    // 如果在数据tab,加载数据
    if (state.currentTab === 'data') {
        loadTableData(tableName, state.currentPage);
    }
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    state.currentTab = tab;
    
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // 更新内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}Tab`);
    });
    
    // 加载对应数据
    if (state.currentTable) {
        if (tab === 'data') {
            loadTableData(state.currentTable, state.currentPage);
        } else if (tab === 'info') {
            renderTableInfo();
        }
    }
}

function renderTableInfo() {
    const table = state.tables.find(t => t.name === state.currentTable);
    if (!table) return;
    
    const container = document.getElementById('tableInfo');
    container.innerHTML = `
        <div class="info-item">
            <div class="info-label">表名</div>
            <div class="info-value">${table.name}</div>
        </div>
        <div class="info-item">
            <div class="info-label">记录数</div>
            <div class="info-value">${table.rowCount.toLocaleString()}</div>
        </div>
        <div class="info-item">
            <div class="info-label">大小</div>
            <div class="info-value">${table.size}</div>
        </div>
        <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">${table.createdAt ? new Date(table.createdAt).toLocaleString('zh-CN') : '-'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">更新时间</div>
            <div class="info-value">${table.updatedAt ? new Date(table.updatedAt).toLocaleString('zh-CN') : '-'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">注释</div>
            <div class="info-value">${table.comment || '-'}</div>
        </div>
    `;
}

function changePage(page) {
    state.currentPage = page;
    loadTableData(state.currentTable, page);
}

function changePageSize() {
    const select = document.getElementById('pageSizeSelect');
    state.pageSize = parseInt(select.value);
    state.currentPage = 1;
    loadTableData(state.currentTable, 1);
}

function changeSorting() {
    const columnSelect = document.getElementById('sortColumnSelect');
    const orderSelect = document.getElementById('sortOrderSelect');
    
    state.sortBy = columnSelect.value || null;
    state.sortOrder = orderSelect.value;
    state.currentPage = 1;
    
    loadTableData(state.currentTable, 1);
}

function initTableSearch() {
    const searchInput = document.getElementById('tableSearch');
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = state.tables.filter(table => 
            table.name.toLowerCase().includes(keyword)
        );
        renderTablesList(filtered);
    });
}

// SQL控制台
let consoleExpanded = true;

function toggleConsole() {
    consoleExpanded = !consoleExpanded;
    const content = document.getElementById('consoleContent');
    const icon = document.getElementById('consoleToggleIcon');
    
    if (consoleExpanded) {
        content.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        icon.textContent = '▲';
    }
}

async function executeSQL() {
    const sql = document.getElementById('sqlEditor').value.trim();
    if (!sql) {
        showNotification('请输入SQL语句', 'warning');
        return;
    }
    
    try {
        const result = await apiRequest('/admin/database/query', {
            method: 'POST',
            body: JSON.stringify({ sql }),
        });
        
        if (result.success) {
            renderSQLResult(result.data);
            showNotification(`查询成功，返回 ${result.data.rowCount} 行，耗时 ${result.data.executionTime}`, 'success');
        } else {
            renderSQLError(result.message);
            showNotification(result.message, 'error');
        }
    } catch (error) {
        renderSQLError(error.message);
        showNotification('查询失败', 'error');
    }
}

function renderSQLResult(data) {
    const container = document.getElementById('sqlResult');
    
    if (data.rows.length === 0) {
        container.innerHTML = '<div class="result-placeholder">查询无结果</div>';
        return;
    }
    
    const columns = Object.keys(data.rows[0]);
    container.innerHTML = `
        <div style="margin-bottom: 10px; color: #52c41a;">
            ✓ 成功: ${data.rowCount} 行，耗时 ${data.executionTime}
        </div>
        <table class="data-table" style="font-size: 12px;">
            <thead>
                <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.rows.map(row => `
                    <tr>${columns.map(col => `<td>${formatValue(row[col])}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderSQLError(message) {
    const container = document.getElementById('sqlResult');
    container.innerHTML = `
        <div style="color: #ff4d4f; padding: 20px;">
            ✗ 错误: ${message}
        </div>
    `;
}

function clearSQL() {
    document.getElementById('sqlEditor').value = '';
    document.getElementById('sqlResult').innerHTML = '<div class="result-placeholder">查询结果将显示在这里</div>';
}

// ==================== 工具函数 ====================

function formatValue(value) {
    if (value === null) return '<span style="color: #999;">NULL</span>';
    if (value === '') return '<span style="color: #999;">(空)</span>';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
}

function exportData() {
    if (!state.currentTable) {
        showNotification('请先选择一个表', 'warning');
        return;
    }
    showNotification('导出功能开发中...', 'info');
}

async function refreshAll() {
    await loadDatabaseStats();
    await loadTables();
    if (state.currentTable) {
        await loadTableSchema(state.currentTable);
        if (state.currentTab === 'data') {
            await loadTableData(state.currentTable, state.currentPage);
        }
    }
    showNotification('数据已刷新', 'success');
}

function startAutoRefresh() {
    if (state.autoRefreshTimer) {
        clearInterval(state.autoRefreshTimer);
    }
    
    state.autoRefreshTimer = setInterval(() => {
        loadDatabaseStats();
        loadTables();
    }, CONFIG.AUTO_REFRESH_INTERVAL);
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#52c41a',
        error: '#ff4d4f',
        warning: '#faad14',
        info: '#1890ff',
    };
    
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${colors[type]};
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// 调试信息
console.log('%c数据库管理系统', 'font-size: 20px; color: #5B67F1; font-weight: bold;');
console.log('%c实时联动 | 自动刷新 | SQL查询', 'font-size: 14px; color: #52c41a;');

