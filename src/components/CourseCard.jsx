/**
 * src/components/CourseCard.jsx
 * A colored course block shown inside the CalendarGrid cells.
 * timeSlot: { startStr, endStr } for the specific day this card is on.
 */
import React from 'react';
import { X } from 'lucide-react';

export default function CourseCard({ entry, onRemove, compact = false, timeSlot }) {
    const { code, name, section, room, color } = entry;
    const timeLabel = timeSlot ? `${timeSlot.startStr}–${timeSlot.endStr}` : null;

    return (
        <div
            className="relative rounded-lg overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg h-full"
            style={{
                background: color.bg,
                borderLeft: `3px solid ${color.border}`,
                boxShadow: `0 2px 12px ${color.bg}`,
            }}
        >
            <div
                className="text-white h-full"
                style={{ padding: compact ? '6px' : '8px 8px 12px 8px' }}
            >
                <div className="flex items-start justify-between gap-1 h-full">
                    <div className="min-w-0 flex-1">
                        {/* Course code */}
                        <p className={`font-bold leading-tight truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                            {code}
                        </p>

                        {/* Course name */}
                        {!compact && (
                            <p className="text-[10px] leading-tight opacity-90 line-clamp-1 mt-0.5">{name}</p>
                        )}

                        {/* Section + Room inline */}
                        <p className={`opacity-80 leading-tight ${compact ? 'text-[9px]' : 'text-[10px] mt-0.5'}`}>
                            Sec {section}{room ? ` | Room : ${room}` : ''}
                        </p>

                        {/* Time — bold, always shown unless too compact */}
                        {timeLabel && !compact && (
                            <p className="text-[11px] font-bold mt-1 tracking-tight" style={{ opacity: 0.95 }}>
                                {timeLabel}
                            </p>
                        )}
                        {timeLabel && compact && (
                            <p className="text-[9px] font-bold mt-0.5 opacity-90">{timeLabel}</p>
                        )}


                    </div>

                    {/* Remove button */}
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
