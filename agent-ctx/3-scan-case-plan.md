# Task 3: Scan Case Plan Feature

## Agent: Main
## Task: Create the ScanCasePlan component for AI-powered case plan document scanning

## Work Log

### Phase 1: Camera/Capture UI
- Created hidden `<input type="file" accept="image/*" capture="environment">` for native rear camera on mobile
- Created hidden `<input type="file" accept="image/*" multiple>` for gallery upload
- Multi-page support: grid of page thumbnails with page numbers, remove buttons (hover), max 5 pages
- Big obvious camera/gallery buttons with emerald theme colors
- Image compression utility: auto-resize to max 1920px wide, JPEG quality 0.8
- Thumbnail generation utility: max 200px for display
- "Analyze Case Plan" button with page count

### Phase 2: Analyzing (Loading State)
- Animated spinner with ScanLine icon
- Progress messages: "Analyzing page 1 of N..." with interval updates
- Bouncing dots animation
- Error handling with toast notifications, returns to capture phase on failure

### Phase 3: Review/Edit Screen
- All extracted data organized by category in Cards with color-coded borders:
  - Case Info (emerald), Requirements (emerald), Counseling (emerald), Drug Testing (amber), NA Meetings (violet), Supervised Visits (sky), Parenting Classes (rose), Court Dates (slate), Milestones (emerald)
- Each section has a Switch toggle to include/exclude
- Each section has a ChevronDown/Up to expand/collapse
- All fields are editable (Input, Textarea, date inputs)
- Requirements, court dates, milestones support individual item removal
- Additional notes shown in amber callout box
- Summary bar at top with total items count and per-section badges

### Phase 4: Apply/Import
- Uses client-db functions directly (createItemByEndpoint, updateCase) since app uses IndexedDB
- Progress messages: "Updating case information...", "Creating requirements...", etc.
- Creates items for each section if toggle is on and data exists
- Frequency info packed into notes fields where applicable
- Error counting with partial success reporting
- Invalidates all queries after apply
- Calls onComplete callback and closes dialog
- Re-scan button to go back to capture phase

### Component Interface
```tsx
interface ScanCasePlanProps {
  isOpen: boolean
  onClose: () => void
  activeCaseId: string
  onComplete?: () => void
}
```

### UI/UX Details
- Dialog wrapper with responsive max-w-2xl
- Mobile-first design: full-width camera/gallery buttons, touch-friendly targets
- Emerald/green color scheme matching app theme
- All shadcn/ui components used: Dialog, Button, Card, Input, Label, Switch, Badge, Separator, Textarea
- Lucide icons: Camera, Upload, ScanLine, Check, X, ChevronDown, ChevronUp, Plus, Trash2, Loader2, Image
- Smooth phase transitions with clear loading states
- Scrollable review section with max-h-[50vh] overflow

### Technical Notes
- Images stored as base64 data URLs for API submission
- Auto-resize/compress images before sending (max 1920px wide, JPEG quality 0.8)
- File input onClick resets value to allow re-selecting same file
- All state managed internally by the component
- Graceful error handling throughout all phases
- Lint passes cleanly, no TypeScript errors

## Files Modified
- `/home/z/my-project/src/components/scan-case-plan.tsx` — Created (1807 lines)

## Files Read (for context)
- `/home/z/my-project/worklog.md` — Previous agent work
- `/home/z/my-project/src/lib/types.ts` — Type definitions
- `/home/z/my-project/src/lib/data-hooks.ts` — Data hooks pattern
- `/home/z/my-project/src/lib/client-db.ts` — IndexedDB layer and endpoint mapping
- `/home/z/my-project/src/lib/store.ts` — App store
- `/home/z/my-project/src/app/api/scan-case-plan/route.ts` — API route for VLM analysis
- `/home/z/my-project/src/components/create-case-dialog.tsx` — Style reference
- `/home/z/my-project/src/components/ui/dialog.tsx` — Dialog component
- `/home/z/my-project/src/components/ui/switch.tsx` — Switch component
- `/home/z/my-project/src/components/ui/badge.tsx` — Badge component
