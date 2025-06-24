// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// 暂时注释掉PWA插件，直到安装相关依赖
// import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 暂时注释掉PWA配置，直到安装vite-plugin-pwa依赖
    /*
    VitePWA({
      // 🔧 基础PWA配置
      registerType: 'autoUpdate',
      
      // 📱 Workbox配置 - Service Worker策略
      workbox: {
        // 🎯 缓存策略配置
        runtimeCaching: [
          // 📚 API请求 - 网络优先，缓存备用
          {
            urlPattern: /^http:\/\/localhost:3001\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
              backgroundSync: {
                name: 'api-background-sync',
                options: {
                  maxRetentionTime: 24 * 60, // 24小时
                },
              },
            },
          },
          
          // 📖 书籍内容 - 缓存优先（离线阅读）
          {
            urlPattern: /^http:\/\/localhost:3001\/api\/chapters\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'book-content-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          
          // 🖼️ 图片资源 - 缓存优先
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
              },
            },
          },
          
          // 🎨 字体和CSS - 缓存优先
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
              },
            },
          },
        ],
        
        // 🗂️ 预缓存配置
        globPatterns: [
          '**\/*.{js,css,html,ico,png,svg,jpg,jpeg}',
        ],
        
        // 🚫 排除不需要缓存的文件
        globIgnores: [
          '**\/node_modules\/**\/*',
          '**\/uploads\/**\/*',
          '**\/temp\/**\/*',
        ],
        
        // 📊 缓存大小限制
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        
        // 🔄 离线页面
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/uploads\//,
        ],
      },
      
      // 📋 PWA Manifest配置
      manifest: {
        name: '阅读App - 全栈在线阅读平台',
        short_name: '阅读App',
        description: '支持用户上传txt书籍的现代化在线阅读平台，提供优质的阅读体验，支持离线阅读',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'zh-CN',
        dir: 'ltr',
        
        // 📱 应用分类
        categories: ['books', 'education', 'entertainment', 'productivity'],
        
        // 🖼️ 图标配置
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        
        // 🚀 快捷方式
        shortcuts: [
          {
            name: '我的书架',
            short_name: '书架',
            description: '快速访问我的书架',
            url: '/bookshelf',
            icons: [
              {
                src: '/icons/bookshelf-shortcut.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: '上传书籍',
            short_name: '上传',
            description: '上传新的txt书籍',
            url: '/upload',
            icons: [
              {
                src: '/icons/upload-shortcut.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: '搜索书籍',
            short_name: '搜索',
            description: '搜索和发现书籍',
            url: '/search',
            icons: [
              {
                src: '/icons/search-shortcut.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          }
        ],
        
        // 📸 应用截图
        screenshots: [
          {
            src: '/screenshots/desktop-home.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: '阅读App首页 - 桌面版'
          },
          {
            src: '/screenshots/mobile-reader.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: '阅读器界面 - 移动版'
          }
        ],
        
        // 🔗 相关应用
        prefer_related_applications: false,
        related_applications: [],
        
        // 🎯 高级特性
        edge_side_panel: {
          preferred_width: 400
        },
        launch_handler: {
          client_mode: 'focus-existing'
        }
      },
      
      // 🔧 开发配置
      devOptions: {
        enabled: true, // 开发环境启用PWA
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: false,
      },
      
      // 📝 自定义Service Worker
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        swSrc: 'src/sw.ts',
        swDest: 'sw.js',
        injectionPoint: 'self.__WB_MANIFEST',
      },
    })
    */
  ],
  
  // 🔧 构建配置
  build: {
    // 📊 生成Source Map以便调试
    sourcemap: true,
    
    // 🗂️ 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios', 'zustand'],
        },
      },
    },
    
    // 📏 文件大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  
  // 📡 开发服务器配置
  server: {
    port: 5173,
    host: true,
    // 🔄 API代理
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  
  // 🎯 预览服务器配置
  preview: {
    port: 4173,
    host: true,
  },
});