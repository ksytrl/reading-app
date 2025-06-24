// frontend/src/components/PWA/UpdatePrompt.tsx
import { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  RefreshCw, 
  Sparkles, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface UpdatePromptProps {
  variant?: 'banner' | 'modal' | 'toast' | 'minimal';
  position?: 'top' | 'bottom';
  autoShow?: boolean;
  updateNotes?: string[];
  customTitle?: string;
  customDescription?: string;
  onUpdate?: () => void;
  onDismiss?: () => void;
  onClose?: () => void;
}

const UpdatePrompt = ({
  variant = 'banner',
  position = 'top',
  autoShow = true,
  updateNotes = [],
  customTitle,
  customDescription,
  onUpdate,
  onDismiss,
  onClose
}: UpdatePromptProps) => {
  const { 
    hasUpdate, 
    showUpdatePrompt, 
    isUpdating,
    updateError,
    updateApp, 
    dismissUpdatePrompt 
  } = usePWA();

  const [isVisible, setIsVisible] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 🔧 控制显示状态
  useEffect(() => {
    if (autoShow && hasUpdate && showUpdatePrompt) {
      // 💫 延迟显示以避免干扰用户操作
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [autoShow, hasUpdate, showUpdatePrompt]);

  // ⏰ 自动更新倒计时
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown <= 0) {
      handleUpdate();
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  // 🔄 处理更新
  const handleUpdate = async () => {
    try {
      const success = await updateApp();
      
      if (success) {
        setUpdateSuccess(true);
        onUpdate?.();
      }
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  // 🚫 处理关闭
  const handleClose = () => {
    setIsVisible(false);
    dismissUpdatePrompt();
    onClose?.();
  };

  // 🚫 处理忽略
  const handleDismiss = () => {
    setIsVisible(false);
    dismissUpdatePrompt();
    onDismiss?.();
    
    // 📝 记录用户忽略更新
    localStorage.setItem('pwa_update_dismissed', Date.now().toString());
  };

  // ⏰ 开始自动更新倒计时
  const startAutoUpdate = (seconds = 10) => {
    setCountdown(seconds);
  };

  // 🔧 如果不需要显示，返回null
  if (!isVisible || !hasUpdate) {
    return null;
  }

  // 🎨 渲染横幅样式
  if (variant === 'banner') {
    return (
      <div className={`fixed left-0 right-0 z-50 transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 
        position === 'top' ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0'
      } ${position === 'top' ? 'top-0' : 'bottom-0'}`}>
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* 🔄 左侧内容 */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {updateError ? (
                    <AlertCircle className="h-8 w-8 text-red-300" />
                  ) : updateSuccess ? (
                    <CheckCircle className="h-8 w-8 text-green-300" />
                  ) : isUpdating ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Sparkles className="h-8 w-8" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base">
                    {updateError ? '更新失败' :
                     updateSuccess ? '更新成功！' :
                     isUpdating ? '正在更新...' :
                     customTitle || '新版本可用'}
                  </p>
                  <p className="text-xs sm:text-sm opacity-90">
                    {updateError ? updateError :
                     updateSuccess ? '应用将在几秒后重启' :
                     isUpdating ? '请稍候，正在应用更新' :
                     customDescription || '立即更新以获得最新功能和修复'}
                  </p>
                  {countdown !== null && countdown > 0 && (
                    <p className="text-xs text-yellow-300 mt-1">
                      {countdown}秒后自动更新
                    </p>
                  )}
                </div>
              </div>

              {/* 🔧 右侧操作 */}
              <div className="flex items-center space-x-2">
                {updateSuccess ? (
                  <div className="flex items-center space-x-2 text-green-300">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">即将重启</span>
                  </div>
                ) : updateError ? (
                  <button
                    onClick={handleUpdate}
                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">重试</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isUpdating ? '更新中...' : '立即更新'}
                      </span>
                    </button>
                    
                    {countdown === null && (
                      <button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        title="稍后提醒"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎨 渲染模态框样式
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* 🔄 头部 */}
          <div className="relative p-6 text-center border-b border-gray-200">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              {updateError ? (
                <AlertCircle className="h-8 w-8 text-white" />
              ) : updateSuccess ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : isUpdating ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Sparkles className="h-8 w-8 text-white" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {updateError ? '更新失败' :
               updateSuccess ? '更新完成！' :
               isUpdating ? '正在更新' :
               customTitle || '发现新版本'}
            </h2>
            <p className="text-gray-600">
              {updateError ? '更新过程中发生错误，请重试' :
               updateSuccess ? '应用已更新到最新版本' :
               isUpdating ? '正在下载和安装更新...' :
               customDescription || '包含新功能和错误修复'}
            </p>
          </div>

          {/* 📝 更新说明 */}
          {updateNotes.length > 0 && !isUpdating && !updateError && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🎉 本次更新内容</h3>
              <ul className="space-y-2">
                {updateNotes.map((note, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 🔧 操作按钮 */}
          <div className="p-6 pt-0">
            {updateSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                <p className="text-green-600 font-medium">更新成功！</p>
                <p className="text-sm text-gray-600 mt-1">应用将在几秒后重启</p>
              </div>
            ) : updateError ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{updateError}</p>
                </div>
                <button
                  onClick={handleUpdate}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>重试更新</span>
                </button>
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  稍后处理
                </button>
              </div>
            ) : isUpdating ? (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">正在应用更新，请稍候...</p>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleUpdate}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span>立即更新</span>
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startAutoUpdate(30)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    30秒后自动更新
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    稍后提醒
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🎨 渲染Toast样式
  if (variant === 'toast') {
    return (
      <div className={`fixed right-4 z-50 max-w-sm transition-all duration-500 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${position === 'top' ? 'top-4' : 'bottom-4'}`}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {updateError ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : updateSuccess ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : isUpdating ? (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              ) : (
                <Sparkles className="h-6 w-6 text-blue-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900">
                {updateError ? '更新失败' :
                 updateSuccess ? '更新完成' :
                 isUpdating ? '正在更新' :
                 '新版本可用'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {updateError ? '请重试更新' :
                 updateSuccess ? '应用即将重启' :
                 isUpdating ? '请稍候...' :
                 '包含新功能和修复'}
              </p>
              
              {!isUpdating && !updateSuccess && !updateError && (
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={handleUpdate}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    更新
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    稍后
                  </button>
                </div>
              )}
              
              {updateError && (
                <button
                  onClick={handleUpdate}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  重试
                </button>
              )}
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🎨 渲染极简样式
  return (
    <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      {isUpdating ? (
        <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
      ) : (
        <Download className="h-5 w-5 text-green-600" />
      )}
      <span className="text-sm text-green-800 flex-1">
        {isUpdating ? '正在更新应用...' : customTitle || '新版本可用，立即更新'}
      </span>
      {!isUpdating && (
        <>
          <button
            onClick={handleUpdate}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            更新
          </button>
          <button
            onClick={handleClose}
            className="text-green-400 hover:text-green-600"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default UpdatePrompt;