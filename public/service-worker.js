const CACHE_NAME = "nosso-local-v10";
const STATIC_CACHE = "static-v10";
const DYNAMIC_CACHE = "dynamic-v10";

const STATIC_FILES = [
  "/",
  "/manifest.json",
  "/favicon/favicon.ico",
  "/favicon/favicon.svg",
  "/favicon/favicon-96x96.png",
  "/favicon/apple-touch-icon.png",
  "/favicon/web-app-manifest-192x192.png",
  "/favicon/web-app-manifest-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error("[SW] Error caching static assets:", error);
      }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API calls - always go to network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === "chrome-extension:") {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then((fetchResponse) => {
          // Don't cache responses that aren't successful
          if (
            !fetchResponse ||
            fetchResponse.status !== 200 ||
            fetchResponse.type === "error"
          ) {
            return fetchResponse;
          }

          // Clone the response
          const responseToCache = fetchResponse.clone();

          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return fetchResponse;
        })
        .catch((error) => {
          console.error("[SW] Fetch failed:", error);
          // Return a fallback page if available
          return caches.match("/offline.html");
        });
    }),
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
