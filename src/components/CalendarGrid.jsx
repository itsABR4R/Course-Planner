/**
 * src/components/CalendarGrid.jsx
 *
 * Weekly calendar schedule rendered as a 2D grid table (Sat–Wed).
 * Left column displays "Slot N" showing the slot start time.
 * Rows are dynamically generated for each unique course start time in the routine.
 * Day cells stack same-day same-start-time courses vertically.
 */
import React from 'react';
import CourseCard from './CourseCard';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const formatMinutes = (min) => {
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export default function CalendarGrid({ routine, onRemoveCourse }) {
    // Extract unique start times from the current routine and sort chronologically
    const uniqueStartTimes = Array.from(
        new Set(
            routine.flatMap(entry => entry.slots.map(s => s.startMin))
        )
    ).sort((a, b) => a - b);

    const numRows = uniqueStartTimes.length;

    return (
        <div 
            id="weekly-schedule-grid"
            className="grid border border-white/10 rounded-2xl overflow-hidden glass"
            style={{
                gridTemplateColumns: '85px repeat(5, 1fr)',
                gridTemplateRows: `auto repeat(${numRows}, minmax(110px, auto))`,
            }}
        >
            {/* ── Column Header Row ── */}
            <div 
                className="py-3 px-2 text-center border-r border-b border-white/10 bg-white/5 font-semibold text-slate-400 text-xs uppercase tracking-wider" 
                style={{ gridRow: 1, gridColumn: 1 }}
            >
                Slot
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
            {uniqueStartTimes.map((startMin, rowIndex) => (
                <React.Fragment key={`row-${startMin}`}>
                    {/* Left Slot Label Cell */}
                    <div 
                        className="p-3 flex flex-col justify-center items-center border-r border-b border-white/10 bg-white/[0.02] text-center animate-fade-in"
                        style={{ 
                            gridRow: rowIndex + 2, 
                            gridColumn: 1,
                            borderBottom: rowIndex === numRows - 1 ? 'none' : undefined
                        }}
                    >
                        <span className="text-xs font-bold text-slate-200">Slot {rowIndex + 1}</span>
                    </div>

                    {/* Day Schedule Cells */}
                    {DAYS.map((day, dayIndex) => {
                        // Gather sections for this day starting at this startMin
                        const cellItems = [];
                        for (const entry of routine) {
                            for (const slot of entry.slots.filter(s => s.day === day)) {
                                if (slot.startMin === startMin) {
                                    cellItems.push({ entry, slot });
                                }
                            }
                        }

                        // Sort by routine addition order to maintain choice priority visually
                        cellItems.sort((a, b) => routine.indexOf(a.entry) - routine.indexOf(b.entry));

                        return (
                            <div 
                                key={`cell-${day}-${startMin}`}
                                className="p-2 flex flex-col gap-2 justify-start overflow-visible min-h-[110px]"
                                style={{ 
                                    gridRow: rowIndex + 2, 
                                    gridColumn: dayIndex + 2,
                                    borderRight: dayIndex === DAYS.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderBottom: rowIndex === numRows - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.005)'
                                }}
                            >
                                {cellItems.map(({ entry, slot }) => (
                                    <div key={entry.id} className="w-full min-h-[88px] flex-shrink-0 animate-fade-in">
                                        <CourseCard
                                            entry={entry}
                                            onRemove={onRemoveCourse}
                                            compact={cellItems.length > 1}
                                            timeSlot={slot}
                                            routine={routine}
                                        />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
}
