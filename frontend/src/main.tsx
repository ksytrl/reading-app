// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 🔧 PWA相关导入
import { registerSWWithDefaultConfig } from './registerSW';
import { cacheManager } from './services/cacheManager';
import { syncManager } from './services/syncManager';

// 🎨 隐藏启动画面的函数
function hideLoadingScreen() {
  const loadingElement = document.getElementById('app-loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    loadingElement.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      loadingElement.style.display = 'none';
    }, 300);
  }
}

// 🔧 初始化PWA功能
async function initializePWA() {
  console.log('🔧 初始化PWA功能');
  
  try {
    // 📋 注册Service Worker
    const registration = await registerSWWithDefaultConfig();
    
    if (registration) {
      console.log('✅ Service Worker注册成功');
      
      // 🔄 设置同步管理器配置
      syncManager.updateConfig({
        syncInterval: 30 * 1000, // 30秒同步一次
        maxRetries: 3,
        batchSize: 10
      });
      
      // 📊 监听同步事件
      syncManager.on('sync_start', () => {
        console.log('🔄 开始数据同步');
      });
      
      syncManager.on('sync_complete', (event) => {
        console.log('✅ 数据同步完成:', event.data);
      });
      
      syncManager.on('sync_error', (event) => {
        console.error('❌ 数据同步失败:', event.error);
      });
      
      // 📱 初始化缓存管理器
      console.log('💾 缓存管理器已初始化');
      
      // 📊 显示缓存统计
      cacheManager.getCacheSize().then(cacheSize => {
        console.log('📊 当前缓存大小:', cacheSize);
      });
      
    } else {
      console.log('ℹ️ Service Worker注册跳过（可能在开发环境）');
    }
    
  } catch (error) {
    console.error('❌ PWA初始化失败:', error);
    // PWA初始化失败不应该阻止应用启动
  }
}

// 🔧 初始化应用
async function initializeApp() {
  console.log('🚀 开始初始化阅读App');
  
  try {
    // 🔧 初始化PWA功能（异步，不阻塞应用启动）
    initializePWA().catch(error => {
      console.error('❌ PWA初始化过程中发生错误:', error);
    });
    
    // 📱 渲染React应用
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ React应用渲染完成');
    
    // 🎨 隐藏启动画面
    setTimeout(hideLoadingScreen, 100);
    
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    
    // 📱 显示错误信息
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #f3f4f6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: system-ui;
          text-align: center;
          padding: 20px;
        ">
          <div style="max-width: 500px;">
            <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
            <h1 style="color: #1f2937; margin-bottom: 16px; font-size: 24px;">
              应用启动失败
            </h1>
            <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">
              抱歉，阅读App无法正常启动。请刷新页面重试。
            </p>
            <button 
              onclick="location.reload()" 
              style="
                background: #2563eb;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 12px;
              "
            >
              🔄 刷新页面
            </button>
            <button 
              onclick="localStorage.clear(); sessionStorage.clear(); location.reload();" 
              style="
                background: #dc2626;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
              "
            >
              🗑️ 清除缓存并刷新
            </button>
            <details style="margin-top: 24px; text-align: left;">
              <summary style="cursor: pointer; color: #6b7280;">错误详情</summary>
              <pre style="
                background: #1f2937;
                color: #f9fafb;
                padding: 16px;
                border-radius: 8px;
                margin-top: 8px;
                overflow: auto;
                font-size: 12px;
              ">${error instanceof Error ? error.toString() : String(error)}</pre>
            </details>
          </div>
        </div>
      `;
    }
    
    // 🎨 隐藏启动画面
    hideLoadingScreen();
  }
}

// 🔧 错误边界处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 未处理的Promise拒绝:', event.reason);
  
  // 可以在这里上报错误到监控系统
  // 例如：errorReporting.captureException(event.reason);
});

window.addEventListener('error', (event) => {
  console.error('🚨 全局错误:', event.error);
  
  // 可以在这里上报错误到监控系统
  // 例如：errorReporting.captureException(event.error);
});

// 📊 性能监控
if ('performance' in window && 'getEntriesByType' in performance) {
  window.addEventListener('load', () => {
    // 获取性能指标
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const metrics = {
      // 页面加载时间
      loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
      // DOM解析时间
      domParseTime: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
      // 首次绘制时间
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
      // 首次内容绘制时间
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      // 总加载时间
      totalLoadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
    };
    
    console.log('📊 应用性能指标:', metrics);
    
    // 可以在这里上报性能数据到监控系统
    // 例如：analytics.track('app_performance', metrics);
  });
}

// 📱 PWA安装提示处理
let deferredInstallPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA安装提示事件触发');
  e.preventDefault();
  deferredInstallPrompt = e;
  
  // 将事件保存到全局，供React组件使用
  (window as any).deferredInstallPrompt = e;
  
  // 触发自定义事件，通知React组件
  window.dispatchEvent(new CustomEvent('pwa-install-prompt-available'));
});

window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA安装完成');
  deferredInstallPrompt = null;
  (window as any).deferredInstallPrompt = null;
  
  // 触发自定义事件，通知React组件
  window.dispatchEvent(new CustomEvent('pwa-installed'));
  
  // 可以在这里显示安装成功的通知
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('阅读App', {
      body: '应用已成功安装到您的设备！',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'pwa-installed'
    });
  }
});

// 🔄 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('👁️ 页面重新可见');
    
    // 页面重新可见时，可以执行一些恢复操作
    // 例如：重新同步数据、检查更新等
    
    // 检查Service Worker更新
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update().catch(error => {
          console.error('❌ 检查Service Worker更新失败:', error);
        });
      });
    }
  } else {
    console.log('👁️ 页面隐藏');
    
    // 页面隐藏时，可以执行一些清理操作
    // 例如：暂停定时器、保存状态等
  }
});

// 🌐 网络状态变化处理
window.addEventListener('online', () => {
  console.log('🌐 网络连接已恢复');
  
  // 网络恢复时触发同步
  if (typeof syncManager !== 'undefined') {
    syncManager.syncImmediately().catch(error => {
      console.error('❌ 网络恢复后同步失败:', error);
    });
  }
  
  // 触发自定义事件，通知React组件
  window.dispatchEvent(new CustomEvent('network-online'));
});

window.addEventListener('offline', () => {
  console.log('🔌 网络连接已断开');
  
  // 触发自定义事件，通知React组件
  window.dispatchEvent(new CustomEvent('network-offline'));
});

// 🚀 启动应用
console.log('🚀 阅读App启动中...');
initializeApp();

// 🔧 开发环境热更新支持
if (import.meta.hot) {
  import.meta.hot.accept();
}