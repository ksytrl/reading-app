// frontend/src/components/PWA/OfflineIndicator.tsx
import { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Signal,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

interface OfflineIndicatorProps {
  variant?: 'banner' | 'badge' | 'toast' | 'status';
  position?: 'top' | 'bottom';
  showConnectionInfo?: boolean;
  autoHide?: boolean;
  onRetry?: () => void;
}

const OfflineIndicator = ({ 
  variant = 'banner',
  position = 'top',
  showConnectionInfo = false,
  autoHide = true,
  onRetry
}: OfflineIndicatorProps) => {
  const {
    isOnline,
    isOffline,
    wasOffline,
    offlineDuration,
    reconnectAttempts,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    attemptReconnect,
    getConnectionDescription
  } = useOffline();

  const [isVisible, setIsVisible] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // 控制显示状态
  useEffect(() => {
    if (isOffline) {
      setIsVisible(true);
      setShowReconnected(false);
    } else if (wasOffline && isOnline) {
      // 刚刚从离线恢复
      setShowReconnected(true);
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setShowReconnected(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else if (autoHide) {
      setIsVisible(false);
    }
  }, [isOffline, isOnline, wasOffline, autoHide]);

  // 处理重试连接
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const success = await attemptReconnect();
      if (success) {
        setIsVisible(false);
      }
      onRetry?.();
    } catch (error) {
      console.error('❌ 重试连接失败:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // 格式化时长
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 获取信号强度
  const getSignalStrength = () => {
    if (!downlink) return 'unknown';
    if (downlink >= 10) return 'excellent';
    if (downlink >= 1.5) return 'good';
    if (downlink >= 0.6) return 'fair';
    return 'poor';
  };

  const getSignalColor = () => {
    const strength = getSignalStrength();
    switch (strength) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!isVisible) return null;

  // 🏷️ Badge变体 - 简洁的状态徽章
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? showReconnected 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-100 text-blue-700'
          : 'bg-red-100 text-red-700'
      }`}>
        {isOnline ? (
          <>
            {showReconnected ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            <span>{showReconnected ? '已重连' : '在线'}</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>离线</span>
          </>
        )}
      </div>
    );
  }

  // 🍞 Toast变体 - 弹出式通知
  if (variant === 'toast') {
    return (
      <div className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} right-4 z-50 max-w-sm`}>
        <div className={`bg-white rounded-lg shadow-lg border-l-4 p-4 transition-all duration-300 ${
          isOnline 
            ? showReconnected 
              ? 'border-green-500' 
              : 'border-blue-500'
            : 'border-red-500'
        }`}>
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 ${
              isOnline 
                ? showReconnected 
                  ? 'text-green-500' 
                  : 'text-blue-500'
                : 'text-red-500'
            }`}>
              {isOnline ? (
                showReconnected ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Wifi className="h-5 w-5" />
                )
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {isOnline 
                  ? showReconnected 
                    ? '网络连接已恢复' 
                    : '网络连接正常'
                  : '网络连接中断'
                }
              </p>
              
              {isOffline && (
                <>
                  <p className="text-sm text-gray-600 mt-1">
                    已离线 {formatDuration(offlineDuration)}
                  </p>
                  {reconnectAttempts > 0 && (
                    <p className="text-xs text-gray-500">
                      重连尝试: {reconnectAttempts} 次
                    </p>
                  )}
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span>{isRetrying ? '重连中...' : '重试连接'}</span>
                  </button>
                </>
              )}
              
              {showReconnected && offlineDuration > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  离线时长: {formatDuration(offlineDuration)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📊 Status变体 - 详细状态信息
  if (variant === 'status') {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">网络状态</h3>
          <div className={`flex items-center space-x-2 ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? '在线' : '离线'}
            </span>
          </div>
        </div>

        {showConnectionInfo && isOnline && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">连接类型:</span>
              <span className="text-gray-900">{getConnectionDescription}</span>
            </div>
            
            {downlink && (
              <div className="flex justify-between">
                <span className="text-gray-600">下行速度:</span>
                <span className={`font-medium ${getSignalColor()}`}>
                  {downlink} Mbps
                </span>
              </div>
            )}
            
            {rtt && (
              <div className="flex justify-between">
                <span className="text-gray-600">延迟:</span>
                <span className="text-gray-900">{rtt}ms</span>
              </div>
            )}
            
            {saveData && (
              <div className="flex justify-between">
                <span className="text-gray-600">省流模式:</span>
                <span className="text-orange-600">已启用</span>
              </div>
            )}
          </div>
        )}

        {isOffline && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">离线时长:</span>
              <span className="text-red-600">{formatDuration(offlineDuration)}</span>
            </div>
            
            {reconnectAttempts > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">重连尝试:</span>
                <span className="text-gray-900">{reconnectAttempts} 次</span>
              </div>
            )}
            
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full mt-3 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isRetrying ? '重连中...' : '重试连接'}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 📢 Banner变体 - 顶部横幅（默认）
  return (
    <div className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
      position === 'top' ? 'top-0' : 'bottom-0'
    } ${
      isOnline 
        ? showReconnected 
          ? 'bg-green-600' 
          : 'bg-blue-600'
        : 'bg-red-600'
    } text-white shadow-lg`}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isOnline ? (
                showReconnected ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Wifi className="h-5 w-5" />
                )
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
            </div>
            
            <div>
              <p className="font-medium">
                {isOnline 
                  ? showReconnected 
                    ? '🎉 网络连接已恢复' 
                    : '🌐 网络连接正常'
                  : '🔌 网络连接中断'
                }
              </p>
              
              <p className="text-sm opacity-90">
                {isOffline ? (
                  <>
                    已离线 {formatDuration(offlineDuration)}
                    {reconnectAttempts > 0 && ` • 重连尝试 ${reconnectAttempts} 次`}
                  </>
                ) : showReconnected && offlineDuration > 0 ? (
                  `离线时长: ${formatDuration(offlineDuration)}`
                ) : (
                  '所有功能正常可用'
                )}
              </p>
            </div>
          </div>
          
          {isOffline && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isRetrying ? '重连中...' : '重试'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;