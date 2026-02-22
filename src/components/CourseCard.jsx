/**
 * src/components/CourseCard.jsx
 * A colored course block shown inside the CalendarGrid cells.
 * Now shows the time slot (startStr–endStr) directly on the card.
 */
import React from 'react';
import { X } from 'lucide-react';

export default function CourseCard({ entry, slot, onRemove, compact = false }) {
    const { code, name, section, room, color } = entry;

    return (
        <div
            className="relative rounded-lg overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg h-full"
            style={{
                background: color.bg,
                borderLeft: `3px solid ${color.border}`,
                boxShadow: `0 2px 12px ${color.bg}`,
            }}
        >
            <div className={`${compact ? 'p-1.5' : 'p-2'} text-white h-full flex flex-col justify-between`}>
                <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                        <p className={`font-bold leading-tight truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                            {code}
                        </p>
                        {!compact && (
                            <p className="text-[10px] leading-tight opacity-90 line-clamp-2 mt-0.5">{name}</p>
                        )}
                        <p className={`opacity-80 leading-tight ${compact ? 'text-[9px]' : 'text-[10px] mt-0.5'}`}>
                            Sec {section}
                        </p>
                    </div>
                    {onRemove && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/40 rounded-full p-0.5 flex-shrink-0"
                            title="Remove from routine"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>

                {/* Time badge at the bottom of the card */}
                {slot && !compact && (
                    <div className="mt-1">
                        <span className="inline-block bg-black/25 rounded px-1.5 py-0.5 text-[9px] font-mono text-white/90 leading-tight">
                            {slot.startStr}–{slot.endStr}
                        </span>
                    </div>
                )}
                {slot && compact && (
                    <p className="text-[8px] font-mono opacity-75 leading-tight">{slot.startStr}–{slot.endStr}</p>
                )}
            </div>
        </div>
    );
}
