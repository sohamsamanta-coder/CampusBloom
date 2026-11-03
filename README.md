# CampusBloom — Student Productivity Planner

CampusBloom is a responsive student productivity dashboard built with **HTML5, CSS3 and vanilla JavaScript**. It brings assignment planning, a monthly workload calendar, a browser-editable class timetable, attendance tracking, a MAKAUT-based SGPA calculator, subject-wise attendance, subject notes, reminders, academic analytics and a Pomodoro Focus Garden together in one light-themed interface.

The project is designed for a college submission and includes short comments in the source code to explain the main pieces of application logic.

## Run the project

1. Extract the `CampusBloom` folder.
2. Open that folder in VS Code.
3. Open `index.html` with the Live Server extension. Opening it directly in a browser may also work, but Live Server is recommended.
4. Register a demo account, or log in to an account already saved in that browser.

There is no backend, database server, package manager, build step or API key to configure. The application uses ordinary browser JavaScript and local SVG assets.

## Features

- **Login, registration and logout:** Each locally registered demo account has its own planner state and display name.
- **Dashboard:** Current date, due-this-week and overdue totals, completed assignments, focus streak, weekly progress and today's due tasks.
- **Assignment manager:** Create, edit, complete/reopen, filter, search, sort and delete assignments. Required fields are validated and deletion requires confirmation.
- **Calendar & workload:** Month navigation, Today shortcut, priority markers and filtering by selected date.
- **Focus Garden:** Pomodoro (25 minutes), short break (5 minutes) and long break (15 minutes), with start/pause/resume/reset/skip controls, per-account custom durations, a completion celebration dialog and an included gentle MP3 chime. The sound can be switched off in Settings.
- **Focus Garden plant health:** Eight detailed botanical SVG illustrations show growth from Seedling through Evergreen. Every three completed Pomodoro sessions advances the plant one level. After 3–4 inactive calendar days it withers, after 5–6 days it becomes severely wilted, and after 7 days it rots and resets its growth. Completing a Pomodoro revives it. Focus history is kept even if the plant resets. Skipped sessions and breaks do not count as care. The campus banner and plant artwork are local SVGs, so the project does not depend on remote image URLs.
- **Editable class timetable:** Add, edit and delete classes in the browser. Each entry stores its subject, day, start and end time, room and accent colour. Time overlaps on the same day are rejected. Changes persist for each account.
- **Attendance tools:** The dashboard shows combined attendance. The Subject-wise Attendance page tracks each subject separately, records present/absent classes, supports add/edit/delete and calculates how many consecutive classes are needed to reach each subject target.
- **MAKAUT SGPA and analytics:** Stores letter grades by semester and calculates credit-weighted SGPA. Semester 3 starts with the example records from the provided MAKAUT provisional grade card and calculates to **8.14** (171 credit points / 21 credits). Academic Analytics calculates YGPA from the odd/even semester credit weights and the three-year DGPA using the formula on the supplied grade card, once all six semester results are entered.
- **Subject Notes:** Create, edit, search and delete personal notes with subject names and tags.
- **Reminders:** See overdue assignments, upcoming deadlines and today’s classes. Optional browser notifications work while the app is open and permission is granted. A completed Pomodoro also shows a celebration message and plays the included local chime when sound is enabled.
- **Focus analytics:** Set a daily study-time goal, see the last seven days of focus time and review recent completed Pomodoro sessions.
- **Backup and restore:** Export the signed-in account’s planner data to JSON and import it in another browser. Account credentials and other users’ data are excluded.
- **Appearance and usability:** Light theme by default, optional dark theme, responsive layout, visible keyboard focus, empty states and accessible labels.
- **Browser storage:** User profiles and planner data are saved to LocalStorage. Planner data is scoped by the current demo account.

## MAKAUT grade scale used in the example

| Letter grade | Grade points | Classification shown on the provided card |
|---|---:|---|
| O | 10 | Outstanding |
| E | 9 | Excellent |
| A | 8 | Very Good |
| B | 7 | Good |
| C | 6 | Fair |
| D | 5 | Below Average |
| F | 2 | Failed |
| I | 2 | Incomplete |

The semester result is calculated as:

`SGPA = sum(credits × grade points) / sum(credits)`

The mapping follows the user-provided grade card. For official academic decisions, confirm the applicable rules with MAKAUT or your college.

## Project structure

