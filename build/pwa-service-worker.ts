const STATIC_PUBLIC_FILES = [
  '/manifest.webmanifest',
  '/icons/electrocms-192.png',
  '/icons/electrocms-512.png',
  '/icons/electrocms.svg',
] as const

function stableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function createServiceWorkerSource(bundleFiles: readonly string[]): string {
  const generatedFiles = bundleFiles
    .filter((file) => /\.(?:css|html|js)$/.test(file))
    .map((file) => `/${file.replace(/^\/+/, '')}`)
  const precacheUrls = [...new Set(['/', '/index.html', ...STATIC_PUBLIC_FILES, ...generatedFiles])].sort()
  const cacheName = `electrocms-shell-${stableHash(precacheUrls.join('|'))}`

  return `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith('electrocms-shell-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreVary: true }))
      ?? (await cache.match('/index.html', { ignoreVary: true }))
      ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request),
  );
});
`
}
