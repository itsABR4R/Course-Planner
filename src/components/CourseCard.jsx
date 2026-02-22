/**
 * src/components/CourseCard.jsx
 * A colored course block shown inside the CalendarGrid cells.
 * timeSlot: { startStr, endStr } for the specific day this card is on.
 * entry.role: 'primary' | 'backup'
 */
import React from 'react';
import { X } from 'lucide-react';

export default function CourseCard({ entry, onRemove, compact = false, timeSlot }) {
    const { code, name, section, room, faculty, color, role } = entry;
    const isBackup = role === 'backup';
    const timeLabel = timeSlot ? `${timeSlot.startStr}–${timeSlot.endStr}` : null;

    return (
        <div
            className="relative rounded-lg overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg h-full"
            style={{
                background: isBackup ? 'transparent' : color.bg,
                border: isBackup ? `2px dashed ${color.border}` : `none`,
                borderLeft: isBackup ? `3px dashed ${color.border}` : `3px solid ${color.border}`,
                boxShadow: isBackup ? 'none' : `0 2px 12px ${color.bg}`,
                opacity: isBackup ? 0.75 : 1,
            }}
        >
            {/* Backup: faint tinted background */}
            {isBackup && (
                <div
                    className="absolute inset-0 rounded-lg"
                    style={{ background: color.bg, opacity: 0.25 }}
                />
            )}

            <div
                className="relative text-white h-full"
                style={{ padding: compact ? '6px' : '8px 8px 12px 8px' }}
            >
                <div className="flex items-center justify-between gap-1 h-full">
                    <div className="min-w-0 flex-1">
                        {/* Course code + Backup badge */}
                        <div className="flex items-center gap-1.5">
                            <p className={`font-bold leading-tight truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                                {code}
                            </p>
                            {isBackup && (
                                <span
                                    className="text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                                    style={{
                                        background: color.border,
                                        color: '#fff',
                                        opacity: 0.9,
                                    }}
                                >
                                    Backup
                                </span>
                            )}
                        </div>

                        {/* Course name */}
                        {!compact && (
                            <p className="text-[10px] leading-tight opacity-90 line-clamp-1 mt-0.5">{name}</p>
                        )}

                        {/* Section + Room inline */}
                        <p className={`opacity-80 leading-tight ${compact ? 'text-[9px]' : 'text-[10px] mt-0.5'}`}>
                            Sec {section}{room ? ` | Room : ${room}` : ''}
                        </p>

                        {/* Faculty name + Time */}
                        {timeLabel && !compact && (
                            <>
                                {faculty && (
                                    <p className="text-[9px] mt-1 leading-tight truncate" style={{ opacity: 0.75 }}>
                                        {faculty}
                                    </p>
                                )}
                                <p className="text-[11px] font-bold mt-0.5 tracking-tight" style={{ opacity: 0.95 }}>
                                    {timeLabel}
                                </p>
                            </>
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
