/**
 * src/components/CalendarGrid.jsx
 *
 * Weekly calendar grid (Sat–Wed) with time slots from 08:30 to 16:30.
 * Automatically places routine course cards into the correct cells.
 */
import React from 'react';
import CourseCard from './CourseCard';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

// Time slots: UIU runs 08:30 to 16:30 in ~80-90 min blocks
// We'll use continuous minute ranges for layout
const GRID_START = 8 * 60 + 30;  // 08:30
const GRID_END = 16 * 60 + 30; // 16:30
const GRID_TOTAL = GRID_END - GRID_START; // 480 minutes

/** Canonical UIU period slots for display labels on the Y axis */
const TIME_SLOTS = [
    { label: '08:30', start: 8 * 60 + 30 },
    { label: '09:51', start: 9 * 60 + 51 },
    { label: '11:11', start: 11 * 60 + 11 },
    { label: '12:31', start: 12 * 60 + 31 },
    { label: '13:51', start: 13 * 60 + 51 },
    { label: '14:00', start: 14 * 60 + 0 },
    { label: '15:11', start: 15 * 60 + 11 },
    { label: '16:30', start: 16 * 60 + 30 },
];

function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${dh}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Returns entries that appear in a given day */
function getEntriesForDay(routine, day) {
    return routine.filter(entry => entry.slots.some(s => s.day === day));
}

/** For a given day and entry, gets the slot for that day */
function getSlotsForDay(entry, day) {
    return entry.slots.filter(s => s.day === day);
}

export default function CalendarGrid({ routine, onRemoveCourse }) {
    const GRID_HEIGHT = 520; // px

    const topPercent = (minutes) => ((minutes - GRID_START) / GRID_TOTAL) * 100;
    const heightPercent = (start, end) => ((end - start) / GRID_TOTAL) * 100;

    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
            {/* Header row */}
            <div className="grid border-b border-white/10" style={{ gridTemplateColumns: '70px repeat(5, 1fr)' }}>
                <div className="py-3 px-2 border-r border-white/10">
                    <span className="text-xs text-slate-500 font-medium">Time</span>
                </div>
                {DAYS.map(day => (
                    <div key={day} className="py-3 px-2 text-center border-r border-white/10 last:border-r-0">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{day.slice(0, 3)}</span>
                    </div>
                ))}
            </div>

            {/* Grid body */}
            <div className="grid" style={{ gridTemplateColumns: '70px repeat(5, 1fr)' }}>
                {/* Time axis (Y) */}
                <div className="border-r border-white/10 relative" style={{ height: GRID_HEIGHT }}>
                    {TIME_SLOTS.map(({ label, start }, i) => (
                        <div
                            key={i}
                            className="absolute right-2 text-right"
                            style={{ top: `${topPercent(start)}%`, transform: 'translateY(-50%)' }}
                        >
                            <span className="text-[10px] text-slate-500 font-mono">{label}</span>
                        </div>
                    ))}
                    {/* Horizontal guide lines */}
                    {TIME_SLOTS.map(({ start }, i) => (
                        <div
                            key={`line-${i}`}
                            className="absolute left-0 right-0 border-t border-white/5"
                            style={{ top: `${topPercent(start)}%` }}
                        />
                    ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day, di) => {
                    const dayEntries = getEntriesForDay(routine, day);
                    return (
                        <div
                            key={day}
                            className="border-r border-white/10 last:border-r-0 relative"
                            style={{ height: GRID_HEIGHT }}
                        >
                            {/* Guide lines */}
                            {TIME_SLOTS.map(({ start }, i) => (
                                <div
                                    key={`gl-${i}`}
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
                                            style={{ top: `${top}%`, height: `${height}%`, minHeight: 28 }}
                                        >
                                            <div className="h-full overflow-hidden">
                                                <CourseCard entry={entry} onRemove={onRemoveCourse} compact={height < 12} />
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
