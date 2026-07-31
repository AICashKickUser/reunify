'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
        // Check for updates on load
        registration.update()

        // Listen for new service worker waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // New SW activated — the app will use updated cache on next load
              }
            })
          }
        })
      }).catch(() => {
        // Service worker registration failed silently
      })
    }
  }, [])

  return null
}
