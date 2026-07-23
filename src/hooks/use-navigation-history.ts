'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAppStore, type ViewType } from '@/lib/store'

const VALID_VIEWS: ViewType[] = [
  'dashboard', 'timeline', 'case-plan', 'counseling', 'drug-testing',
  'na-steps', 'na-meetings', 'supervised-visits', 'court-dates',
  'parenting-classes', 'daily-checkins', 'progress', 'backup', 'go-pro',
]

/**
 * Hook that syncs app view navigation with browser history.
 * 
 * This fixes two critical mobile/PWA issues:
 * 1. Android back button exits the app instead of navigating back
 * 2. Reopening the app gets stuck on the last viewed page
 * 
 * It pushes browser history entries when views change and listens
 * for popstate events (back button) to navigate within the app.
 * It also restores the view from the URL hash on page reload.
 */
export function useNavigationHistory() {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const goBack = useAppStore((s) => s.goBack)
  const initializedRef = useRef(false)
  const isPopStateRef = useRef(false)

  // Initialize: restore view from URL hash and set up history state
  // This runs once on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const hash = window.location.hash.replace('#', '')
    const restoredView = hash && VALID_VIEWS.includes(hash as ViewType) ? (hash as ViewType) : null

    if (restoredView) {
      setActiveView(restoredView)
    }

    // Set up the initial history state
    const currentView = restoredView || activeView
    window.history.replaceState(
      { view: currentView, timestamp: Date.now() },
      '',
      `#${currentView}`
    )
  }, [activeView, setActiveView])

  // Push history entries when view changes (not from popstate or initial load)
  useEffect(() => {
    if (!initializedRef.current || isPopStateRef.current) {
      isPopStateRef.current = false
      return
    }

    const currentState = window.history.state
    if (currentState?.view === activeView) {
      return
    }

    window.history.pushState(
      { view: activeView, timestamp: Date.now() },
      '',
      `#${activeView}`
    )
  }, [activeView])

  // Listen for back button (popstate event)
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      isPopStateRef.current = true

      if (event.state?.view && VALID_VIEWS.includes(event.state.view as ViewType)) {
        const targetView = event.state.view as ViewType
        goBack()
        setActiveView(targetView)
      } else {
        goBack()
        setActiveView('dashboard')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [goBack, setActiveView])
}
