const CACHE_NAME = 'lifestyle-creep-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

const DEEP_DIVE_CACHE = 'deep-dive-cache-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DEEP_DIVE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache deep dive data for offline access
  if (url.pathname === '/api/daily-drop') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DEEP_DIVE_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // For other API requests, try network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For static assets, try cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (request.destination === 'script' || 
            request.destination === 'style' || 
            request.destination === 'image' ||
            request.destination === 'font')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let body = 'Your daily drop is ready!';
  let title = 'Lifestyle Creep';
  let pushData = {};

  if (event.data) {
    try {
      const data = event.data.json();
      body = data.body || body;
      title = data.title || title;
      pushData = data.data || {};
    } catch (e) {
      // If JSON parse fails, use text
      body = event.data.text() || body;
    }
  }

  // Determine notification URL based on push data type
  let url = '/';
  let actions = [
    { action: 'play', title: 'Play Now' },
    { action: 'later', title: 'Later' }
  ];

  if (pushData.type === 'coop_invite' && pushData.code) {
    url = '/coop-lobby?join=' + pushData.code;
    actions = [
      { action: 'join', title: 'Join Game' },
      { action: 'later', title: 'Later' }
    ];
  }

  if (pushData.type === 'survival_invite' && pushData.matchId) {
    url = '/survival/lobby/' + pushData.matchId;
    actions = [
      { action: 'join', title: 'Join Game' },
      { action: 'later', title: 'Later' }
    ];
  }

  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url,
      ...pushData
    },
    actions
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'later') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus an existing window and navigate it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
