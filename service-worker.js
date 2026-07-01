/**
 * === BluePay Service Worker (v1.2) ===
 * Implements Network-First strategy for financial data
 * and Cache-First strategy for static assets.
 */

const CACHE_NAME = 'bluepay-v1.2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/global.css',
    '/app.js',
    '/firebase-config.js',
    '/components.js',
    '/chart-utils.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Dynamic bypass: Never cache Auth/Firestore/Paystack calls
    if (url.origin.includes('googleapis') || url.origin.includes('firebase') || url.origin.includes('paystack')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    // Only cache internal static files
                    if (event.request.url.includes(location.origin)) {
                        cache.put(event.request.url, fetchRes.clone());
                    }
                    return fetchRes;
                });
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        })
    );
});
