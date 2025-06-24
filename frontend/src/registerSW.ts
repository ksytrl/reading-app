// frontend/src/registerSW.ts
export interface SWConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  onInstalling?: (registration: ServiceWorkerRegistration) => void;
  onWaiting?: (registration: ServiceWorkerRegistration) => void;
  onActive?: (registration: ServiceWorkerRegistration) => void;
}

const isProduction = process.env.NODE_ENV === 'production';
const swUrl = '/sw.js';

// 🔍 检查Service Worker支持
function isSwSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// 🔍 检查是否为localhost
function isLocalhost(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '[::1]' ||
    hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/) !== null
  );
}

// 📝 验证SW文件是否存在
async function checkValidServiceWorker(swUrl: string, config?: SWConfig): Promise<void> {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    });

    const contentType = response.headers.get('content-type');
    
    if (
      response.status === 404 ||
      (contentType != null && contentType.indexOf('javascript') === -1)
    ) {
      console.error('❌ Service Worker文件无效或不存在');
      
      // 如果找不到service worker，卸载现有的
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
      
      if (config?.onError) {
        config.onError(new Error('Service Worker文件无效'));
      }
    } else {
      console.log('✅ Service Worker文件验证通过');
      registerValidSW(swUrl, config);
    }
  } catch (error) {
    console.error('❌ 验证Service Worker时发生错误:', error);
    if (config?.onError) {
      config.onError(error as Error);
    }
  }
}

// 📋 注册有效的Service Worker
async function registerValidSW(swUrl: string, config?: SWConfig): Promise<void> {
  try {
    console.log('📋 开始注册Service Worker');
    
    const registration = await navigator.serviceWorker.register(swUrl);
    
    console.log('✅ Service Worker注册成功:', registration);

    // 🔄 监听Service Worker状态变化
    registration.addEventListener('updatefound', () => {
      console.log('🔄 发现Service Worker更新');
      
      const installingWorker = registration.installing;
      if (installingWorker == null) {
        return;
      }

      if (config?.onInstalling) {
        config.onInstalling(registration);
      }

      installingWorker.addEventListener('statechange', () => {
        console.log('🔄 Service Worker状态变化:', installingWorker.state);
        
        switch (installingWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              // 新的Service Worker已安装，但仍有旧的在运行
              console.log('📦 新版本Service Worker已准备就绪');
              
              if (config?.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // 首次安装Service Worker
              console.log('🎉 Service Worker首次安装完成');
              
              if (config?.onSuccess) {
                config.onSuccess(registration);
              }
            }
            break;
            
          case 'redundant':
            console.log('🗑️ Service Worker已过时');
            break;
        }
      });
    });

    // 🔄 检查是否有等待中的Service Worker
    if (registration.waiting) {
      console.log('⏳ 发现等待中的Service Worker');
      if (config?.onWaiting) {
        config.onWaiting(registration);
      }
    }

    // 🔄 检查是否有正在安装的Service Worker
    if (registration.installing) {
      console.log('📦 发现正在安装的Service Worker');
      if (config?.onInstalling) {
        config.onInstalling(registration);
      }
    }

    // 🔄 检查活跃的Service Worker
    if (registration.active) {
      console.log('✅ Service Worker已激活');
      if (config?.onActive) {
        config.onActive(registration);
      }
    }

    // 🔄 定期检查更新
    setInterval(() => {
      registration.update().catch(error => {
        console.error('❌ 检查Service Worker更新失败:', error);
      });
    }, 60000); // 每分钟检查一次

  } catch (error) {
    console.error('❌ Service Worker注册失败:', error);
    if (config?.onError) {
      config.onError(error as Error);
    }
  }
}

// 📡 主注册函数
export function registerSW(config?: SWConfig): Promise<ServiceWorkerRegistration | null> {
  return new Promise((resolve, reject) => {
    // 🔍 检查Service Worker支持
    if (!isSwSupported()) {
      const error = new Error('当前浏览器不支持Service Worker');
      console.warn('⚠️', error.message);
      if (config?.onError) {
        config.onError(error);
      }
      reject(error);
      return;
    }

    // 🔄 页面加载完成后注册
    window.addEventListener('load', async () => {
      try {
        if (isLocalhost()) {
          // 🏠 localhost环境：验证SW文件
          console.log('🏠 在localhost环境中注册Service Worker');
          await checkValidServiceWorker(swUrl, config);
          
          // 📝 添加一些有用的调试信息
          navigator.serviceWorker.ready.then(() => {
            console.log(
              '🔧 此Web应用正在由Service Worker提供服务。' +
              '更多信息请访问: https://cra.link/PWA'
            );
            resolve(null); // localhost环境可能不返回registration
          });
        } else {
          // 🌐 生产环境：直接注册
          console.log('🌐 在生产环境中注册Service Worker');
          await registerValidSW(swUrl, config);
          
          const registration = await navigator.serviceWorker.ready;
          resolve(registration);
        }
      } catch (error) {
        console.error('❌ Service Worker注册过程中发生错误:', error);
        if (config?.onError) {
          config.onError(error as Error);
        }
        reject(error);
      }
    });
  });
}

