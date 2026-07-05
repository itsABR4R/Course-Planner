/**
 * src/components/CalendarGrid.jsx
 *
 * Weekly calendar schedule rendered as a 2D grid table (Sat–Wed).
 * Left column displays "Slot N" showing the slot name.
 * Rows are fixed to the 6 standard time slots to visualize break gaps between classes.
 * Day cells stack same-day same-start-time courses vertically.
 */
import React from 'react';
import CourseCard from './CourseCard';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const SLOT_ROWS = [
    { label: 'Slot 1', timeRange: '08:30–09:50' },
    { label: 'Slot 2', timeRange: '09:51–11:10' },
    { label: 'Slot 3', timeRange: '11:11–12:30' },
    { label: 'Slot 4', timeRange: '12:31–13:50' },
    { label: 'Slot 5', timeRange: '13:51–15:10' },
    { label: 'Slot 6', timeRange: '15:11–16:30' },
];

/**
 * Maps course starting time to row index (0 to 5).
 */
function getRowIndex(startMin) {
    if (startMin < 9 * 60 + 50) return 0;       // 08:30 starts (Slot 1)
    if (startMin < 11 * 60 + 10) return 1;      // 09:51 starts (Slot 2)
    if (startMin < 12 * 60 + 30) return 2;      // 11:11 starts (Slot 3)
    if (startMin < 13 * 60 + 50) return 3;      // 12:31 starts (Slot 4)
    if (startMin < 15 * 60 + 10) return 4;      // 13:51/14:00 starts (Slot 5)
    return 5;                                   // 15:11 starts (Slot 6)
}

export default function CalendarGrid({ routine, onRemoveCourse, getExamInfo }) {
    const numRows = SLOT_ROWS.length;

    return (
        <div className="w-full overflow-x-auto rounded-2xl border border-white/10 no-scrollbar glass">
            <div 
                id="weekly-schedule-grid"
                className="grid"
                style={{
                    gridTemplateColumns: '90px repeat(5, minmax(120px, 1fr))',
                    gridTemplateRows: `auto repeat(${numRows}, minmax(110px, auto))`,
                    minWidth: '700px',
                }}
            >
            {/* ── Column Header Row ── */}
            <div 
                className="py-3 px-2 text-center border-r border-b border-white/10 bg-white/5 font-semibold text-slate-400 text-xs uppercase tracking-wider" 
                style={{ gridRow: 1, gridColumn: 1 }}
            >
                Time
            </div>
            {DAYS.map((day, dayIndex) => (
                <div 
                    key={day} 
                    className="py-3 px-2 text-center border-b border-white/10 bg-white/5 font-semibold text-slate-300 text-xs uppercase tracking-wider"
                    style={{ 
                        gridRow: 1, 
                        gridColumn: dayIndex + 2,
                        borderRight: dayIndex === DAYS.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {day.slice(0, 3)}
                </div>
            ))}

            {/* ── Dynamic Rows based on Start Times ── */}
            {SLOT_ROWS.map((rowInfo, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                    {/* Left Slot Label Cell */}
                    <div 
                        className="p-3 flex flex-col justify-center items-center border-r border-b border-white/10 bg-white/[0.02] text-center animate-fade-in"
                        style={{ 
                            gridRow: rowIndex + 2, 
                            gridColumn: 1,
                            borderBottom: rowIndex === numRows - 1 ? 'none' : undefined
                        }}
                    >
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{rowInfo.label}</span>
                        <span className="text-xs font-bold text-slate-200 mt-1">{rowInfo.timeRange}</span>
                    </div>

                    {/* Day Schedule Cells */}
                    {DAYS.map((day, dayIndex) => {
                        // Gather sections for this day belonging to this row slot index
                        const cellItems = [];
                        for (const entry of routine) {
                            for (const slot of entry.slots.filter(s => s.day === day)) {
                                if (getRowIndex(slot.startMin) === rowIndex) {
                                    cellItems.push({ entry, slot });
                                }
                            }
                        }

                        // Sort by routine addition order to maintain choice priority visually
                        cellItems.sort((a, b) => routine.indexOf(a.entry) - routine.indexOf(b.entry));

                        // Check if this cell contains a long course (duration >= 110 minutes)
                        const isLongClass = cellItems.some(({ slot }) => (slot.endMin - slot.startMin) >= 110);

                        // Check if the slot directly below on this day is empty
                        let nextSlotEmpty = false;
                        if (isLongClass && rowIndex < numRows - 1) {
                            const nextSlotItems = [];
                            for (const entry of routine) {
                                for (const slot of entry.slots.filter(s => s.day === day)) {
                                    if (getRowIndex(slot.startMin) === rowIndex + 1) {
                                        nextSlotItems.push(entry);
                                    }
                                }
                            }
                            nextSlotEmpty = nextSlotItems.length === 0;
                        }

                        const rowSpan = nextSlotEmpty ? 2 : 1;

                        return (
                            <div 
                                key={`cell-${day}-${rowIndex}`}
                                className="p-3.5 flex flex-col gap-3 justify-start overflow-visible min-h-[110px]"
                                style={{ 
                                    gridRow: `${rowIndex + 2} / span ${rowSpan}`, 
                                    gridColumn: dayIndex + 2,
                                    borderRight: dayIndex === DAYS.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderBottom: rowIndex === numRows - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.005)',
                                    zIndex: rowSpan > 1 ? 10 : undefined,
                                }}
                            >
                                {cellItems.map(({ entry, slot }) => (
                                    <div 
                                        key={entry.id} 
                                        className="w-full flex-shrink-0 animate-fade-in"
                                        style={{ 
                                            minHeight: rowSpan > 1 
                                                ? (cellItems.length > 1 ? 'calc(50% - 4px)' : '100%') 
                                                : '88px' 
                                        }}
                                    >
                                        <CourseCard
                                            entry={entry}
                                            onRemove={onRemoveCourse}
                                            compact={cellItems.length > 1}
                                            timeSlot={slot}
                                            routine={routine}
                                            getExamInfo={getExamInfo}
                                        />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    </div>
    );
}
