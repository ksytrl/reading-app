// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import BookDetail from './pages/BookDetail/BookDetail';
import Reader from './pages/Reader/Reader';
import Profile from './pages/Profile/Profile';
import Upload from './pages/Upload/Upload'; // ✅ 只导入Upload组件

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/reader/:bookId/:chapterId" element={<Reader />} />
            
            {/* 受保护的路由 */}
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
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">我的书架</h1>
                    <p className="text-gray-600">书架功能开发中...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* ✅ 上传页面路由 */}
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">阅读设置</h1>
                    <p className="text-gray-600">设置功能开发中...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;