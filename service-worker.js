/**
 * === BluePay Service Worker (v5.0) ===
 */

const CACHE_NAME = 'bluepay-v5.0';
const ASSETS = [
    '/',
    '/index.html',
    '/global.css',
    '/app.js',
    '/firebase-config.js',
    '/components.js',
    '/chart-utils.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Skip Firebase/APIs
    if (event.request.url.includes('googleapis') || event.request.url.includes('firebase')) return;

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(res => {
                return caches.open(CACHE_NAME).then(cache => {
                    if (event.request.url.includes(location.origin)) {
                        cache.put(event.request.url, res.clone());
                    }
                    return res;
                });
            });
        })
    );
});
