// useOfflineCache.js
// Caches the collection in IndexedDB so the app loads even with no internet
// Uses the Cache API for assets and IndexedDB for data

const DB_NAME    = 'rabidvault-offline'
const DB_VERSION = 1
const STORE_NAME = 'collection-cache'

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

export async function saveToCache(key, data) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ key, data, savedAt: Date.now() })
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
    db.close()
  } catch (_) { /* IndexedDB unavailable - offline cache disabled */ }
}

export async function loadFromCache(key) {
  try {
    const db     = await openDB()
    const tx     = db.transaction(STORE_NAME, 'readonly')
    const result = await new Promise((res, rej) => {
      const req  = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = e => res(e.target.result)
      req.onerror   = e => rej(e.target.error)
    })
    db.close()
    return result?.data || null
  } catch { return null }
}

export async function clearCache() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    db.close()
  } catch (_) { /* IndexedDB unavailable - offline cache disabled */ }
}

// ── Service Worker registration for asset caching ────────────
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  }
}

// ── Network status hook ───────────────────────────────────────
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return isOnline
}
