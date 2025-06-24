// frontend/src/pages/Upload/Upload.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, AlertCircle, CheckCircle, BookOpen, File, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface UploadProgress {
  progress: number;
  stage: 'uploading' | 'parsing' | 'creating' | 'completed' | 'error';
  message: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  format: 'txt' | 'epub' | 'pdf';
}

const Upload = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
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

  // 支持的文件格式配置
  const supportedFormats = {
    txt: {
      label: 'TXT文本',
      description: '支持章节自动识别，在线阅读体验最佳',
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      features: ['章节自动识别', '在线阅读', '全文检索']
    },
    epub: {
      label: 'EPUB电子书',
      description: '标准电子书格式，保留原始排版',
      icon: <BookOpen className="w-6 h-6 text-green-600" />,
      features: ['保留排版', '书签支持', '下载阅读']
    },
    pdf: {
      label: 'PDF文档',
      description: '文档格式，适合图文混排内容',
      icon: <File className="w-6 h-6 text-red-600" />,
      features: ['原版显示', '图文支持', '下载查看']
    }
  };

  const getFileFormat = (file: File): 'txt' | 'epub' | 'pdf' | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt': return 'txt';
      case 'epub': return 'epub';
      case 'pdf': return 'pdf';
      default: return null;
    }
  };

  const handleFileSelect = (file: File) => {
    const format = getFileFormat(file);
    
    if (!format) {
      alert('请选择支持的文件格式：TXT、EPUB 或 PDF');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小不能超过50MB');
      return;
    }

    setSelectedFile(file);
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
      format
    });
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

  // 🎯 使用XMLHttpRequest支持上传进度的上传函数
  const uploadFile = async () => {
    if (!selectedFile || !fileInfo) return;

    return new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('auth-token');

      // 设置请求头
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // 上传进度监听
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 50); // 上传阶段占50%
          setUploadProgress(prev => prev ? {
            ...prev,
            progress: Math.min(percentComplete, 50)
          } : null);
        }
      });

      // 请求状态变化监听
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              
              // 解析阶段
              setUploadProgress({
                progress: 60,
                stage: 'parsing',
                message: fileInfo.format === 'txt' ? '正在解析章节...' : '正在处理文件...'
              });

              setTimeout(() => {
                // 创建记录阶段
                setUploadProgress({
                  progress: 90,
                  stage: 'creating',
                  message: '正在创建书籍记录...'
                });

                setTimeout(() => {
                  // 完成
                  setUploadProgress({
                    progress: 100,
                    stage: 'completed',
                    message: `上传成功！${result.chaptersCount ? `解析了 ${result.chaptersCount} 个章节，` : ''}已自动添加到书架`
                  });

                  // 2秒后显示跳转选项
                  setTimeout(() => {
                    const userChoice = confirm(
                      `《${result.book?.title || '书籍'}》上传成功！\n\n点击"确定"跳转到书架\n点击"取消"跳转到书籍详情页`
                    );
                    
                    if (userChoice) {
                      navigate('/bookshelf');
                    } else {
                      navigate(`/book/${result.book?.id || 1}`);
                    }
                  }, 2000);

                  resolve();
                }, 500);
              }, 1500);

            } catch (error) {
              console.error('Failed to parse response:', error);
              setUploadProgress({
                progress: 0,
                stage: 'error',
                message: '服务器响应格式错误'
              });
              reject(error);
            }
          } else {
            let errorMessage = '上传失败';
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage = errorResponse.error || errorMessage;
            } catch {
              errorMessage = `上传失败 (状态码: ${xhr.status})`;
            }
            
            setUploadProgress({
              progress: 0,
              stage: 'error',
              message: errorMessage
            });
            reject(new Error(errorMessage));
          }
        }
      });

      // 错误处理
      xhr.addEventListener('error', () => {
        setUploadProgress({
          progress: 0,
          stage: 'error',
          message: '网络错误，请检查连接'
        });
        reject(new Error('网络错误'));
      });

      // 超时处理
      xhr.addEventListener('timeout', () => {
        setUploadProgress({
          progress: 0,
          stage: 'error',
          message: '上传超时，请重试'
        });
        reject(new Error('上传超时'));
      });

      // 开始上传
      setUploadProgress({
        progress: 10,
        stage: 'uploading',
        message: '正在上传文件...'
      });

      xhr.timeout = 300000; // 5分钟超时
      xhr.open('POST', '/api/books/upload', true);
      xhr.send(formData);
    });
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setFileInfo(null);
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

  const getFormatIcon = (format: 'txt' | 'epub' | 'pdf') => {
    switch (format) {
      case 'txt': return <FileText className="w-6 h-6 text-blue-600" />;
      case 'epub': return <BookOpen className="w-6 h-6 text-green-600" />;
      case 'pdf': return <File className="w-6 h-6 text-red-600" />;
    }
  };

  const getFormatBadge = (format: 'txt' | 'epub' | 'pdf') => {
    const styles = {
      txt: 'bg-blue-100 text-blue-800',
      epub: 'bg-green-100 text-green-800',
      pdf: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${styles[format]}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">上传电子书</h1>
        <p className="text-gray-600">
          支持多种格式电子书，系统将自动识别并创建最佳阅读体验
        </p>
      </div>

      {/* 格式支持说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">📚 支持的文件格式</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(supportedFormats).map(([format, info]) => (
            <div key={format} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="mr-3">
                  {info.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{info.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                </div>
              </div>
              <div className="space-y-1">
                {info.features.map((feature, index) => (
                  <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-blue-800">
          <p>• 支持文件大小：最大50MB</p>
          <p>• TXT格式会自动识别章节标题（如：第一章、第1回、Chapter 1等）</p>
          <p>• 上传成功后会自动添加到您的书架</p>
        </div>
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
              选择或拖拽文件到这里
            </h3>
            <p className="text-gray-500 mb-4">
              支持 TXT、EPUB、PDF 格式，拖拽上传或点击选择文件
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
              accept=".txt,.epub,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-8">
            {/* 选中的文件信息 */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                {getFormatIcon(fileInfo!.format)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{selectedFile.name}</h3>
                  <span className={getFormatBadge(fileInfo!.format)}>
                    {fileInfo!.format.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {formatFileSize(selectedFile.size)} • {supportedFormats[fileInfo!.format].label}
                </p>
                <p className="text-sm text-gray-600">
                  {supportedFormats[fileInfo!.format].description}
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
                      上传成功！已自动添加到书架，2秒后将显示跳转选项...
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

      {/* 使用提示 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">💡 使用提示</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">📖 TXT格式</h4>
            <ul className="space-y-1">
              <li>• 支持自动章节识别</li>
              <li>• 提取书名和作者信息</li>
              <li>• 最佳在线阅读体验</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">📚 EPUB/PDF格式</h4>
            <ul className="space-y-1">
              <li>• 保留原始文档格式</li>
              <li>• 支持下载离线阅读</li>
              <li>• 适合图文混排内容</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 我的上传记录 */}
      <UserBooksSection />
    </div>
  );
};

// 🎯 用户上传的书籍列表组件
const UserBooksSection = () => {
  const [userBooks, setUserBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserBooks = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/users/books', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const books = await response.json();
        setUserBooks(books);
      }
    } catch (error) {
      console.error('Failed to load user books:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUserBooks();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">我的上传记录</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">我的上传记录</h3>
        <User className="h-5 w-5 text-gray-400" />
      </div>
      
      {userBooks.length > 0 ? (
        <div className="space-y-3">
          {userBooks.slice(0, 5).map((book) => (
            <div
              key={book.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{book.title}</h4>
                  <p className="text-sm text-gray-500">
                    {book.author} • {book.totalChapters || 1}章节
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date(book.createdAt).toLocaleDateString()}
                </p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {book.originalFormat?.toUpperCase() || 'TXT'}
                </span>
              </div>
            </div>
          ))}
          
          {userBooks.length > 5 && (
            <button
              onClick={() => navigate('/bookshelf')}
              className="w-full py-2 text-blue-600 text-sm hover:text-blue-700"
            >
              查看全部 {userBooks.length} 本书籍 →
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">还没有上传任何书籍</p>
          <p className="text-sm text-gray-400 mt-1">上传您的第一本电子书开始阅读吧！</p>
        </div>
      )}
    </div>
  );
};

export default Upload;