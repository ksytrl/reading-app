// Reading App Service Worker
// 版本号，用于更新缓存
const CACHE_VERSION = 'reading-app-v1.0.0';
const STATIC_CACHE_NAME = `reading-app-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `reading-app-api-${CACHE_VERSION}`;
const BOOK_CONTENT_CACHE_NAME = `reading-app-books-${CACHE_VERSION}`;
const READING_PROGRESS_CACHE_NAME = `reading-app-progress-${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API端点配置
const API_BASE = 'http://localhost:3001/api';
const CACHE_STRATEGIES = {
  // 缓存优先策略 - 适用于不经常变化的数据
  CACHE_FIRST: 'cache-first',
  // 网络优先策略 - 适用于经常变化的数据
  NETWORK_FIRST: 'network-first',
  // 仅缓存策略 - 适用于离线专用数据
  CACHE_ONLY: 'cache-only',
  // 仅网络策略 - 适用于实时数据
  NETWORK_ONLY: 'network-only'
};

// 📱 Service Worker安装事件
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker 安装中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('💾 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker 安装完成');
        // 强制激活新的Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker 安装失败:', error);
      })
  );
});

// 🔄 Service Worker激活事件
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker 激活中...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      cleanOldCaches(),
      // 立即控制所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker 激活完成');
    })
  );
});

// 🌐 网络请求拦截
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // 只处理HTTP/HTTPS请求
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // 根据请求类型选择缓存策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleNavigation(request));
  }
});

// 📨 处理后台消息
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_BOOK_CONTENT':
      handleCacheBookContent(payload);
      break;
    case 'CACHE_READING_PROGRESS':
      handleCacheReadingProgress(payload);
      break;
    case 'SYNC_READING_PROGRESS':
      handleSyncReadingProgress();
      break;
    case 'CLEAR_CACHE':
      handleClearCache(payload?.cacheType);
      break;
    case 'GET_CACHE_SIZE':
      handleGetCacheSize();
      break;
    default:
      console.log('🔔 未知消息类型:', type);
  }
});

// 🔄 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('🔄 后台同步事件:', event.tag);
  
  if (event.tag === 'sync-reading-progress') {
    event.waitUntil(syncReadingProgress());
  } else if (event.tag === 'sync-bookshelf') {
    event.waitUntil(syncBookshelfData());
  }
});

// 🔔 推送通知事件
self.addEventListener('push', (event) => {
  console.log('🔔 收到推送消息');
  
  const options = {
    body: '您有新的章节更新！',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'book-update',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '查看更新'
      },
      {
        action: 'dismiss',
        title: '稍后提醒'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = data;
  }
  
  event.waitUntil(
    self.registration.showNotification('阅读App', options)
  );
});

