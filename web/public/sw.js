/*
 * 5Talents Magazine service worker - push notifications only.
 *
 * No caching, no offline shell, no precache manifest. This file exists
 * because a browser will not deliver a push without one, and that is all it
 * does. Anything added here runs on every page load for every reader, so the
 * bar for adding to it is high.
 *
 * Bump CACHE_FREE_VERSION to force an update when this file changes.
 */
const CACHE_FREE_VERSION = 1

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    return
  }
  if (!payload || !payload.title || !payload.url) return

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body || '',
      icon: '/favicon/web-app-manifest-192x192.png',
      badge: '/favicon/favicon-96x96.png',
      image: payload.image || undefined,
      // One notification per article, and a second delivery for the same
      // article replaces the first rather than stacking.
      tag: payload.slug || 'fivetalents',
      renotify: false,
      data: { url: payload.url, slug: payload.slug || '' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  if (!data.url) return

  // Tagged here rather than in the payload so the campaign is always the
  // article actually opened, and so GA4 attributes the visit to push rather
  // than to direct traffic, which is where an untagged click lands.
  let target = data.url
  try {
    const url = new URL(data.url)
    url.searchParams.set('utm_source', 'webpush')
    url.searchParams.set('utm_medium', 'push')
    if (data.slug) url.searchParams.set('utm_campaign', data.slug)
    target = url.toString()
  } catch {
    /* keep the plain URL */
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Reuse a tab already on the site instead of opening a third one for a
      // reader who keeps it open.
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus()
          return client.navigate ? client.navigate(target) : undefined
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
