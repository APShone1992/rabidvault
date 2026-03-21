// public/sw.js — Service Worker for offline support
// Caches the app shell so it loads without internet

const CACHE_NAME = 'rabidvault-v1'
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
]

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: network first, fall back to cache
self.addEventListener('fetch', event => {
  // Only cache GET requests for our own origin
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  // Never cache Supabase API calls
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for the app shell
        if (response.ok && (
          event.request.url.includes('.js') ||
          event.request.url.includes('.css') ||
          event.request.url.includes('.png') ||
          event.request.url.includes('.html') ||
          event.request.url.endsWith('/')
        )) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/index.html'))
      })
  )
})
