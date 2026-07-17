# Task 3: New Case Creation Flow + Dashboard Quick Actions

## Summary
Implemented the Create New Case dialog on the Welcome screen and made Dashboard Quick Actions functional.

## Files Created
- `/src/components/create-case-dialog.tsx` - Full Create Case dialog with form and auto-requirements
- `/src/components/views/daily-checkins-view.tsx` - Daily Check-in view (needed for Check In Today navigation)

## Files Modified
- `/src/app/page.tsx` - Added Create New Case button + CreateCaseDialog import, useState
- `/src/components/views/dashboard-view.tsx` - Quick Action buttons now navigate via setActiveView

## Key Decisions
- Created CreateCaseDialog as a separate component file to minimize changes to shared page.tsx
- Used Calendar popover for date pickers (same pattern as case-plan-view.tsx)
- Auto-requirements checkbox is checked by default (10 common CPS requirements)
- Quick Actions navigate to views rather than opening dialogs (simpler, consistent UX)
- Created daily-checkins-view.tsx since it was referenced in store/page.tsx but file didn't exist yet

## Dependencies
- store.ts already had 'daily-checkins' ViewType (added by another agent)
- app-sidebar.tsx already had daily-checkins nav item (added by another agent)
- page.tsx already had DailyCheckinsView lazy import and VIEW_MAP entry (added by another agent)
