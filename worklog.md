---
Task ID: 1
Agent: main
Task: Fix all outstanding Reunify bugs from previous session

Work Log:
- Fixed Pro page mobile overflow: Added max-height constraint with `max-h-[calc(100vh-8rem)]`, `overflow-y-auto`, and sticky back button at top of both Pro member view and upgrade view
- Fixed Pro page navigation trap: Added sticky "Back to Dashboard" button that's always visible, even when scrolled
- Fixed Timeline crash on mobile: Default to list view on mobile (width < 768), removed unused imports, added proper containment with `overflow-y-auto max-h-[calc(100vh-8rem)]`
- Fixed Re-check Configuration button: Removed stale closure dependency by using empty dependency array for useCallback
- Made dashboard clickable: Added onClick handlers to stat cards (already had them), upcoming events, recent activity items, and summary stat boxes - all navigate to their corresponding views
- Added eventTypeToView mapping function to convert event types to ViewType for navigation
- Enhanced admin bypass: Activation code section already existed (code: "reunify-owner-2024"), improved visibility with better styling and helper text
- Added dark mode support to CATEGORY_COLORS in types.ts
- Fixed main content area overflow in page.tsx with `overflow-hidden` on main and `overflow-y-auto` on content div
- Browser verification passed: all views load correctly, navigation works, no console errors, responsive layout works at mobile width

Stage Summary:
- All 5 bugs/features addressed and verified
- Pro page: constrained height, scrollable, always-visible back button
- Timeline: defaults to list on mobile, proper containment
- Dashboard: all cards/events are clickable and navigate to correct views
- Admin bypass: activation code "reunify-owner-2024" grants Pro access
- Clean lint, no errors, all API endpoints returning 200
