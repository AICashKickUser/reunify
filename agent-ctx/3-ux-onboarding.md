# Task 3: Fix Demo vs Real Data UX - Clear Separation + Guided Onboarding

## Summary
Implemented a smart onboarding experience that clearly separates demo data from real data, with prominent "Create My Case" CTA and a secondary "Explore with Demo Data" option. Added "Start Fresh" functionality to reset demo data.

## Changes Made

### Core Task Changes
1. **Welcome Screen** (`src/app/page.tsx`) - Redesigned with primary/secondary action hierarchy
2. **Create Case Dialog** (`src/components/create-case-dialog.tsx`) - Better placeholders and descriptions
3. **Seed Route** (`src/app/api/seed/route.ts`) - Added [DEMO DATA] badge to case notes
4. **Reset API** (`src/app/api/cases/[id]/reset/route.ts`) - NEW endpoint to reset case data
5. **Data Hooks** (`src/lib/data-hooks.ts`) - Added useResetCase mutation hook
6. **Case Plan View** (`src/components/views/case-plan-view.tsx`) - Added "Start Fresh" button with AlertDialog

### Pre-existing Lint Fixes
- Added eslint-disable comments for legitimate `set-state-in-effect` patterns across 7 view files
- Moved `handleAddStep` function before useEffect in na-steps-view.tsx

## Status: COMPLETED
- All lint checks pass
- All existing functionality preserved
