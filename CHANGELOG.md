# Reunify Release Notes

## v1.13.0 — Communication Log & Document Vault (November 2025)

### 📝 New Feature: Communication Log
- **Track every contact** with your social worker, attorney, judge, CASA, visit supervisor, and family members
- Log calls, texts, emails, in-person conversations, voicemails, and letters
- Record direction (incoming/outgoing), contact name, role, subject, and detailed notes
- **Action items** with optional follow-up dates and completion tracking
- Dashboard stats: total logged, this month, pending follow-ups, and due-soon alerts
- Filter by contact type and role
- Fully integrated with backup/restore and cloud backup

### 📁 New Feature: Document Vault
- **Securely store documents** right on your phone — court orders, completion certificates, drug test results, service referrals, case plans, evaluations, and discharge summaries
- Take photos directly or upload existing files (images and PDFs)
- **Automatic image compression** to save storage space
- Thumbnail grid with document type badges and color coding
- Full-screen viewer for images, inline PDF preview
- Download documents anytime
- 8 document types with dedicated icons and colors
- Everything stays private on your device — never uploaded to any server

### 🔧 Maintenance & Dependency Updates
- Updated Next.js 16.1.3 → 16.4.6 (security + bug fixes)
- Updated React 19.2.3 → 19.3.1
- Updated all Radix UI components to latest minors
- Updated Stripe SDK and Prisma to latest patches
- Fixed declaration-order bug in scan-case-plan component
- Migrated `use-mobile` hook to `useSyncExternalStore` (modern React API)
- Cleaned up 7 lint errors from updated React hooks plugin
- All dependencies refreshed within current major versions (no breaking changes)

---

## v1.6.0 — Feedback-Driven Improvements (July 2025)

Based on closed testing feedback, we've made significant improvements to make Reunify more usable, reliable, and mobile-friendly on phones.

### 📱 Mobile UI Overhaul (Tester Feedback: "UI not good for mobile, overly large, scroll left and right, cluttered")

- **Compact dashboard**: Stat cards and event items are now smaller and denser on mobile, fitting more information without overwhelming the screen
- **No horizontal scrolling**: Fixed overflow issues that caused side-scrolling on phone screens — all views now stay within screen width
- **Responsive design**: Every view now adapts properly between phone and tablet sizes using mobile-first breakpoints
- **Smaller touch targets**: Checkboxes, buttons, and form elements sized appropriately for phone screens
- **Drug testing grid stacks vertically** on mobile instead of overflowing horizontally
- **NA meeting tracker** is now compact with smaller badges and reduced spacing on phones
- **Parenting class cards** have reduced padding on mobile for better readability

### 🗓️ Date Display Fix (Tester Feedback: "Items saved with today's date show as yesterday")

- **Fixed timezone bug**: Items you save with today's date now correctly show as today, not yesterday
- This affected counseling sessions, drug tests, NA meetings, supervised visits, court dates, parenting classes, daily check-ins, and case plan dates
- Root cause: date handling was using UTC timezone conversion that shifted dates by one day in certain time zones — now uses local date functions throughout

### 💾 Backup & Restore (New Feature — Tester Feedback: "Need to be able to save/export my progress")

- **JSON backup download**: Export all your case data as a JSON file for safekeeping
- **Email to caseworker**: Generate a formatted email with your progress data to send directly to your caseworker
- **Printable court report**: Generate a professional PDF-style report ready to present at court hearings
- **Restore from backup**: Import a previously saved backup file to restore your data
- Free users can preview the feature; Pro users have full access

### 📋 Parenting Classes 16-Week Redesign (Tester Feedback: "Parenting class checklist hard to track on mobile")

- Redesigned the 16-week parenting class tracker with compact cards
- Better week-by-week progress visualization
- Orientation week clearly marked
- Smaller checkboxes and tighter spacing on mobile

### 🙏 NA Meetings 3x/Week Tracker Redesign (Tester Feedback: "NA meeting tracker too cluttered")

- Redesigned the 3 meetings-per-week tracker with a cleaner layout
- Compact weekly progress badges
- Reduced spacing and smaller elements on phone screens
- Better visual distinction between attended, missed, and pending meetings

### 🔧 Other Improvements

- **Version number now visible** in app footer and sidebar for easier support requests
- **Timeline defaults to list view on mobile** for simpler browsing of events
- **All cards and events are now clickable** — tapping any dashboard stat, upcoming event, or activity item navigates to the relevant view
- **Pro page has proper scroll containment** — no more getting stuck at the bottom on mobile

---

## v1.5.0 — Core Feature Additions (June 2025)

- Added drug testing daily call grid
- Added NA 3x/week meeting tracker
- Added 12-step progress tracker
- Added parenting classes 16-week checklist
- Added supervised visits scheduler
- Added court dates tracker
- Added counseling session tracker
- Added daily check-in feature
- Added case plan management
- Added timeline view
- Added progress report
- Added Pro subscription with Stripe
- Added onboarding dialog

---

## v1.0.0 — Initial Release (May 2025)

- Basic PWA with dashboard and case management
- CPS reunification tracking concept
- Play Store TWA wrapper launched
