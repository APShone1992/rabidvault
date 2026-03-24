// Service Worker for offline support
const CACHE_NAME = 'rabidvault-v1'

// Derive base path from SW location so it works under any deployment path
const SW_PATH = self.location.pathname
const BASE    = SW_PATH.substring(0, SW_PATH.lastIndexOf('/') + 1)

const SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'logo.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
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
        return caches.match(event.request)
          .then(cached => cached || caches.match(BASE + 'index.html'))
      })
  )
})
