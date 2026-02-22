# UIU Course Planner

A visual weekly routine builder for United International University (UIU) students. Search courses, detect time conflicts, and build your semester schedule on an interactive calendar grid.

---

## Features

- **Course Search** — Search by course code or name, expand to see all available sections with their schedule and faculty
- **Drag-free Scheduling** — Click a section to add it instantly to the weekly grid
- **Conflict Detection** — Automatically blocks any section that overlaps with an already-added course
- **Primary & Backup Sections** — Add multiple sections of the same course; the first is _Primary_, the rest are _Backups_
  - **Same day, same time** → Backup cards appear in a click-to-expand dropdown under the primary card
  - **Same day, different time** → Backup cards appear side-by-side in separate lane columns
  - **Different day** → Backup cards render as standalone cards with a dashed "Backup" style
- **Lane Layout** — Multiple courses at the same time on the same day are automatically split into side-by-side sub-columns (no overlapping cards)
- **Toast Notifications** — Success, warning, and conflict alerts with auto-dismiss
- **Clear Routine** — One-click reset of the entire schedule

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS (glassmorphism dark theme) |
| Icons | Lucide React |
| CSV Parsing | PapaParse |
| Font | Inter (Google Fonts) |

---

## Project Structure

```
src/
├── components/
│   ├── CalendarGrid.jsx     # Weekly grid with lane layout & dropdown stacks
│   ├── CourseCard.jsx       # Individual course card (primary & backup styles)
│   ├── CourseCardStack.jsx  # Primary card with click-to-expand backup dropdown
│   ├── CourseSearch.jsx     # Searchable course list with section expansion
│   └── Toast.jsx            # Notification toasts
├── hooks/
│   └── useRoutine.js        # State: add/remove courses, conflict detection, roles
└── utils/
    └── parser.js            # CSV parse, schedule string parser, room normalizer

public/
└── CSE_Courses.csv          # Schedule data (UIU CSE department)
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

---

## CSV Data Format

The app reads from `public/CSE_Courses.csv`. Expected columns:

| Column | Example |
|---|---|
| `Course Code` | `CSE 1111` |
| `Course Name` | `Structured Programming Language` |
| `Section` | `A` |
| `Faculty` | `Dr. John Doe` |
| `Schedule` | `Sat 08:30-09:50 \| Tue 08:30-09:50 \| 304` |
| `Room` | `304` or `727 - Computer Lab` |

The `Schedule` field is parsed to extract days, times, and room number. Lab rooms like `727 - Computer Lab` are normalized to `727 (Lab)`.

To switch datasets, update the CSV path in `src/App.jsx`:

```js
loadCourseData('/YourFile.csv')
```

---

## How Conflict Detection Works

Two sections conflict if they share the same day **and** their time intervals overlap using the standard interval overlap condition:

```
start_A < end_B  AND  start_B < end_A
```

Backup sections of the **same course** are exempt from cross-section conflict checks (since you'd only attend one).