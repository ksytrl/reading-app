// frontend/src/hooks/useOffline.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkState {
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

interface OfflineState extends NetworkState {
  wasOffline: boolean;
  offlineDuration: number;
  lastOnlineTime: number | null;
  reconnectAttempts: number;
}

interface OfflineActions {
  // 网络检测
  checkConnectivity: () => Promise<boolean>;
  
  // 重连相关
  attemptReconnect: () => Promise<boolean>;
  resetReconnectAttempts: () => void;
  
  // 事件监听
  onOnline: (callback: () => void) => () => void;
  onOffline: (callback: () => void) => () => void;
  onNetworkChange: (callback: (state: NetworkState) => void) => () => void;
  
  // 工具方法
  getConnectionDescription: () => string;
}

// 网络连接类型映射
const CONNECTION_TYPE_MAP: Record<string, string> = {
  'slow-2g': '2G慢速',
  '2g': '2G',
  '3g': '3G', 
  '4g': '4G',
  '5g': '5G',
  'wifi': 'WiFi',
  'ethernet': '以太网',
  'cellular': '蜂窝网络',
  'bluetooth': '蓝牙',
  'wimax': 'WiMax'
};

export const useOffline = (): OfflineState & OfflineActions => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    connectionType: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false
  });

  const [offlineState, setOfflineState] = useState({
    wasOffline: false,
    offlineDuration: 0,
    lastOnlineTime: Date.now(),
    reconnectAttempts: 0
  });

  const offlineStartTime = useRef<number | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const onlineCallbacks = useRef<Set<() => void>>(new Set());
  const offlineCallbacks = useRef<Set<() => void>>(new Set());
  const networkChangeCallbacks = useRef<Set<(state: NetworkState) => void>>(new Set());

  // 🔍 获取网络连接信息
  const getNetworkInfo = useCallback((): Pick<NetworkState, 'connectionType' | 'effectiveType' | 'downlink' | 'rtt' | 'saveData'> => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return {
        connectionType: null,
        effectiveType: null,
        downlink: null,
        rtt: null,
        saveData: false
      };
    }

    return {
      connectionType: connection.type || null,
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false
    };
  }, []);

  // 🌐 检查网络连接性
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    // 首先检查navigator.onLine
    if (!navigator.onLine) {
      return false;
    }

    try {
      // 尝试请求一个小的资源来验证网络连接
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      console.log('🔌 网络连接检查失败:', error);
      return false;
    }
  }, []);

  // 🔄 尝试重新连接
  const attemptReconnect = useCallback(async (): Promise<boolean> => {
    console.log('🔄 尝试重新连接...');
    
    setOfflineState(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1
    }));

    const isConnected = await checkConnectivity();
    
    if (isConnected) {
      console.log('✅ 网络连接已恢复');
      return true;
    }

    // 指数退避重试
    const delay = Math.min(1000 * Math.pow(2, offlineState.reconnectAttempts), 30000);
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    reconnectTimer.current = setTimeout(() => {
      if (!networkState.isOnline) {
        attemptReconnect();
      }
    }, delay);

    return false;
  }, [checkConnectivity, networkState.isOnline, offlineState.reconnectAttempts]);

  // 🔄 重置重连尝试计数
  const resetReconnectAttempts = useCallback(() => {
    setOfflineState(prev => ({
      ...prev,
      reconnectAttempts: 0
    }));
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  // 📡 更新网络状态
  const updateNetworkState = useCallback((isOnline: boolean) => {
    const networkInfo = getNetworkInfo();
    const now = Date.now();

    const newNetworkState: NetworkState = {
      isOnline,
      isOffline: !isOnline,
      ...networkInfo
    };

    setNetworkState(newNetworkState);

    // 更新离线状态
    if (isOnline) {
      // 从离线恢复到在线
      if (!networkState.isOnline) {
        console.log('🌐 网络连接已恢复');
        
        const offlineDuration = offlineStartTime.current 
          ? now - offlineStartTime.current 
          : 0;

        setOfflineState(prev => ({
          ...prev,
          wasOffline: true,
          offlineDuration,
          lastOnlineTime: now,
          reconnectAttempts: 0
        }));

        offlineStartTime.current = null;
        
        // 重置重连定时器
        resetReconnectAttempts();

        // 触发在线回调
        onlineCallbacks.current.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('❌ 在线回调执行失败:', error);
          }
        });
      }
    } else {
      // 从在线变为离线
      if (networkState.isOnline) {
        console.log('🔌 网络连接已断开');
        
        offlineStartTime.current = now;
        
        setOfflineState(prev => ({
          ...prev,
          wasOffline: false,
          reconnectAttempts: 0
        }));

        // 触发离线回调
        offlineCallbacks.current.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('❌ 离线回调执行失败:', error);
          }
        });

        // 开始尝试重连
        setTimeout(() => attemptReconnect(), 1000);
      }
    }

    // 触发网络状态变化回调
    networkChangeCallbacks.current.forEach(callback => {
      try {
        callback(newNetworkState);
      } catch (error) {
        console.error('❌ 网络状态变化回调执行失败:', error);
      }
    });
  }, [networkState.isOnline, getNetworkInfo, resetReconnectAttempts, attemptReconnect]);

  // 📱 事件监听器
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 浏览器报告: 网络已连接');
      // 异步验证网络连接
      checkConnectivity().then(isConnected => {
        updateNetworkState(isConnected);
      });
    };

    const handleOffline = () => {
      console.log('📡 浏览器报告: 网络已断开');
      updateNetworkState(false);
    };

    const handleConnectionChange = () => {
      console.log('📡 网络连接信息变化');
      const networkInfo = getNetworkInfo();
      setNetworkState(prev => ({ ...prev, ...networkInfo }));
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        // 页面重新激活时检查网络连接
        checkConnectivity().then(isConnected => {
          if (isConnected !== networkState.isOnline) {
            updateNetworkState(isConnected);
          }
        });
      }
    };

    // 添加事件监听器
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 网络连接信息变化监听
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // 初始化网络状态
    checkConnectivity().then(isConnected => {
      updateNetworkState(isConnected);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [checkConnectivity, updateNetworkState, networkState.isOnline]);

  // 🕐 离线时长计算
  useEffect(() => {
    if (!networkState.isOnline && offlineStartTime.current) {
      const interval = setInterval(() => {
        const duration = Date.now() - offlineStartTime.current!;
        setOfflineState(prev => ({
          ...prev,
          offlineDuration: duration
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [networkState.isOnline]);

  // 📞 事件监听器管理
  const onOnline = useCallback((callback: () => void) => {
    onlineCallbacks.current.add(callback);
    return () => {
      onlineCallbacks.current.delete(callback);
    };
  }, []);

  const onOffline = useCallback((callback: () => void) => {
    offlineCallbacks.current.add(callback);
    return () => {
      offlineCallbacks.current.delete(callback);
    };
  }, []);

  const onNetworkChange = useCallback((callback: (state: NetworkState) => void) => {
    networkChangeCallbacks.current.add(callback);
    return () => {
      networkChangeCallbacks.current.delete(callback);
    };
  }, []);

  // 🏷️ 获取连接类型描述
  const getConnectionDescription = useCallback(() => {
    if (!networkState.isOnline) return '离线';
    
    const type = networkState.connectionType;
    const effectiveType = networkState.effectiveType;
    
    if (type && CONNECTION_TYPE_MAP[type]) {
      return CONNECTION_TYPE_MAP[type];
    }
    
    if (effectiveType && CONNECTION_TYPE_MAP[effectiveType]) {
      return CONNECTION_TYPE_MAP[effectiveType];
    }
    
    return '在线';
  }, [networkState]);

  return {
    // 网络状态
    ...networkState,
    
    // 离线状态
    ...offlineState,
    
    // 操作方法
    checkConnectivity,
    attemptReconnect,
    resetReconnectAttempts,
    onOnline,
    onOffline,
    onNetworkChange,
    
    // 工具方法 - 返回函数而不是函数调用结果
    getConnectionDescription
  };
};