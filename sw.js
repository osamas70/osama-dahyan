/* ============================================================
   Osama Dahyan — Service Worker (full offline, no build step)
   Strategies (same as requested Workbox setup):
   - Pages / navigations .... NetworkFirst -> cache -> offline.html
   - CSS / JS / JSON ........ StaleWhileRevalidate
   - Images / icons ......... CacheFirst
   - Google Fonts (cross) ... StaleWhileRevalidate
   - Login / OAuth / WhatsApp links are NEVER intercepted.
   Bump SW_VERSION to force a fresh precache on deploy.
   ============================================================ */
const SW_VERSION = 'osama-v2';
const STATIC_CACHE = 'static-' + SW_VERSION;
const PAGES_CACHE = 'pages-' + SW_VERSION;
const IMAGES_CACHE = 'images-' + SW_VERSION;
const FONTS_CACHE = 'fonts-' + SW_VERSION;
const OFFLINE_URL = 'offline.html';

const PRECACHE_URLS = [
  'index.html',
  './',
  'about.html',
  'ai.html',
  'article.html',
  'blog.html',
  'contact.html',
  'impact.html',
  'knowledge.html',
  'library.html',
  'privacy.html',
  'project.html',
  'projects.html',
  'quiz.html',
  'services.html',
  'terms.html',
  OFFLINE_URL,
  'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/config.js',
  'assets/js/main.js',
  'assets/js/pwa.js',
  'data/content.json',
  'assets/img/osama.jpg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/maskable-512.png',
  'assets/icons/apple-touch-icon-180.png'
];

// Never intercept: auth flows, WhatsApp links, non-HTTP(s).
const PATH_DENY = /\/(login|signin|signup|register|auth|oauth|callback|authorize|token)/i;
const HOST_DENY = /(^|\.)(wa\.me|api\.whatsapp\.com|whatsapp\.com|accounts\.google\.com|facebook\.com|instagram\.com|x\.com)$/i;
const FONT_HOSTS = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [STATIC_CACHE, PAGES_CACHE, IMAGES_CACHE, FONTS_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => keep.indexOf(k) === -1).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function cacheable(res) {
  return !!res && (res.ok || res.type === 'opaque');
}

// Network first: fresh pages when online, cached copy when offline.
function networkFirst(req, cacheName, fallbackURL) {
  return caches.open(cacheName).then((cache) =>
    fetch(req).then((res) => {
      if (cacheable(res)) cache.put(req, res.clone());
      return res;
    }).catch(() =>
      cache.match(req).then((hit) => {
        if (hit) return hit;
        if (fallbackURL) return caches.match(fallbackURL, { cacheName: STATIC_CACHE });
        throw new Error('offline-miss');
      })
    )
  );
}

// Stale-while-revalidate: instant response, silent update in background.
function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (cacheable(res)) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
}

// Cache first: immutable-ish bytes (images, icons).
function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        if (cacheable(res)) cache.put(req, res.clone());
        return res;
      })
    )
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (HOST_DENY.test(url.hostname)) return;          // WhatsApp / social / OAuth hosts
  if (PATH_DENY.test(url.pathname)) return;          // login & oauth & callback paths

  const sameOrigin = url.origin === self.location.origin;
  const isNav = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  // 1) Pages -> NetworkFirst with offline fallback.
  if (isNav) {
    event.respondWith(networkFirst(req, PAGES_CACHE, OFFLINE_URL));
    return;
  }

  // 2) Cross-origin: only Google Fonts is cached; everything else passes through.
  if (!sameOrigin) {
    if (FONT_HOSTS.test(url.hostname)) event.respondWith(staleWhileRevalidate(req, FONTS_CACHE));
    return;
  }

  // 3) Same-origin assets.
  if (/\.(png|jpe?g|svg|webp|gif|ico|avif)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, IMAGES_CACHE));           // CacheFirst
  } else if (/\.(css|js|json|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE)); // SWR
  } else {
    event.respondWith(networkFirst(req, PAGES_CACHE, OFFLINE_URL));
  }
});
