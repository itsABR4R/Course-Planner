# UIU Course Planner

A visual weekly routine builder and exam schedule planner for United International University (UIU) students. Search courses, detect time conflicts, select backup choices, and view combined class & exam schedules on an interactive dark-themed glassmorphism interface.

---

## Latest Features

- **Multi-Department Support** — Choose between 11 major UIU departments (including CSE, BBA, BA in English, BSDS, BSEEE, etc.) with automatic schedule catalogues loaded dynamically from CSV files.
- **Conflict & Backup Mode Switcher** — Toggle between:
  - **Backup Mode (Default)**: Allows adding overlapping sections. Clashing slots render side-by-side or stacked in dropdown menus.
  - **Conflict Mode**: Strictly prevents adding clashing sections and automatically drops overlapping courses when switched on. Comes with explanatory hover tooltips.
- **Weekly Schedule Calendar Grid** — Displays class locations, faculty names, and slots (`08:30` - `16:30`, Sat-Wed).
- **Exam Schedule Grid** — Displays midterm/final exam slots (T1: `09:00-11:00`, T2: `11:30-13:30`, T3: `14:00-16:00` across Days 1-7) below the weekly routine.
- **Double Exam Badges** — Displays `Day X / Slot Y` (e.g. `Day 3 / T3`) badges on both the Course Catalogue search items and the weekly schedule calendar cards simultaneously.
- **Exam Warning & Conflict Banners** — Warns users with distinct alerts and border highlights:
  - **Conflict Detected (Red Border)**: Triggers when multiple exams clash in the exact same day and slot.
  - **Warning (Yellow Border)**: Triggers when multiple exams occur on the same day but in different slots.
- **Duration-Based Row Spanning** — Identifies any course slot running for 110 minutes or longer (such as 150-minute lab sessions or 2.5-hour theory classes) and expands the card to span 2 rows if the slot below is free.
- **Mobile Optimizations** — Seamless mobile responsiveness featuring a navigation tab switcher for toggling between "Course Catalogue" and "Weekly Schedule" on iOS and smaller screen widths.
- **Save as Image** — Render and download your weekly calendar routine directly as a high-quality `.png` image with a single click.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS (Premium Glassmorphism Dark Theme) |
| Icons | Lucide React |
| CSV Parsing | PapaParse |
| Font | Outfit & Inter (Google Fonts) |
| Image Render | html-to-image |

---

## Project Structure

```
departments/          # Dynamic department exam schedule configurations (JSON)
public/               # Departmental CSV catalogues (e.g. CSE_Courses.csv)
src/
├── components/
│   ├── CalendarGrid.jsx     # Weekly grid with lane layout & dropdown stacks
│   ├── CourseCard.jsx       # Course card with time slots and exam badges
│   ├── CourseCardStack.jsx  # Primary card with backup dropdown stacks
│   ├── CourseSearch.jsx     # Search & advanced day/time filter panel
│   └── Toast.jsx            # Dynamic toast alerts
├── hooks/
│   └── useRoutine.js        # Routine hook with conflict checks
└── utils/
    └── parser.js            # PapaParse helper and string normalizers
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

---

## Acknowledgements

Special thanks to [Kawsar (kawsarcodes)](https://github.com/kawsarcodes) for providing the departments JSON folder and exam data configs, which helped massively in making the Exam Schedule feature possible.
