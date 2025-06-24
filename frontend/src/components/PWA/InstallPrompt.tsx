// frontend/src/components/PWA/InstallPrompt.tsx
import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Zap, BookOpen, Wifi } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface InstallPromptProps {
  onClose?: () => void;
  variant?: 'banner' | 'modal' | 'mini';
  autoShow?: boolean;
}

const InstallPrompt = ({ 
  onClose, 
  variant = 'banner',
  autoShow = true 
}: InstallPromptProps) => {
  const { isInstallable, isInstalled, showInstallPrompt, promptInstall, dismissInstall, isStandalone } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 控制显示状态
  useEffect(() => {
    if (autoShow && isInstallable && showInstallPrompt && !isInstalled && !isStandalone) {
      // 延迟显示，避免立即弹出
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 3000); // 3秒后显示

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [autoShow, isInstallable, showInstallPrompt, isInstalled, isStandalone]);

  const handleInstall = async () => {
    try {
      setIsAnimating(true);
      await promptInstall();
      handleClose();
    } catch (error) {
      console.error('❌ 安装失败:', error);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      dismissInstall();
      onClose?.();
    }, 300);
  };

  const handleDismiss = () => {
    handleClose();
  };

  if (!isVisible) return null;

  // 🏷️ Mini变体 - 简洁的浮动按钮
  if (variant === 'mini') {
    return (
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}>
        <button
          onClick={handleInstall}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
          title="安装阅读App"
        >
          <Download className="h-6 w-6 group-hover:animate-bounce" />
        </button>
        
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // 📱 Banner变体 - 顶部横幅
  if (variant === 'banner') {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-transform duration-300 ${
        isAnimating ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">安装阅读App到您的设备</p>
                <p className="text-sm text-blue-100">获得更快的加载速度和离线阅读体验</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>安装</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="text-blue-100 hover:text-white p-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🎛️ Modal变体 - 详细的模态框
  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${
      isAnimating ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 模态框内容 */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}>
          {/* 头部 */}
          <div className="relative p-6 text-center">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              安装阅读App
            </h3>
            <p className="text-gray-600">
              享受更快速、更便捷的阅读体验
            </p>
          </div>

          {/* 功能特性 */}
          <div className="px-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">快速启动</p>
                <p className="text-sm text-gray-600">像原生应用一样快速打开</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">离线阅读</p>
                <p className="text-sm text-gray-600">无网络也能继续阅读</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">原生体验</p>
                <p className="text-sm text-gray-600">添加到主屏幕，随时访问</p>
              </div>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>立即安装</span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="w-full text-gray-600 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              暂不安装
            </button>
          </div>

          {/* 底部说明 */}
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-500 text-center">
              安装后可在设备桌面找到应用图标，支持所有现有功能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;