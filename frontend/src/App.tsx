// frontend/src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// 🔧 PWA相关导入
import { usePWA } from './hooks/usePWA';
import { useOffline } from './hooks/useOffline';
import InstallPrompt from './components/PWA/InstallPrompt';
import OfflineIndicator from './components/PWA/OfflineIndicator';
import UpdatePrompt from './components/PWA/UpdatePrompt';

// 📱 页面组件导入
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import BookDetail from './pages/BookDetail/BookDetail';
import Reader from './pages/Reader/Reader';
import Profile from './pages/Profile/Profile';
import Upload from './pages/Upload/Upload';
import Bookshelf from './pages/Bookshelf/Bookshelf';
import Search from './pages/Search/Search';

function App() {
  const { initAuth } = useAuthStore();
  
  // 🔧 PWA状态和功能
  const {
    isInstallable,
    showInstallPrompt,
    hasUpdate,
    showUpdatePrompt,
    isStandalone,
    isPWASupported
  } = usePWA();
  
  // 🌐 网络状态
  const { isOffline, isOnline } = useOffline();

  // 🔧 初始化应用
  useEffect(() => {
    // 初始化认证状态
    initAuth();
    
    // 🔍 PWA调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 PWA状态:', {
        isPWASupported,
        isInstallable,
        isStandalone,
        isOnline,
        isOffline
      });
    }
  }, [initAuth, isPWASupported, isInstallable, isStandalone, isOnline, isOffline]);

  // 📱 PWA安装状态处理
  useEffect(() => {
    // 监听PWA安装提示可用事件
    const handleInstallPromptAvailable = () => {
      console.log('📱 PWA安装提示现在可用');
    };

    // 监听PWA安装完成事件
    const handlePWAInstalled = () => {
      console.log('🎉 PWA安装完成');
      // 可以在这里显示欢迎消息或引导
    };

    // 监听网络状态变化事件
    const handleNetworkOnline = () => {
      console.log('🌐 网络已恢复');
      // 可以在这里触发数据同步或显示提示
    };

    const handleNetworkOffline = () => {
      console.log('🔌 网络已断开');
      // 可以在这里显示离线提示
    };

    window.addEventListener('pwa-install-prompt-available', handleInstallPromptAvailable);
    window.addEventListener('pwa-installed', handlePWAInstalled);
    window.addEventListener('network-online', handleNetworkOnline);
    window.addEventListener('network-offline', handleNetworkOffline);

    return () => {
      window.removeEventListener('pwa-install-prompt-available', handleInstallPromptAvailable);
      window.removeEventListener('pwa-installed', handlePWAInstalled);
      window.removeEventListener('network-online', handleNetworkOnline);
      window.removeEventListener('network-offline', handleNetworkOffline);
    };
  }, []);

  // 🎨 PWA样式调整
  const appClasses = `
    min-h-screen 
    bg-gray-50 
    ${isStandalone ? 'pwa-standalone' : ''}
    ${isOffline ? 'pwa-offline' : ''}
  `;

  return (
    <Router>
      <div className={appClasses}>
        {/* 🌐 离线状态指示器 */}
        <OfflineIndicator 
          variant="banner"
          position="top"
          showConnectionInfo={false}
          autoHide={true}
        />
        
        {/* 📱 PWA安装提示 */}
        {isPWASupported && isInstallable && showInstallPrompt && !isStandalone && (
          <InstallPrompt 
            variant="banner"
            autoShow={true}
            onClose={() => {
              console.log('📱 安装提示已关闭');
            }}
          />
        )}
        
        {/* 🔄 PWA更新提示 */}
        {hasUpdate && showUpdatePrompt && (
          <UpdatePrompt 
            variant="banner"
            autoShow={true}
            updateNotes={[
              '🚀 性能优化和加载速度提升',
              '📱 改进离线阅读体验',
              '🛠️ 修复已知问题',
              '🎨 界面优化和用户体验改进'
            ]}
            onClose={() => {
              console.log('🔄 更新提示已关闭');
            }}
          />
        )}

        {/* 📱 主应用布局 */}
        <Layout>
          <Routes>
            {/* 🏠 公开路由 */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<Search />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/reader/:bookId/:chapterId" element={<Reader />} />
            
            {/* 🔒 受保护的路由 */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookshelf" 
              element={
                <ProtectedRoute>
                  <Bookshelf />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } 
            />
            
            {/* 🔧 PWA相关路由 */}
            <Route 
              path="/pwa-info" 
              element={
                <div className="max-w-4xl mx-auto py-8">
                  <PWAInfoPage />
                </div>
              } 
            />
            
            {/* ⚙️ 设置路由 */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <div className="max-w-4xl mx-auto py-8">
                    <SettingsPage />
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>

        {/* 🔄 Service Worker通信处理 */}
        <ServiceWorkerHandler />
      </div>
    </Router>
  );
}

// 📱 PWA信息页面组件
const PWAInfoPage = () => {
  const { isPWASupported, isStandalone, isInstallable } = usePWA();
  const { isOnline, getConnectionDescription } = useOffline();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">📱 PWA功能状态</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">支持状态</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>PWA支持:</span>
                <span className={isPWASupported ? 'text-green-600' : 'text-red-600'}>
                  {isPWASupported ? '✅ 支持' : '❌ 不支持'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>可安装:</span>
                <span className={isInstallable ? 'text-green-600' : 'text-gray-500'}>
                  {isInstallable ? '✅ 可安装' : '⏳ 不可安装'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>独立模式:</span>
                <span className={isStandalone ? 'text-green-600' : 'text-gray-500'}>
                  {isStandalone ? '✅ 已安装' : '📱 浏览器模式'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">网络状态</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>连接状态:</span>
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? '🌐 在线' : '🔌 离线'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>连接类型:</span>
                <span className="text-gray-700">{getConnectionDescription()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 PWA功能特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-medium text-gray-900">应用安装</h3>
            <p className="text-sm text-gray-600 mt-1">添加到主屏幕，像原生应用一样使用</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl mb-2">🔌</div>
            <h3 className="font-medium text-gray-900">离线阅读</h3>
            <p className="text-sm text-gray-600 mt-1">无网络也能继续阅读已缓存的内容</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-900">快速启动</h3>
            <p className="text-sm text-gray-600 mt-1">缓存技术让应用启动更快</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ⚙️ 设置页面组件
const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">⚙️ 应用设置</h1>
        <p className="text-gray-600">设置功能开发中，敬请期待...</p>
        
        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">缓存管理</h3>
            <button 
              onClick={() => {
                if (confirm('确定要清除所有缓存吗？这将删除离线内容。')) {
                  // 这里调用清除缓存的方法
                  localStorage.clear();
                  sessionStorage.clear();
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  }
                  alert('缓存已清除');
                  window.location.reload();
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ 清除所有缓存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔄 Service Worker通信处理组件
const ServiceWorkerHandler = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 监听来自Service Worker的消息
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'BOOK_CACHED':
            console.log('📚 书籍缓存完成:', payload);
            // 可以显示通知或更新UI
            break;
          case 'CACHE_SIZE':
            console.log('📏 缓存大小:', payload);
            break;
          case 'SYNC_COMPLETE':
            console.log('🔄 数据同步完成:', payload);
            break;
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  return null; // 这个组件不渲染任何内容
};

export default App;