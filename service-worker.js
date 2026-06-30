/* BluePay Service Worker - PWA Offline Support */

const CACHE_NAME = 'bluepay-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/global.css',
    '/app.js',
    '/firebase-config.js',
    '/components.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});
