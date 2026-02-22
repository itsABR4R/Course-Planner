/**
 * src/components/CalendarGrid.jsx
 *
 * Weekly calendar grid (Sat–Wed) with time slots from 08:30 to 16:30.
 * Time column removed — time is shown inside each course card instead.
 */
import React from 'react';
import CourseCard from './CourseCard';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const GRID_START = 8 * 60 + 30;  // 08:30
const GRID_END = 16 * 60 + 30; // 16:30
const GRID_TOTAL = GRID_END - GRID_START; // 480 minutes

/** Guide lines at each UIU period boundary */
const TIME_SLOTS = [
    { start: 8 * 60 + 30 },
    { start: 9 * 60 + 51 },
    { start: 11 * 60 + 11 },
    { start: 12 * 60 + 31 },
    { start: 13 * 60 + 51 },
    { start: 14 * 60 + 0 },
    { start: 15 * 60 + 11 },
    { start: 16 * 60 + 30 },
];

function getEntriesForDay(routine, day) {
    return routine.filter(entry => entry.slots.some(s => s.day === day));
}

function getSlotsForDay(entry, day) {
    return entry.slots.filter(s => s.day === day);
}

export default function CalendarGrid({ routine, onRemoveCourse }) {
    const GRID_HEIGHT = 420;

    const topPercent = (min) => ((min - GRID_START) / GRID_TOTAL) * 100;
    const heightPercent = (start, end) => ((end - start) / GRID_TOTAL) * 100;

    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
            {/* Header — 5 equal day columns */}
            <div className="grid border-b border-white/10" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {DAYS.map(day => (
                    <div key={day} className="py-3 px-2 text-center border-r border-white/10 last:border-r-0">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            {day.slice(0, 3)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Grid body */}
            <div className="grid overflow-hidden" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {DAYS.map(day => {
                    const dayEntries = getEntriesForDay(routine, day);
                    return (
                        <div
                            key={day}
                            className="border-r border-white/10 last:border-r-0 relative overflow-hidden"
                            style={{ height: GRID_HEIGHT }}
                        >
                            {/* Horizontal guide lines */}
                            {TIME_SLOTS.map(({ start }, i) => (
                                <div
                                    key={i}
                                    className="absolute left-0 right-0 border-t border-white/5"
                                    style={{ top: `${topPercent(start)}%` }}
                                />
                            ))}

                            {/* Course blocks */}
                            {dayEntries.map(entry => {
                                const daySlots = getSlotsForDay(entry, day);
                                return daySlots.map((slot, si) => {
                                    const top = topPercent(slot.startMin);
                                    const height = heightPercent(slot.startMin, slot.endMin);
                                    return (
                                        <div
                                            key={`${entry.id}-${si}`}
                                            className="absolute left-1 right-1 z-10 animate-fade-in"
                                            style={{ top: `${top}%`, height: `${height}%`, minHeight: 32 }}
                                        >
                                            <div className="h-full overflow-hidden">
                                                <CourseCard
                                                    entry={entry}
                                                    slot={slot}
                                                    onRemove={onRemoveCourse}
                                                    compact={height < 12}
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
