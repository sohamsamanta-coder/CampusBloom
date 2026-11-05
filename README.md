# CampusBloom

A student productivity planner built with HTML, CSS and vanilla JavaScript. CampusBloom brings assignments, class schedules, attendance, semester grades, notes and study sessions into one browser-based dashboard.

Developed by: Soham Samanta & Gourab Goswami 
Repository: https://github.com/sohamsamanta-coder/CampusBloom

## About the project

College work is spread across different places: assignment deadlines in one app, class timings in another, attendance in a notebook and study sessions in a timer. CampusBloom puts these everyday tasks together so students can check what needs attention and keep their academic information organised from one place.

The project is intended for demonstration and personal use in a browser. It does not need a server, database, API key or build process.

## Features

### Dashboard and assignments

- Dashboard summary for overdue work, assignments due this week, completed assignments and focus activity.
- Add, edit, complete, reopen, search, filter, sort and delete assignments.
- Monthly calendar with due-date markers, month navigation and a shortcut to the current date.
- A view of today's tasks and upcoming deadlines.

### Focus Garden

- Pomodoro timer with 25-minute focus sessions, 5-minute short breaks and 15-minute long breaks.
- Start, pause, resume, reset and skip controls.
- Custom timer durations and an option to turn the completion sound on or off.
- A completion dialog and a bundled sound that plays when a focus session finishes.
- A plant with eight growth stages. Every three completed Pomodoro sessions advances it by one stage.
- The plant's condition changes after periods without a completed focus session: it begins to wither after 3–4 inactive days, becomes severely wilted after 5–6 days, and resets after 7 days. Completing a Pomodoro revives it. Focus history remains saved when the plant resets.

Breaks and skipped sessions do not count towards plant growth. Plant condition is checked when the dashboard is rendered; it is not updated by a background process while the browser is closed.

### Academic tools

- Editable weekly class timetable. Each class can include a subject, day, start and end time, room and colour.
- The timetable checks for overlapping class times on the same day.
- Overall attendance summary and a separate subject-wise attendance tracker.
- Record present or absent classes, edit or remove entries, and see how many consecutive classes are needed to reach a subject's attendance target.
- MAKAUT-based SGPA calculator using credit-weighted grade points.
- Academic analytics for YGPA and DGPA when the required semester results have been entered.

### Notes, reminders and analytics

- Create, edit, search and delete subject notes, with subject names and tags.
- Reminder view for overdue assignments, upcoming deadlines and today's classes.
- Optional browser notifications while the application is open and notification permission has been granted.
- Daily focus-time goal, a seven-day focus summary and a list of recent completed Pomodoro sessions.

### Backup and appearance

- Export the signed-in account's planner data as a JSON file and restore it later.
- Backup files do not include account credentials or other users' planner data.
- Light theme by default, with an optional dark theme.
- Responsive layout, keyboard-focus indicators, accessible labels and empty states.

## Getting started

CampusBloom runs in a modern web browser. No installation of JavaScript packages is required.

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open `index.html` using the Live Server extension.
4. Register a demo account, or sign in using an account already created in that browser.

Opening `index.html` directly in a browser may also work. Live Server is recommended during development.

There is no backend, database server, package manager, build step or API key to configure.

## Project structure