// 🗑️ 注销Service Worker
export async function unregisterSW(): Promise<boolean> {
  if (!isSwSupported()) {
    console.warn('⚠️ 当前浏览器不支持Service Worker');
    return false;
  }

  try {
    console.log('🗑️ 开始注销Service Worker');
    
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    
    if (result) {
      console.log('✅ Service Worker注销成功');
    } else {
      console.log('ℹ️ Service Worker注销失败或不存在');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Service Worker注销失败:', error);
    return false;
  }
}

// 🔄 更新Service Worker
export async function updateSW(): Promise<void> {
  if (!isSwSupported()) {
    throw new Error('当前浏览器不支持Service Worker');
  }

  try {
    console.log('🔄 手动更新Service Worker');
    
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    
    console.log('✅ Service Worker更新检查完成');
  } catch (error) {
    console.error('❌ Service Worker更新失败:', error);
    throw error;
  }
}

// 📨 向Service Worker发送消息
export function postMessageToSW(message: any): void {
  if (!isSwSupported() || !navigator.serviceWorker.controller) {
    console.warn('⚠️ Service Worker未激活，无法发送消息');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
  console.log('📨 已向Service Worker发送消息:', message);
}

// 📨 监听来自Service Worker的消息
export function onSWMessage(callback: (event: MessageEvent) => void): () => void {
  if (!isSwSupported()) {
    console.warn('⚠️ 当前浏览器不支持Service Worker');
    return () => {};
  }

  navigator.serviceWorker.addEventListener('message', callback);
  
  // 返回取消监听的函数
  return () => {
    navigator.serviceWorker.removeEventListener('message', callback);
  };
}

// 🔄 跳过等待的Service Worker
export async function skipWaitingSW(): Promise<void> {
  if (!isSwSupported()) {
    throw new Error('当前浏览器不支持Service Worker');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      console.log('🔄 跳过等待，激活新的Service Worker');
      
      // 向等待中的Service Worker发送跳过等待消息
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // 监听控制器变化
      return new Promise((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          console.log('✅ Service Worker已更新');
          resolve();
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      });
    } else {
      console.log('ℹ️ 没有等待中的Service Worker');
    }
  } catch (error) {
    console.error('❌ 跳过Service Worker等待失败:', error);
    throw error;
  }
}

// 📊 获取Service Worker状态
export async function getSWStatus(): Promise<{
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isWaiting: boolean;
  isInstalling: boolean;
  scope?: string;
  scriptURL?: string;
}> {
  const status = {
    isSupported: isSwSupported(),
    isRegistered: false,
    isActive: false,
    isWaiting: false,
    isInstalling: false,
    scope: undefined as string | undefined,
    scriptURL: undefined as string | undefined
  };

  if (!status.isSupported) {
    return status;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      status.isRegistered = true;
      status.scope = registration.scope;
      status.isActive = !!registration.active;
      status.isWaiting = !!registration.waiting;
      status.isInstalling = !!registration.installing;
      
      if (registration.active) {
        status.scriptURL = registration.active.scriptURL;
      }
    }
  } catch (error) {
    console.error('❌ 获取Service Worker状态失败:', error);
  }

  return status;
}

// 🔄 重新加载页面（跳过Service Worker缓存）
export function reloadWithoutSW(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
}

// 📋 导出便捷的默认配置注册函数
export function registerSWWithDefaultConfig(): Promise<ServiceWorkerRegistration | null> {
  const config: SWConfig = {
    onSuccess: (registration) => {
      console.log('🎉 PWA安装成功！离线功能已启用');
      
      // 可以在这里显示成功提示
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('阅读App', {
          body: '应用已准备就绪，支持离线阅读！',
          icon: '/icons/icon-192x192.png'
        });
      }
    },
    
    onUpdate: (registration) => {
      console.log('🔄 发现新版本，准备更新');
      
      // 这里可以显示更新提示
      // 实际的更新提示逻辑应该在组件中处理
    },
    
    onError: (error) => {
      console.error('❌ Service Worker出现错误:', error);
      
      // 可以上报错误到监控系统
      // 或显示用户友好的错误信息
    }
  };

  return registerSW(config);
}