// 🎯 处理API请求
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // 🔍 根据API类型选择策略
    if (path.includes('/books') && request.method === 'GET') {
      // 书籍列表和详情 - 网络优先，缓存备用
      return await networkFirstWithCache(request, API_CACHE_NAME);
    } else if (path.includes('/chapters') && request.method === 'GET') {
      // 章节内容 - 缓存优先（离线阅读核心）
      return await cacheFirstWithNetwork(request, BOOK_CONTENT_CACHE_NAME);
    } else if (path.includes('/users/bookshelf') && request.method === 'GET') {
      // 书架数据 - 网络优先
      return await networkFirstWithCache(request, API_CACHE_NAME);
    } else if (path.includes('/reading-records') && request.method === 'POST') {
      // 阅读进度 - 离线时存储，在线时同步
      return await handleReadingProgressRequest(request);
    } else {
      // 其他API请求 - 仅网络
      return await fetch(request);
    }
  } catch (error) {
    console.error('❌ API请求处理失败:', error);
    
    // 如果是GET请求，尝试返回缓存
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('📱 返回离线缓存数据');
        return cachedResponse;
      }
    }
    
    // 返回离线页面或错误响应
    return new Response(
      JSON.stringify({ 
        error: '网络连接失败，请检查网络设置',
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 🏠 处理静态资源
async function handleStaticAsset(request) {
  return await cacheFirstWithNetwork(request, STATIC_CACHE_NAME);
}

// 🧭 处理页面导航
async function handleNavigation(request) {
  try {
    // 尝试网络请求
    const response = await fetch(request);
    
    // 缓存成功的导航请求
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🔄 网络失败，返回离线页面');
    
    // 返回缓存的页面或离线页面
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回简单的离线页面
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>阅读App - 离线模式</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; text-align: center; padding: 2rem; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <h1>📚 阅读App</h1>
          <p class="offline">🔌 当前处于离线模式</p>
          <p>请检查网络连接后重试</p>
          <button onclick="location.reload()">🔄 重试</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// 📖 缓存优先策略（适用于书籍内容）
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('💾 返回缓存内容:', request.url);
    
    // 后台更新缓存
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // 忽略后台更新失败
    });
    
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// 🌐 网络优先策略（适用于动态数据）
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🔄 网络失败，尝试缓存:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 📊 处理阅读进度请求
async function handleReadingProgressRequest(request) {
  try {
    // 尝试网络请求
    const response = await fetch(request);
    return response;
  } catch (error) {
    // 网络失败时，存储到本地等待同步
    const body = await request.text();
    const progressData = JSON.parse(body);
    
    // 存储到本地缓存
    const cache = await caches.open(READING_PROGRESS_CACHE_NAME);
    const storageKey = `progress-${Date.now()}-${Math.random()}`;
    
    await cache.put(
      new Request(storageKey),
      new Response(JSON.stringify({
        ...progressData,
        timestamp: Date.now(),
        synced: false
      }))
    );
    
    // 注册后台同步
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('sync-reading-progress');
    }
    
    // 返回成功响应（虽然是离线存储）
    return new Response(
      JSON.stringify({ 
        message: '阅读记录已离线保存，将在网络恢复时同步',
        offline: true 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 🔄 同步阅读进度
async function syncReadingProgress() {
  console.log('🔄 开始同步离线阅读进度');
  
  const cache = await caches.open(READING_PROGRESS_CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await cache.match(request);
      const data = await response.json();
      
      if (!data.synced) {
        // 尝试同步到服务器
        const syncResponse = await fetch(`${API_BASE}/reading-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getStoredToken()}`
          },
          body: JSON.stringify({
            bookId: data.bookId,
            chapterId: data.chapterId,
            progressPercentage: data.progressPercentage,
            readingPosition: data.readingPosition
          })
        });
        
        if (syncResponse.ok) {
          // 同步成功，删除本地记录
          await cache.delete(request);
          console.log('✅ 阅读进度同步成功');
        }
      }
    } catch (error) {
      console.error('❌ 同步阅读进度失败:', error);
    }
  }
}

// 📚 处理书籍内容缓存
async function handleCacheBookContent(payload) {
  const { bookId, chapters } = payload;
  const cache = await caches.open(BOOK_CONTENT_CACHE_NAME);
  
  for (const chapter of chapters) {
    const url = `${API_BASE}/chapters/${chapter.id}`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
        console.log(`📖 章节缓存成功: ${chapter.title}`);
      }
    } catch (error) {
      console.error(`❌ 章节缓存失败: ${chapter.title}`, error);
    }
  }
  
  // 通知主线程缓存完成
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'BOOK_CACHED',
        payload: { bookId, success: true }
      });
    });
  });
}

// 🗑️ 清理旧版本缓存
async function cleanOldCaches() {
  console.log('🧹 清理旧版本缓存');
  
  const cacheNames = await caches.keys();
  const currentCaches = [
    STATIC_CACHE_NAME,
    API_CACHE_NAME,
    BOOK_CONTENT_CACHE_NAME,
    READING_PROGRESS_CACHE_NAME
  ];
  
  await Promise.all(
    cacheNames.map(cacheName => {
      if (!currentCaches.includes(cacheName)) {
        console.log(`🗑️ 删除旧缓存: ${cacheName}`);
        return caches.delete(cacheName);
      }
    })
  );
}

// 🔍 判断是否为静态资源
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// 🔑 获取存储的Token
async function getStoredToken() {
  // 从IndexedDB或localStorage获取token
  // 这里简化处理，实际应该从客户端传递
  return null;
}

// 📏 获取缓存大小
async function handleGetCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  // 通知主线程
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_SIZE',
        payload: { size: totalSize }
      });
    });
  });
}

console.log('📱 阅读App Service Worker 已加载');