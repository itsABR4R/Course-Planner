/**
 * src/components/CourseCard.jsx
 * A colored course block shown inside the CalendarGrid cells.
 */
import React from 'react';
import { X } from 'lucide-react';

export default function CourseCard({ entry, onRemove, compact = false }) {
    const { code, name, section, faculty, room, color } = entry;

    return (
        <div
            className="relative rounded-lg overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{
                background: color.bg,
                borderLeft: `3px solid ${color.border}`,
                boxShadow: `0 2px 12px ${color.bg}`,
            }}
        >
            <div className={`${compact ? 'p-1.5' : 'p-2'} text-white`}>
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
                        {!compact && room && (
                            <p className="text-[9px] opacity-70 mt-0.5 truncate">📍 {room}</p>
                        )}
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
            </div>
        </div>
    );
}
