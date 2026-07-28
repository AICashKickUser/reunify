# Reunify Release Notes

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
