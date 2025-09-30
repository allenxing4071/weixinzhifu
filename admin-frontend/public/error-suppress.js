// 抑制Chrome扩展冲突错误的脚本
(function() {
  'use strict';
  
  // 保存原始的错误处理函数
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // 重写console.error来过滤Chrome扩展错误
  console.error = function(...args) {
    const message = args.join(' ');
    
    // 如果是Chrome扩展相关错误，则忽略
    if (message.includes('chrome-extension') || 
        message.includes('_events') ||
        message.includes('Cannot set properties of undefined') ||
        message.includes('mfgccjchihfkkindfppnaooecgfneiii') ||
        message.includes('inpage.js') ||
        message.includes('[object Object]') ||
        args.some(arg => typeof arg === 'string' && (
          arg.includes('chrome-extension') ||
          arg.includes('mfgccjchihfkkindfppnaooecgfneiii')
        ))) {
      console.log('🛡️ 已过滤Chrome扩展错误:', message);
      return; // 忽略这些错误
    }
    
    // 其他错误正常输出
    originalError.apply(console, args);
  };
  
  // 重写console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('chrome-extension')) {
      return; // 忽略Chrome扩展警告
    }
    
    originalWarn.apply(console, args);
  };
  
  // 全局错误监听器
  window.addEventListener('error', function(event) {
    // 阻止Chrome扩展错误冒泡
    if (event.filename && (
        event.filename.includes('chrome-extension') ||
        event.filename.includes('mfgccjchihfkkindfppnaooecgfneiii') ||
        event.filename.includes('inpage.js')
      )) {
      console.log('🛡️ 已拦截扩展文件错误:', event.filename);
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    
    if (event.message && (
        event.message.includes('chrome-extension') ||
        event.message.includes('_events') ||
        event.message.includes('Cannot set properties of undefined') ||
        event.message.includes('mfgccjchihfkkindfppnaooecgfneiii') ||
        event.message.includes('[object Object]')
      )) {
      console.log('🛡️ 已拦截扩展消息错误:', event.message);
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true); // 使用捕获阶段
  
  // Promise错误监听器
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (
        (typeof event.reason === 'string' && event.reason.includes('chrome-extension')) ||
        (event.reason.message && event.reason.message.includes('chrome-extension')) ||
        (event.reason.stack && event.reason.stack.includes('chrome-extension'))
      )) {
      event.preventDefault();
      return false;
    }
  });
  
  // 尝试修补可能导致冲突的全局对象
  try {
    // 保护window对象
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, '_events', {
        get: function() { return {}; },
        set: function() { return true; },
        configurable: false
      });
    }
  } catch (e) {
    // 忽略可能的错误
  }
  
  console.log('Chrome扩展冲突抑制脚本已加载');
})();