```text
CampusBloom/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── auth.js                  # Demo registration, login and logout
│   ├── app.js                   # Shared state, storage, navigation and refresh
│   ├── assignments.js           # Assignment management
│   ├── calendar.js              # Monthly calendar and due-date markers
│   ├── focus-timer.js           # Pomodoro timer and plant growth/health
│   ├── academic.js              # Timetable, SGPA and base attendance tools
│   ├── attendance-tracker.js    # Subject-wise attendance
│   ├── notes.js                 # Subject notes and search
│   ├── reminders.js             # Upcoming work and browser notifications
│   ├── analytics.js             # Academic and focus analytics
│   └── backup.js                # JSON export and restore
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

## How the JavaScript is organised

The scripts are split by feature so that each file has a focused responsibility.

- `auth.js` manages the demo account screens and login state.
- `app.js` provides shared application state, LocalStorage helpers, date utilities and dashboard initialisation.
- Feature files such as `assignments.js`, `calendar.js`, `notes.js` and `reminders.js` handle their respective screens and actions.
- `academic.js` contains the timetable and core academic calculations.
- `analytics.js` prepares the academic and focus summaries.
- `backup.js` handles exporting and restoring planner data.

The files share common helpers through the application's `DR` object. Planner storage keys are scoped to the signed-in demo account so that two accounts in the same browser have separate planner data.

## MAKAUT grade scale

The example grade mapping used by the SGPA calculator is based on the grade card supplied for this project.

| Letter grade | Grade points | Classification |
|---|---:|---|
| O | 10 | Outstanding |
| E | 9 | Excellent |
| A | 8 | Very Good |
| B | 7 | Good |
| C | 6 | Fair |
| D | 5 | Below Average |
| F | 2 | Failed |
| I | 2 | Incomplete |

SGPA is calculated using the following formula:

```text
SGPA = sum(credits × grade points) / sum(credits)
```

Semester 3 is pre-filled with example records from the supplied grade card. Those records produce an SGPA of 8.14 (171 credit points divided by 21 credits). Other semesters start empty. YGPA and the three-year DGPA calculation require the relevant semester results to be entered.

The mapping and example are for demonstrating the calculator. Check the current rules and your own result with MAKAUT or your college before using the figures for an official academic decision.

## Data storage

CampusBloom uses the browser's `localStorage` to save demo accounts, the active session and each account's planner data. The project keeps the older `deadlineRadar_` storage prefix internally so that users upgrading from the earlier Deadline Radar version in the same browser can retain their saved data.

This also means that data belongs to the browser profile where it was created. It is not automatically shared between browsers or devices.

## Limitations

- Demo authentication only: Account information and password hashes are stored in browser LocalStorage. This is not production-grade authentication. Do not use a real or reused password, or store sensitive personal or academic information in the demo.
- No cloud sync: Data stays in the current browser profile. It will not automatically appear on another device or in another browser.
- Browser storage can be changed or cleared: Anyone with access to the browser profile or developer tools may inspect or modify LocalStorage. Clearing site data can remove the saved accounts and planner data.
- No background reminder service: Browser notifications and reminder checks work while CampusBloom is open and permission has been granted.
- Plant health is local: The plant's inactive-day rules are checked when the dashboard renders. There is no background timer running after the browser is closed.
- Academic examples need verification: Semester 3 contains sample grade-card data; other semesters must be entered. Confirm all official grade calculations with your college.
- Sample timetable: The initial timetable entries are examples and should be edited to match your actual class schedule.

A production version would need a backend, secure server-side authentication, a database and a proper notification service.

## Testing checklist

Use this checklist when trying the main features after making changes:

1. Register two demo accounts and check that their assignments and timetable entries remain separate.
2. Add an assignment, refresh the page and confirm that it is still saved.
3. Edit the timetable, add a class and try creating an overlapping class time.
4. Complete and reopen an assignment. Check whether the dashboard and calendar update.
5. Move between months and select dates with and without tasks.
6. Start, pause, resume and reset the focus timer. Try a shorter custom duration for testing.
7. Complete a Pomodoro and check the focus summary and plant growth. Confirm that resetting or skipping a session does not increase plant progress.
8. Check that the example Semester 3 result displays an SGPA of 8.14.
9. Add and remove subject attendance records and test the target-attendance advice.
10. Create, edit, search and delete notes.
11. Check reminders using assignments due today and overdue assignments.
12. Export a backup and test restoring it.
13. Change the theme, refresh the page and test the layout at a narrow screen width.
14. Check the browser console for errors.

---

CampusBloom is a frontend college project built to bring common student planning and academic tools together in one place.
