/**
 * src/components/CalendarGrid.jsx
 *
 * Weekly calendar grid (Sat–Wed), 08:30–16:30.
 *
 * Same-day same-course grouping:
 *   Primary card + same-day backups → CourseCardStack (click to expand backups)
 *
 * Same-day different-course at overlapping times → greedy lane/sub-column split
 *
 * Same-course different-day backups → rendered as normal backup cards
 */
import React from 'react';
import CourseCard from './CourseCard';
import CourseCardStack from './CourseCardStack';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

const GRID_START = 8 * 60 + 30;  // 08:30
const GRID_END = 16 * 60 + 30; // 16:30
const GRID_TOTAL = GRID_END - GRID_START; // 480 min

const TIME_SLOTS = [
    { label: '08:30', start: 8 * 60 + 30 },
    { label: '09:51', start: 9 * 60 + 51 },
    { label: '11:11', start: 11 * 60 + 11 },
    { label: '12:31', start: 12 * 60 + 31 },
    { label: '13:51', start: 13 * 60 + 51 },
    { label: '15:11', start: 15 * 60 + 11 },
    { label: '16:30', start: 16 * 60 + 30 },
];

const topPercent = (min) => ((min - GRID_START) / GRID_TOTAL) * 100;

/** Greedy lane assignment — returns items augmented with { lane, totalLanes } */
function computeLanes(items) {
    if (items.length === 0) return [];
    const sorted = [...items].sort((a, b) => a.representativeSlot.startMin - b.representativeSlot.startMin);
    const laneEnds = [];
    const withLanes = sorted.map(item => {
        let lane = laneEnds.findIndex(end => end <= item.representativeSlot.startMin);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(item.representativeSlot.endMin); }
        else { laneEnds[lane] = item.representativeSlot.endMin; }
        return { ...item, lane };
    });
    const totalLanes = laneEnds.length;
    return withLanes.map(item => ({ ...item, totalLanes }));
}

export default function CalendarGrid({ routine, onRemoveCourse }) {
    const GRID_HEIGHT = 520;
    const CARD_HEIGHT = 88;

    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="grid border-b border-white/10" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {DAYS.map(day => (
                    <div key={day} className="py-3 px-2 text-center border-r border-white/10 last:border-r-0">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            {day.slice(0, 3)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {DAYS.map((day) => {
                    // All {entry, slot} pairs for this day
                    const rawItems = [];
                    for (const entry of routine) {
                        for (const slot of entry.slots.filter(s => s.day === day)) {
                            rawItems.push({ entry, slot });
                        }
                    }

                    // ── Build display items ──────────────────────────────────────
                    // Rule: same course + same day + overlapping time → dropdown stack
                    //       same course + same day + DIFFERENT time  → separate items (lanes)

                    const processedKeys = new Set();
                    const displayItems = [];

                    // Key for a {entry, slot} pair
                    const key = (entry, slot) => `${entry.id}-${slot.startMin}`;

                    // Helper: do two slots overlap?
                    const overlaps = (a, b) => a.startMin < b.endMin && b.startMin < a.endMin;

                    // Process primaries first — collect their overlapping same-course backups
                    for (const item of rawItems.filter(i => i.entry.role === 'primary')) {
                        const k = key(item.entry, item.slot);
                        if (processedKeys.has(k)) continue;
                        processedKeys.add(k);

                        // Find backups of same course that overlap in time on this day
                        const stackedBackups = rawItems.filter(b =>
                            b.entry.role === 'backup' &&
                            b.entry.code === item.entry.code &&
                            !processedKeys.has(key(b.entry, b.slot)) &&
                            overlaps(item.slot, b.slot)
                        );
                        stackedBackups.forEach(b => processedKeys.add(key(b.entry, b.slot)));

                        displayItems.push({
                            primaryEntry: item.entry,
                            primarySlot: item.slot,
                            backups: stackedBackups,         // go into dropdown
                            representativeSlot: item.slot,
                        });
                    }

                    // Remaining items (standalone backups, different-time backups, etc.)
                    for (const item of rawItems) {
                        const k = key(item.entry, item.slot);
                        if (processedKeys.has(k)) continue;
                        processedKeys.add(k);

                        displayItems.push({
                            primaryEntry: item.entry,
                            primarySlot: item.slot,
                            backups: [],
                            representativeSlot: item.slot,
                        });
                    }


                    // Lane assignment on display items
                    const laidOut = computeLanes(displayItems);

                    return (
                        <div
                            key={day}
                            className="border-r border-white/10 last:border-r-0 relative"
                            style={{ height: GRID_HEIGHT, overflow: 'visible' }}
                        >
                            {/* Guide lines */}
                            {TIME_SLOTS.slice(1).map(({ start }, i) => (
                                <div
                                    key={`gl-${i}`}
                                    className="absolute left-0 right-0 border-t border-white/5"
                                    style={{ top: `${topPercent(start)}%` }}
                                />
                            ))}

                            {/* Render each display item */}
                            {laidOut.map(({ primaryEntry, primarySlot, backups, lane, totalLanes }) => {
                                const laneW = 100 / totalLanes;
                                const leftPct = lane * laneW;

                                return (
                                    <React.Fragment key={`${primaryEntry.id}-${primarySlot.startMin}`}>
                                        {/* Primary card (or stacked with backups) */}
                                        <div
                                            className="absolute z-10 animate-fade-in"
                                            style={{
                                                top: `${topPercent(primarySlot.startMin)}%`,
                                                height: `${CARD_HEIGHT}px`,
                                                left: `calc(${leftPct}% + 4px)`,
                                                width: `calc(${laneW}% - 8px)`,
                                                overflow: 'visible',
                                            }}
                                        >
                                            {backups.length > 0 ? (
                                                <CourseCardStack
                                                    primary={primaryEntry}
                                                    primarySlot={primarySlot}
                                                    backups={backups}
                                                    onRemove={onRemoveCourse}
                                                />
                                            ) : (
                                                <div className="h-full overflow-hidden">
                                                    <CourseCard
                                                        entry={primaryEntry}
                                                        onRemove={onRemoveCourse}
                                                        compact={false}
                                                        timeSlot={primarySlot}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                    </React.Fragment>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
