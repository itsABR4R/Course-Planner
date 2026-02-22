/**
 * src/components/CourseCardStack.jsx
 *
 * Renders a primary course card. If backup sections exist for the SAME day,
 * a click-to-expand dropdown reveals them below the primary card.
 *
 * Used only when same-day same-course grouping is detected in CalendarGrid.
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import CourseCard from './CourseCard';

export default function CourseCardStack({ primary, primarySlot, backups, onRemove }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={containerRef} className="relative h-full">
            {/* Primary card — clickable to reveal backups */}
            <div
                className="h-full relative cursor-pointer select-none"
                onClick={() => backups.length > 0 && setOpen(o => !o)}
            >
                <CourseCard
                    entry={primary}
                    onRemove={onRemove}
                    compact={false}
                    timeSlot={primarySlot}
                />

                {/* Backup count indicator on the primary card */}
                {backups.length > 0 && (
                    <div
                        className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-white text-[8px] font-bold pointer-events-none"
                        style={{ background: 'rgba(0,0,0,0.45)' }}
                    >
                        <ChevronDown
                            size={8}
                            style={{
                                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                            }}
                        />
                        {backups.length} backup{backups.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Dropdown — appears below primary card, floats over grid */}
            {open && backups.length > 0 && (
                <div
                    className="absolute left-0 right-0 z-50 flex flex-col gap-1 pt-1"
                    style={{ top: '100%' }}
                >
                    {backups.map(({ entry, slot }) => (
                        <div
                            key={`${entry.id}-${slot.startMin}`}
                            style={{ height: 88 }}
                            className="rounded-lg overflow-hidden shadow-xl"
                        >
                            <CourseCard
                                entry={entry}
                                onRemove={(id) => { onRemove(id); setOpen(false); }}
                                compact={false}
                                timeSlot={slot}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
