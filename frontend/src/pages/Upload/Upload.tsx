// src/pages/Upload/Upload.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, BookOpen, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

interface UploadProgress {
  progress: number;
  stage: 'uploading' | 'parsing' | 'creating' | 'completed' | 'error';
  message: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // 如果未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登录</h2>
        <p className="text-gray-600 mb-6">请先登录才能上传书籍</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          去登录
        </button>
      </div>
    );
  }

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      alert('请选择txt格式的文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小不能超过50MB');
      return;
    }

    setSelectedFile(file);
    setUploadProgress(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('txtFile', selectedFile);

    try {
      setUploadProgress({
        progress: 10,
        stage: 'uploading',
        message: '正在上传文件...'
      });

      const response = await api.post('/books/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setUploadProgress({
              progress: progress,
              stage: 'uploading',
              message: `正在上传文件... ${progress}%`
            });
          }
        }
      });

      setUploadProgress({
        progress: 60,
        stage: 'parsing',
        message: '正在解析章节...'
      });

      // 模拟解析时间
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadProgress({
        progress: 90,
        stage: 'creating',
        message: '正在创建书籍记录...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadProgress({
        progress: 100,
        stage: 'completed',
        message: `上传成功！解析了 ${response.data.chaptersCount} 个章节`
      });

      // 3秒后跳转到书籍详情页
      setTimeout(() => {
        navigate(`/book/${response.data.book.id}`);
      }, 3000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadProgress({
        progress: 0,
        stage: 'error',
        message: error.response?.data?.error || '上传失败'
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">上传txt书籍</h1>
        <p className="text-gray-600">
          支持完整小说txt文件，系统将自动识别章节并创建阅读体验
        </p>
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📖 使用说明</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 支持txt格式文件，最大50MB</li>
          <li>• 系统会自动识别章节标题（如：第一章、第1回、Chapter 1等）</li>
          <li>• 自动提取书名、作者信息</li>
          <li>• 上传后可在个人书架中管理</li>
        </ul>
      </div>

      {/* 文件上传区域 */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        {!selectedFile ? (
          <div
            className={`p-12 text-center cursor-pointer transition-colors ${
              dragOver ? 'bg-blue-50 border-blue-400' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              选择或拖拽txt文件到这里
            </h3>
            <p className="text-gray-500 mb-4">
              支持拖拽上传或点击选择文件
            </p>
            <button
              type="button"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              选择文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-8">
            {/* 选中的文件信息 */}
            <div className="flex items-start space-x-4 mb-6">
              <FileText className="h-12 w-12 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedFile.name}</h3>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)} • 文本文件
                </p>
              </div>
              <button
                onClick={resetUpload}
                className="text-gray-400 hover:text-red-500 transition-colors"
                disabled={uploadProgress?.stage === 'uploading'}
              >
                ✕
              </button>
            </div>

            {/* 上传进度 */}
            {uploadProgress && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {uploadProgress.message}
                  </span>
                  <span className="text-sm text-gray-500">
                    {uploadProgress.progress}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      uploadProgress.stage === 'error' 
                        ? 'bg-red-500' 
                        : uploadProgress.stage === 'completed'
                        ? 'bg-green-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>

                {uploadProgress.stage === 'completed' && (
                  <div className="flex items-center mt-3 text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm">
                      上传成功！3秒后将跳转到书籍详情页...
                    </span>
                  </div>
                )}

                {uploadProgress.stage === 'error' && (
                  <div className="flex items-center mt-3 text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm">{uploadProgress.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            {!uploadProgress && (
              <div className="flex space-x-4">
                <button
                  onClick={uploadFile}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  开始上传
                </button>
                <button
                  onClick={resetUpload}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  重新选择
                </button>
              </div>
            )}

            {uploadProgress?.stage === 'error' && (
              <div className="flex space-x-4">
                <button
                  onClick={uploadFile}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  重试上传
                </button>
                <button
                  onClick={resetUpload}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  重新选择
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 我的上传记录 */}
      <UserBooksSection />
    </div>
  );
};

// 用户上传的书籍列表组件
const UserBooksSection = () => {
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserBooks = async () => {
    try {
      const response = await api.get('/users/books');
      setUserBooks(response.data);
    } catch (error) {
      console.error('Failed to load user books:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId: number, bookTitle: string) => {
    if (!confirm(`确定要删除《${bookTitle}》吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await api.delete(`/books/${bookId}`);
      setUserBooks(userBooks.filter(book => book.id !== bookId));
      alert('删除成功');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    }
  };

  useEffect(() => {
    loadUserBooks();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">我上传的书籍</h3>
      </div>
      
      {userBooks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>还没有上传任何书籍</p>
          <p className="text-sm">上传您的第一本书籍吧！</p>
        </div>
      ) : (
        <div className="divide-y">
          {userBooks.map((book) => (
            <div key={book.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{book.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {book.author}
                    </span>
                    <span>{book.totalChapters} 章节</span>
                    <span>{Math.round(book.totalWords / 1000)}k字</span>
                    <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    查看
                  </button>
                  <button
                    onClick={() => deleteBook(book.id, book.title)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Upload;