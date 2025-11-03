const CACHE_NAME = 'vanconnect-cache-v1';
const DATA_CACHE_NAME = 'vanconnect-data-cache-v1';

// Add core app shell files to this list.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  // Dependencies from importmap
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/react-router-dom@^7.9.4',
  'https://aistudiocdn.com/lucide-react@^0.548.0',
  'https://aistudiocdn.com/@supabase/supabase-js@^2.76.1',
  '/vite.svg',
  'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/admin.jpg',
  'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/driver.png',
  'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/user.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache).catch(error => {
            console.error('Failed to cache one or more resources for the app shell:', error);
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls for data - Network first, then cache
  if (
    (url.hostname === 'gvhczqbwnvzbmmwnkuuc.supabase.co' && url.pathname.startsWith('/rest/v1/')) ||
    url.hostname === 'google-map-places-new-v2.p.rapidapi.com'
  ) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If network fails, try to serve from cache
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // For all other requests (app shell, fonts, images), use a Cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          fetchResponse => {
            // Check if we received a valid response before caching
            if (!fetchResponse || (fetchResponse.status !== 200 && fetchResponse.status !== 0)) {
              return fetchResponse;
            }

            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          }
        );
      })
  );
});