```text
CampusBloom/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── auth.js                  # Local demo login, registration and logout
│   ├── app.js                   # Shared state, storage, navigation and refresh
│   ├── assignments.js           # Assignment create/edit/complete/delete
│   ├── calendar.js              # Monthly calendar and due-date markers
│   ├── focus-timer.js           # Pomodoro, plant growth and plant decay
│   ├── academic.js              # Timetable, MAKAUT SGPA and base attendance
│   ├── attendance-tracker.js    # Subject-wise attendance records
│   ├── notes.js                 # Subject notes and search
│   ├── reminders.js             # Upcoming work and browser alerts
│   ├── analytics.js             # SGPA/DGPA and focus analytics
│   └── backup.js                # Per-account JSON export and restore
└── assets/
    ├── logo.svg
    ├── campus-banner.svg
    ├── plant-small.svg
    ├── plant-growing.svg
    ├── plant-grown.svg
    ├── plant-stage-1.svg through plant-stage-8.svg
    ├── plant-withered.svg
    ├── plant-severely-wilted.svg
    ├── plant-rotten.svg
    └── sounds/
        └── focus-complete.mp3
```

## A few useful code notes

- `app.js` defines the shared state and the LocalStorage helper functions. It also sends first-time logins and registrations to the dashboard after all features have initialised. Other JavaScript files use those helpers so the same assignment and timetable data appears consistently throughout the app.
- `auth.js` handles the demo account screens. `app.js` scopes each user's planner keys to that user's ID.
- `academic.js` contains the timetable editor and the MAKAUT SGPA rules. In the timetable card, click **Edit** to add, update or delete classes without changing source code.
- `focus-timer.js` contains the Pomodoro countdown, local completion sound, completion dialog, eight growth stages and the plant health clock. The sound is an original gentle chime saved at `assets/sounds/focus-complete.mp3`. You can replace it with another appropriately licensed sound while keeping the same filename. Plant deterioration is checked when the dashboard renders; no background process runs while the browser is closed.
- `css/style.css` uses CSS custom properties near the top of the file. Change those values to adjust the main colour palette. The new focus completion dialog and botanical illustrations use the same sage-green and terracotta visual language.
- The internal LocalStorage prefix still uses `deadlineRadar_` intentionally so users updating an earlier Deadline Radar copy in the same browser can keep access to previously saved account and planner data. The visible product name is CampusBloom.

## Important limitations

- **Demo authentication only:** Account records and password hashes are held in browser LocalStorage. This is not production-grade security. Do not use a real or reused password or sensitive personal/academic information.
- **No cross-browser or cross-device sync:** Chrome, Brave and other browsers maintain separate LocalStorage. Clearing site data may permanently erase demo accounts and their planner data.
- **No cloud database:** Data stays in the current browser profile. A production release would need a backend, secure server-side authentication and a database.
- **LocalStorage is user-editable:** Anyone with access to the browser profile or developer tools can inspect or modify saved values.
- **SGPA/DGPA limitations:** Semester 3 is a sample based on the uploaded grade card; other semesters start empty. The three-year DGPA is shown only after six semester records are present. Verify official calculations with your college before using them for academic decisions.
- **Demo timetable:** Timetable entries are sample classes at first. Edit the timetable in the browser to match your schedule.
- **Reminders:** Browser notifications are not a background service; they are checked while CampusBloom is open.
- **Plant decay:** The 3/5/7-day plant decay rules are local demo rules, not a real-time service. The app checks elapsed calendar days on load/render and records the last completed Pomodoro date. A completed Pomodoro plays a bundled two-second chime when the sound toggle is on; the audio file can be replaced with another licensed sound using the same path.

## Suggested test checklist

1. Register two demo accounts and confirm each account has separate assignments and timetable entries.
2. Add an assignment, refresh, and check that it remains saved.
3. Edit the timetable, add a class, try an overlapping time, then edit/delete a class and refresh.
4. Mark an assignment complete and verify the dashboard and calendar update.
5. Navigate across month boundaries and select both a date with tasks and an empty date.
6. Start, pause, resume and reset the focus timer. For a quick test, use the Focus Garden settings to set a short Pomodoro duration.
7. Complete a Pomodoro and check that focus statistics and plant growth update. Resetting or skipping should not increase plant progress.
8. Confirm Semester 3 calculates to 8.14. Enter letter grades for another semester, refresh, and make sure each semester remains separate.
9. Try invalid attendance counts and invalid SGPA entries and verify that validation messages appear.
10. Add subjects to the attendance tracker, record Present and Absent, and test target advice.
11. Create, edit, search and delete notes.
12. Check reminders with due-today and overdue assignments; test browser notification permission if supported.
13. Set a daily focus goal and inspect the seven-day chart.
14. Test plant health by setting the `plantHealth` date in LocalStorage to 3, 5 and 7 days ago, then reload. Confirm the wilted SVG states and final reset.
15. Export a backup, test import in a second browser/account, and confirm credentials are not included.
16. Switch the theme, refresh, and test a narrow mobile viewport. Check the browser console for errors.
