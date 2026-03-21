// public/sw.js — Service Worker for offline support
// Caches the app shell so it loads without internet

const CACHE_NAME = 'rabidvault-v1'

// Derive the base path from the service worker's own location.
// e.g. if SW is registered at /rabidvault/sw.js, BASE = '/rabidvault/'
// This makes the SW work under any deployment base path (root or sub-path).
const SW_PATH = self.location.pathname
const BASE    = SW_PATH.substring(0, SW_PATH.lastIndexOf('/') + 1)

const SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'logo.png',
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
        // Offline: serve from cache, fall back to index.html for SPA routing
        return caches.match(event.request)
          .then(cached => cached || caches.match(BASE + 'index.html'))
      })
  )
})
