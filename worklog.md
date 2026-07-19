---
Task ID: 1
Agent: main
Task: Fix Timeline crash, Go Pro visibility, and enhance free summary

Work Log:
- Read and analyzed all key files: page.tsx, timeline-view.tsx, dashboard-view.tsx, go-pro-view.tsx, progress-view.tsx, app-sidebar.tsx, app-header.tsx, store.ts, subscription.ts, types.ts, data-hooks.ts
- Created ErrorBoundary component (/src/components/error-boundary.tsx) to prevent whole-site crashes
- Wrapped ActiveView component in page.tsx with ErrorBoundary so any view error shows a retry card instead of crashing the whole app
- Fixed timeline-view.tsx: Added comprehensive try-catch wrapping, safe array checks (Array.isArray), optional chaining on data items, error state rendering
- Fixed dashboard-view.tsx: Replaced all unsafe parseISO() calls with try-catch, added safeParseDate/safeEventStatus helper functions, added try-catch to stats computation and upcoming/recent events
- Made Go Pro button more visible in app-header.tsx: Changed from outline variant to gradient amber button with text visible on all screen sizes (not hidden on mobile)
- Added Quick Summary card to dashboard-view.tsx: Shows basic stats (progress %, requirements, clean tests, NA steps), basic text summary, and for free users a blurred pro preview with upgrade CTA
- Added useSubscriptionStore and ProBadge imports to dashboard-view.tsx
- Lint check passes with no errors
- Dev server OOM issues prevent full browser testing (4GB system memory constraint)

Stage Summary:
- ErrorBoundary created and integrated - prevents whole-site crashes from any view error
- Timeline view crash-proofed with defensive coding
- Dashboard view crash-proofed with safe date parsing
- Go Pro button now gradient amber, visible on all screen sizes
- Quick Summary card on dashboard shows free basic summary + pro upgrade prompt
- All changes are lint-clean
