// frontend/src/hooks/usePWA.ts
import { useState, useEffect, useCallback } from 'react';

interface PWAInstallEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface PWAState {
  // 安装状态
  isInstallable: boolean;
  isInstalled: boolean;
  showInstallPrompt: boolean;
  
  // 更新状态
  hasUpdate: boolean;
  showUpdatePrompt: boolean;
  isUpdating: boolean;
  
  // Service Worker状态
  swRegistration: ServiceWorkerRegistration | null;
  swState: 'installing' | 'waiting' | 'active' | 'redundant' | null;
  
  // 支持状态
  isPWASupported: boolean;
  isStandalone: boolean;
}

interface PWAActions {
  // 安装相关
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  
  // 更新相关
  promptUpdate: () => Promise<void>;
  skipUpdate: () => void;
  
  // 缓存管理
  clearCache: () => Promise<void>;
  getCacheSize: () => Promise<number>;
  
  // 消息通信
  postMessage: (message: any) => void;
}

export const usePWA = (): PWAState & PWAActions => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    showInstallPrompt: false,
    hasUpdate: false,
    showUpdatePrompt: false,
    isUpdating: false,
    swRegistration: null,
    swState: null,
    isPWASupported: false,
    isStandalone: false
  });

  // 🔍 检测PWA支持
  useEffect(() => {
    const isPWASupported = 'serviceWorker' in navigator && 'PushManager' in window;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    setState(prev => ({
      ...prev,
      isPWASupported,
      isStandalone,
      isInstalled: isStandalone
    }));

    console.log('🔍 PWA支持状态:', { isPWASupported, isStandalone });
  }, []);

  // 📱 监听安装提示事件
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('📱 PWA安装提示事件触发');
      e.preventDefault();
      setInstallPromptEvent(e);
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        showInstallPrompt: !prev.isInstalled
      }));
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA已安装');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        showInstallPrompt: false
      }));
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 🔄 监听Service Worker状态
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker注册成功:', registration);
        
        setSwRegistration(registration);
        setState(prev => ({ ...prev, swRegistration: registration }));

        // 监听Service Worker状态变化
        const handleStateChange = () => {
          const sw = registration.active || registration.waiting || registration.installing;
          if (sw) {
            setState(prev => ({ ...prev, swState: sw.state as any }));
          }
        };

        if (registration.installing) {
          registration.installing.addEventListener('statechange', handleStateChange);
        }

        if (registration.waiting) {
          // 有新版本等待激活
          setState(prev => ({
            ...prev,
            hasUpdate: true,
            showUpdatePrompt: true
          }));
        }

        // 监听更新
        registration.addEventListener('updatefound', () => {
          console.log('🔄 发现Service Worker更新');
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('📦 新版本已准备就绪');
                setState(prev => ({
                  ...prev,
                  hasUpdate: true,
                  showUpdatePrompt: true
                }));
              }
            });
          }
        });

      } catch (error) {
        console.error('❌ Service Worker注册失败:', error);
      }
    };

    registerSW();

    // 监听来自Service Worker的消息
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'BOOK_CACHED':
          console.log('📖 书籍缓存完成:', payload);
          break;
        case 'CACHE_SIZE':
          console.log('📏 缓存大小:', payload.size);
          break;
        case 'SW_UPDATE_AVAILABLE':
          setState(prev => ({
            ...prev,
            hasUpdate: true,
            showUpdatePrompt: true
          }));
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // 📱 提示安装
  const promptInstall = useCallback(async () => {
    if (!installPromptEvent) {
      console.warn('⚠️ 没有可用的安装提示事件');
      return;
    }

    try {
      console.log('📱 显示安装提示');
      await installPromptEvent.prompt();
      
      const choice = await installPromptEvent.userChoice;
      console.log('👤 用户选择:', choice.outcome);
      
      setState(prev => ({ ...prev, showInstallPrompt: false }));
      setInstallPromptEvent(null);
      
      if (choice.outcome === 'accepted') {
        console.log('✅ 用户接受安装');
      } else {
        console.log('❌ 用户拒绝安装');
      }
    } catch (error) {
      console.error('❌ 安装提示失败:', error);
    }
  }, [installPromptEvent]);

  // ❌ 拒绝安装
  const dismissInstall = useCallback(() => {
    console.log('❌ 用户拒绝安装提示');
    setState(prev => ({ ...prev, showInstallPrompt: false }));
    
    // 7天后再次显示安装提示
    const dismissTime = Date.now();
    localStorage.setItem('pwa-install-dismissed', dismissTime.toString());
    
    setTimeout(() => {
      const storedTime = localStorage.getItem('pwa-install-dismissed');
      if (storedTime && Date.now() - parseInt(storedTime) > 7 * 24 * 60 * 60 * 1000) {
        setState(prev => ({ ...prev, showInstallPrompt: true }));
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7天
  }, []);

  // 🔄 提示更新
  const promptUpdate = useCallback(async () => {
    if (!swRegistration || !swRegistration.waiting) {
      console.warn('⚠️ 没有等待中的Service Worker');
      return;
    }

    try {
      console.log('🔄 开始更新应用');
      setState(prev => ({ ...prev, isUpdating: true }));

      // 向新的Service Worker发送SKIP_WAITING消息
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // 监听控制器变化
      const handleControllerChange = () => {
        console.log('✅ 应用更新完成，即将刷新页面');
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true });

      // 10秒后如果还没更新完成，手动刷新
      setTimeout(() => {
        window.location.reload();
      }, 10000);

    } catch (error) {
      console.error('❌ 更新失败:', error);
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [swRegistration]);

  // ⏭️ 跳过更新
  const skipUpdate = useCallback(() => {
    console.log('⏭️ 跳过此次更新');
    setState(prev => ({
      ...prev,
      showUpdatePrompt: false,
      hasUpdate: false
    }));
  }, []);

  // 🗑️ 清除缓存
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      console.log('🗑️ 开始清除缓存');
      
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ 缓存清除完成');
      }

      // 通知Service Worker清除缓存
      if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
      }

    } catch (error) {
      console.error('❌ 清除缓存失败:', error);
      throw error;
    }
  }, [swRegistration]);

  // 📏 获取缓存大小
  const getCacheSize = useCallback(async (): Promise<number> => {
    try {
      if (!('caches' in window)) return 0;

      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      console.log('📏 缓存总大小:', totalSize);
      return totalSize;

    } catch (error) {
      console.error('❌ 获取缓存大小失败:', error);
      return 0;
    }
  }, []);

  // 📨 发送消息给Service Worker
  const postMessage = useCallback((message: any) => {
    if (swRegistration && swRegistration.active) {
      swRegistration.active.postMessage(message);
      console.log('📨 发送消息给Service Worker:', message);
    } else {
      console.warn('⚠️ Service Worker未激活，无法发送消息');
    }
  }, [swRegistration]);

  return {
    // 状态
    ...state,
    
    // 操作
    promptInstall,
    dismissInstall,
    promptUpdate,
    skipUpdate,
    clearCache,
    getCacheSize,
    postMessage
  };
};