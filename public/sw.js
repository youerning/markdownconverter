// Service Worker for Markdown Converter PWA
// 提供离线功能和缓存策略

const CACHE_NAME = 'markdown-converter-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/help.html',
  '/about.html',
  '/manifest.json',
  '/favicon.svg',
  '/screenshot.svg',
  '/screenshot.png'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('Service Worker: 正在安装...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: 安装完成');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: 安装失败', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker: 正在激活...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: 删除旧缓存', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: 激活完成');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // 如果有缓存，直接返回
        if (cachedResponse) {
          console.log('Service Worker: 从缓存返回', request.url);
          return cachedResponse;
        }
        
        // 否则发起网络请求
        return fetch(request)
          .then(response => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应用于缓存
            const responseToCache = response.clone();
            
            // 缓存动态资源
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                console.log('Service Worker: 缓存动态资源', request.url);
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(err => {
            console.error('Service Worker: 网络请求失败', err);
            
            // 如果是HTML请求且网络失败，返回离线页面
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            throw err;
          });
      })
  );
});

// 处理消息事件
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: 收到跳过等待消息');
    self.skipWaiting();
  }
});

// 推送通知事件（可选）
self.addEventListener('push', event => {
  console.log('Service Worker: 收到推送消息', event);
  
  const options = {
    body: event.data ? event.data.text() : '新的更新可用',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看更新',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/favicon.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Markdown Converter', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: 通知被点击', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});