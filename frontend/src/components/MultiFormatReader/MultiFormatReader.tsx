// frontend/src/components/MultiFormatReader/MultiFormatReader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle
} from 'lucide-react';

// 🎯 文件格式类型定义
type FileFormat = 'txt' | 'epub' | 'pdf' | 'html' | 'markdown';

interface MultiFormatReaderProps {
  book: {
    id: number;
    title: string;
    author: string;
    originalFormat: FileFormat;
    formats?: Record<string, string>; // 格式到URL的映射
  };
  chapter?: {
    id: number;
    title: string;
    content: string;
    htmlContent?: string;
    markdownContent?: string;
  };
  onFormatChange?: (format: FileFormat) => void;
}

// 🎯 TXT格式阅读器
const TxtReader: React.FC<{ content: string; settings: any }> = ({ content, settings }) => {
  return (
    <div 
      className="prose max-w-none"
      style={{
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily,
        lineHeight: settings.lineHeight,
        color: settings.textColor,
        backgroundColor: settings.backgroundColor,
        padding: `${settings.margin}px`,
      }}
    >
      <pre className="whitespace-pre-wrap font-sans">
        {content}
      </pre>
    </div>
  );
};

// 🎯 HTML格式阅读器
const HtmlReader: React.FC<{ content: string; settings: any }> = ({ content, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 应用自定义样式到HTML内容
      const style = document.createElement('style');
      style.textContent = `
        .html-content {
          font-size: ${settings.fontSize}px !important;
          font-family: ${settings.fontFamily} !important;
          line-height: ${settings.lineHeight} !important;
          color: ${settings.textColor} !important;
          background-color: ${settings.backgroundColor} !important;
          padding: ${settings.margin}px !important;
        }
        .html-content * {
          max-width: 100% !important;
        }
        .html-content img {
          height: auto !important;
        }
      `;
      containerRef.current.appendChild(style);
    }
  }, [settings]);

  return (
    <div 
      ref={containerRef}
      className="html-content prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

// 🎯 EPUB阅读器（简化版本）
const EpubReader: React.FC<{ bookUrl: string; settings: any }> = ({ bookUrl, settings }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 这里应该集成EPUB.js库，但为了简化，我们显示下载选项
  return (
    <div className="text-center py-12">
      <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">EPUB格式阅读</h3>
      <p className="text-gray-600 mb-6">
        当前版本暂不支持在线EPUB阅读，请下载到本地使用专业阅读器查看
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href={bookUrl}
          download
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          下载EPUB文件
        </a>
        
        <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          <Eye className="w-5 h-5 mr-2" />
          在线预览（开发中）
        </button>
      </div>

      <div className="mt-8 text-left max-w-md mx-auto">
        <h4 className="font-medium text-gray-900 mb-3">推荐的EPUB阅读器：</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• PC/Mac: Adobe Digital Editions, Calibre</li>
          <li>• iOS: iBooks, KyBook</li>
          <li>• Android: Moon+ Reader, ReadEra</li>
          <li>• 在线: GitBook, Epub Reader Online</li>
        </ul>
      </div>
    </div>
  );
};

// 🎯 PDF阅读器
const PdfReader: React.FC<{ bookUrl: string; settings: any }> = ({ bookUrl, settings }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  // 这里应该集成PDF.js库，但为了简化，我们使用iframe或显示下载选项
  return (
    <div className="h-full flex flex-col">
      {/* PDF工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <a
            href={bookUrl}
            download
            className="p-2 text-gray-600 hover:text-gray-900"
            title="下载PDF"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* PDF内容区域 */}
      <div className="flex-1 overflow-auto">
        <iframe
          src={`${bookUrl}#page=${currentPage}&zoom=${zoom * 100}`}
          className="w-full h-full border-0"
          title="PDF阅读器"
          onLoad={() => setLoading(false)}
        />
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载PDF...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 主多格式阅读器组件
export const MultiFormatReader: React.FC<MultiFormatReaderProps> = ({
  book,
  chapter,
  onFormatChange
}) => {
  const [currentFormat, setCurrentFormat] = useState<FileFormat>(book.originalFormat);
  const [readerSettings, setReaderSettings] = useState({
    fontSize: 16,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1.6,
    textColor: '#333333',
    backgroundColor: '#ffffff',
    margin: 20,
  });
  const [showSettings, setShowSettings] = useState(false);

  // 获取可用的格式列表
  const availableFormats = React.useMemo(() => {
    const formats: { format: FileFormat; label: string; icon: React.ReactNode }[] = [
      { format: 'txt', label: 'TXT', icon: <FileText className="w-4 h-4" /> }
    ];

    if (book.formats) {
      if (book.formats.html) {
        formats.push({ format: 'html', label: 'HTML', icon: <FileText className="w-4 h-4" /> });
      }
      if (book.formats.epub) {
        formats.push({ format: 'epub', label: 'EPUB', icon: <BookOpen className="w-4 h-4" /> });
      }
      if (book.formats.pdf) {
        formats.push({ format: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" /> });
      }
    }

    return formats;
  }, [book.formats]);

  // 格式切换处理
  const handleFormatChange = (format: FileFormat) => {
    setCurrentFormat(format);
    onFormatChange?.(format);
  };

  // 渲染当前格式的阅读器
  const renderReader = () => {
    if (!chapter) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">未找到章节内容</p>
        </div>
      );
    }

    switch (currentFormat) {
      case 'txt':
        return <TxtReader content={chapter.content} settings={readerSettings} />;
      
      case 'html':
        return (
          <HtmlReader 
            content={chapter.htmlContent || chapter.content} 
            settings={readerSettings} 
          />
        );
      
      case 'epub':
        const epubUrl = book.formats?.epub;
        if (!epubUrl) {
          return (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">EPUB文件不可用</p>
            </div>
          );
        }
        return <EpubReader bookUrl={epubUrl} settings={readerSettings} />;
      
      case 'pdf':
        const pdfUrl = book.formats?.pdf;
        if (!pdfUrl) {
          return (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">PDF文件不可用</p>
            </div>
          );
        }
        return <PdfReader bookUrl={pdfUrl} settings={readerSettings} />;
      
      default:
        return <TxtReader content={chapter.content} settings={readerSettings} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 阅读器工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        {/* 格式选择器 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 mr-2">格式:</span>
          {availableFormats.map((format) => (
            <button
              key={format.format}
              onClick={() => handleFormatChange(format.format)}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${currentFormat === format.format
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {format.icon}
              <span className="ml-1">{format.label}</span>
            </button>
          ))}
        </div>

        {/* 阅读器设置 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="阅读设置"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                字体大小: {readerSettings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={readerSettings.fontSize}
                onChange={(e) => setReaderSettings({
                  ...readerSettings,
                  fontSize: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                行间距: {readerSettings.lineHeight}
              </label>
              <input
                type="range"
                min="1.2"
                max="2.0"
                step="0.1"
                value={readerSettings.lineHeight}
                onChange={(e) => setReaderSettings({
                  ...readerSettings,
                  lineHeight: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                页边距: {readerSettings.margin}px
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={readerSettings.margin}
                onChange={(e) => setReaderSettings({
                  ...readerSettings,
                  margin: parseInt(e.target.value)
                })}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={() => setReaderSettings({
                fontSize: 16,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1.6,
                textColor: '#333333',
                backgroundColor: '#ffffff',
                margin: 20,
              })}
              className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </button>
          </div>
        </div>
      )}

      {/* 阅读器内容区域 */}
      <div className="flex-1 overflow-auto">
        {renderReader()}
      </div>
    </div>
  );
};

// 🎯 格式转换器组件
interface FormatConverterProps {
  bookId: number;
  currentFormats: string[];
  onConversionComplete?: (newFormat: string, url: string) => void;
}

export const FormatConverter: React.FC<FormatConverterProps> = ({
  bookId,
  currentFormats,
  onConversionComplete
}) => {
  const [converting, setConverting] = useState<string | null>(null);

  const availableConversions = [
    { from: 'txt', to: 'html', label: 'TXT → HTML' },
    { from: 'txt', to: 'epub', label: 'TXT → EPUB' },
    { from: 'html', to: 'pdf', label: 'HTML → PDF' },
    { from: 'txt', to: 'pdf', label: 'TXT → PDF' }
  ];

  const handleConvert = async (targetFormat: string) => {
    setConverting(targetFormat);
    try {
      // 这里应该调用格式转换API
      await new Promise(resolve => setTimeout(resolve, 3000)); // 模拟转换过程
      
      const newUrl = `/uploads/converted_${bookId}.${targetFormat}`;
      onConversionComplete?.(targetFormat, newUrl);
    } catch (error: any) {
      console.error('格式转换失败:', error);
      alert('格式转换失败，请稍后重试');
    } finally {
      setConverting(null);
    }
  };

  const canConvert = (conversion: any) => {
    return currentFormats.includes(conversion.from) && !currentFormats.includes(conversion.to);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">格式转换</h3>
      
      <div className="space-y-3">
        {availableConversions.filter(canConvert).map((conversion) => (
          <div key={`${conversion.from}-${conversion.to}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <span className="font-medium">{conversion.label}</span>
              <p className="text-sm text-gray-500">将书籍转换为{conversion.to.toUpperCase()}格式</p>
            </div>
            
            <button
              onClick={() => handleConvert(conversion.to)}
              disabled={converting === conversion.to}
              className={`
                px-4 py-2 rounded-md font-medium transition-colors
                ${converting === conversion.to
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {converting === conversion.to ? '转换中...' : '转换'}
            </button>
          </div>
        ))}
        
        {availableConversions.filter(canConvert).length === 0 && (
          <p className="text-gray-500 text-center py-4">
            暂无可用的格式转换选项
          </p>
        )}
      </div>
    </div>
  );
};

export default {
  MultiFormatReader,
  FormatConverter
};