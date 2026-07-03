/**
 * src/components/CourseCardStack.jsx
 *
 * Renders a primary course card. If backup sections exist for the SAME day,
 * a click-to-expand dropdown reveals them below the primary card.
 *
 * Used only when same-day same-course grouping is detected in CalendarGrid.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import CourseCard from './CourseCard';

export default function CourseCardStack({ primary, primarySlot, backups, onRemove, routine, onOpenDetails }) {
    return (
        <div className="relative h-full">
            {/* Top-right badge showing total overlapping count */}
            {backups.length > 0 && (
                <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-[10px] font-extrabold text-white shadow-lg border border-white/20 animate-pulse z-20 pointer-events-none"
                >
                    {backups.length + 1}
                </div>
            )}

            {/* Primary card — clickable to reveal details in drawer */}
            <div
                className="h-full relative cursor-pointer select-none"
                onClick={() => backups.length > 0 && onOpenDetails()}
            >
                <CourseCard
                    entry={primary}
                    onRemove={onRemove}
                    compact={false}
                    timeSlot={primarySlot}
                    routine={routine}
                />

                {/* Alternative choices count indicator on the primary card */}
                {backups.length > 0 && (
                    <div
                        className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-white text-[8px] font-bold pointer-events-none z-10"
                        style={{ background: 'rgba(0,0,0,0.45)' }}
                    >
                        <ChevronRight size={8} />
                        {backups.length} more
                    </div>
                )}
            </div>
        </div>
    );
}
