const CACHE_NAME = 'language-app-v2'; // IMPORTANT: Change cache name

// The list of files our app needs to function offline
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/main.js',
    '/manifest.json',
    'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'
];

// Install event: open cache and add all essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching files');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to cache files during install:', err);
            })
    );
});

// Fetch event: serve from cache, but update in background
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Fetch from network in the background to update the cache
                const fetchPromise = fetch(event.request).then(
                    networkResponse => {
                        // If we get a valid response, update the cache
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    }
                ).catch(err => {
                    // Network fetch failed, but that's okay if we have a cached response.
                    // This catch block prevents the "Failed to fetch" error.
                    console.warn('Network request failed, but this is okay:', err);
                });

                // Return the cached response immediately if available, otherwise wait for the network
                return cachedResponse || fetchPromise;
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});