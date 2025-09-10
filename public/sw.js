// Service Worker for Markdown Converter PWA

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

// install event
self.addEventListener('install', event => {
  console.log('Service Worker: installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: cache static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: installation completed');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: installation failed', err);
      })
  );
});

// activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: delete old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: activation completed');
        return self.clients.claim();
      })
  );
});

// fetch event
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
        // return directly if the resource is cached
        if (cachedResponse) {
          console.log('Service Worker: return cached resource', request.url);
          return cachedResponse;
        }
        
        // new request
        return fetch(request)
          .then(response => {
            // check response status
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 
            const responseToCache = response.clone();
            
            // cache dynamic resource
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                console.log('Service Worker: cache dynamic resource', request.url);
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(err => {
            console.error('Service Worker: network request failed', err);
            
            // 如果是HTML请求且网络失败，返回离线页面
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            throw err;
          });
      })
  );
});

// message event
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: received skip waiting message');
    self.skipWaiting();
  }
});

// push event (optional)
self.addEventListener('push', event => {
  console.log('Service Worker: push message received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
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
  console.log('Service Worker: notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});