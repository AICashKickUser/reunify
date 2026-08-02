# Task 4: Fix scan case plan and photo upload bugs

## Summary
Fixed 4 bugs related to scan case plan and photo upload:
1. Error 209 on tablet - API body size limit too small
2. Photo distortion on phone preview - EXIF orientation double-resize bug
3. "Unable to complete" message - related to above issues
4. Photo upload from device doesn't work - gallery/file picker issues

## Files Modified
- `next.config.ts` - Added body size limit config
- `src/components/scan-case-plan.tsx` - Fixed EXIF orientation bug, reduced payload size, improved file picker, added drag-and-drop
- `src/app/api/scan-case-plan/route.ts` - Added error handling for large payloads, maxDuration config
- `src/hooks/use-auto-backup.ts` - Fixed ReferenceError: isPro not defined
- `src/components/views/progress-view.tsx` - Fixed JSX comment syntax, missing Lock import

## Files Created
- `src/lib/subscription.ts` - Zustand store for subscription state
- `src/components/upgrade-dialog.tsx` - Pro upgrade dialog
- `src/components/views/go-pro-view.tsx` - Go Pro view

## Key Technical Details

### EXIF Orientation Fix
The old compressImage() had a bug where:
1. It swapped width/height for orientations 5-8
2. Set canvas to those dimensions
3. Called applyExifOrientation() which returned swapped dimensions
4. Resized the canvas (clearing the context transform)
5. Drew the image without the transform

The fix:
1. Keep original (non-swapped) dimensions for scaling
2. Set canvas to display dimensions (swapped for orientations 5-8)
3. Pass original dimensions to applyExifOrientation() for correct transform
4. Draw image with original dimensions
5. The transform maps it correctly onto the canvas

### Payload Size Reduction
- Max width: 1600px → 1200px
- Quality: 0.75 → 0.6
- This significantly reduces base64 data URL size

### File Picker Fix
- Changed accept from `image/*` to specific MIME types
- Added input value reset before triggering click()
- Added drag-and-drop zone as fallback
