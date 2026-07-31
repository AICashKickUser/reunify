---
Task ID: 1
Agent: Main
Task: Fix Reunify app - data not showing, case creation broken, backup restore broken

Work Log:
- Verified data exists in SQLite database (1 case with 17 requirements, 14 daily checkins, 13 drug tests, etc.)
- Identified root cause: `activeCaseId` in Zustand store was not persisted to localStorage, so every page reload showed the OnboardingWizard instead of the actual case data
- Fixed store.ts to persist `activeCaseId` to localStorage under key `reunify-active-case-id`
- Added `useAutoSelectCase()` hook in page.tsx that auto-selects the first case from the API when no activeCaseId is set
- Fixed backup export API (export/route.ts) to use correct field names matching API POST endpoints (e.g., `counselorName` instead of `counselor`, `sessionType` instead of `type`, `isCompleted` instead of `completed`)
- Fixed backup restore function (backup-view.tsx) to:
  - Use correct API endpoint names (e.g., `counseling` instead of `counseling-sessions`)
  - Create a new case from backup data if no activeCaseId exists
  - Include requirements in the restore process
  - Add error counting and partial success reporting
  - Invalidate React Query cache after restore
  - Added `useQueryClient` import for cache invalidation
- Updated ExportData interface with explicit field names for better type safety
- All lint checks pass, no TypeScript errors
- Verified with Agent Browser that the app loads correctly, shows dashboard with data, case plan view works, drug testing view works, backup view works

Stage Summary:
- App now auto-selects existing case on load (no more showing onboarding wizard when data exists)
- `activeCaseId` persists across page reloads via localStorage
- Backup export now uses field names that match API POST endpoints
- Backup restore now works even without an active case (creates one from backup data)
- All API endpoints verified to accept the correct field names from the export format
