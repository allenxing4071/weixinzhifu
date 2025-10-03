// API文档交互脚本

// 切换分组展开/折叠
function toggleGroup(groupId) {
    const groupContent = document.getElementById(`${groupId}-group`);
    const groupHeader = event.currentTarget;
    
    if (groupContent.classList.contains('collapsed')) {
        groupContent.classList.remove('collapsed');
        groupHeader.classList.remove('collapsed');
    } else {
        groupContent.classList.add('collapsed');
        groupHeader.classList.add('collapsed');
    }
}

// 切换端点详情展开/折叠
function toggleEndpoint(endpointId) {
    const detailsElement = document.getElementById(`${endpointId}-details`);
    const headerElement = event.currentTarget;
    
    if (detailsElement.classList.contains('collapsed')) {
        detailsElement.classList.remove('collapsed');
        headerElement.classList.remove('collapsed');
    } else {
        detailsElement.classList.add('collapsed');
        headerElement.classList.add('collapsed');
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 API文档已加载');
    
    // 默认展开第一个分组
    const firstGroup = document.querySelector('.api-group');
    if (firstGroup) {
        // 第一个分组默认是展开的，不需要额外操作
    }
    
    // 添加快捷键支持
    document.addEventListener('keydown', (e) => {
        // ESC键关闭所有展开的端点
        if (e.key === 'Escape') {
            const allDetails = document.querySelectorAll('.endpoint-details');
            const allHeaders = document.querySelectorAll('.endpoint-header');
            
            allDetails.forEach(detail => detail.classList.add('collapsed'));
            allHeaders.forEach(header => header.classList.add('collapsed'));
        }
        
        // Ctrl/Cmd + E 展开所有端点
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            const allDetails = document.querySelectorAll('.endpoint-details');
            const allHeaders = document.querySelectorAll('.endpoint-header');
            
            allDetails.forEach(detail => detail.classList.remove('collapsed'));
            allHeaders.forEach(header => header.classList.remove('collapsed'));
        }
    });
    
    // 添加URL哈希支持，直接跳转到特定端点
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const element = document.getElementById(hash);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // 如果是端点，自动展开
            if (element.classList.contains('api-endpoint')) {
                const header = element.querySelector('.endpoint-header');
                if (header) {
                    header.click();
                }
            }
        }
    }
});

// 复制代码块功能
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('.code-block');
    
    codeBlocks.forEach(block => {
        const copyButton = document.createElement('button');
        copyButton.textContent = '复制';
        copyButton.className = 'copy-code-btn';
        copyButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 4px 12px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        // 给代码块添加相对定位
        block.style.position = 'relative';
        
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(block.textContent).then(() => {
                copyButton.textContent = '已复制!';
                setTimeout(() => {
                    copyButton.textContent = '复制';
                }, 2000);
            });
        });
        
        block.appendChild(copyButton);
    });
}

// 页面加载后添加复制按钮
window.addEventListener('load', addCopyButtons);

// 调试信息
console.log('%c微信支付积分系统 API 文档', 'font-size: 20px; color: #3b4151; font-weight: bold;');
console.log('%c快捷键:', 'font-size: 14px; color: #666;');
console.log('  ESC - 关闭所有展开的端点');
console.log('  Ctrl/Cmd + E - 展开所有端点');

