/**
 * src/components/CourseCard.jsx
 * A colored course block shown inside the CalendarGrid cells.
 * timeSlot: { startStr, endStr } for the specific day this card is on.
 * entry.role: 'primary' | 'backup'
 */
import React from 'react';
import { X, FlaskConical } from 'lucide-react';
import { getCourseRole } from '../hooks/useRoutine';

export default function CourseCard({ entry, onRemove, compact = false, timeSlot, routine }) {
    const { code, name, section, room, faculty, color } = entry;
    
    // Dynamically calculate the role details
    const roleInfo = routine 
        ? getCourseRole(entry, routine) 
        : { type: entry.role || 'primary', label: entry.role === 'backup' ? 'Backup' : 'Primary' };
        
    const isPrimary = roleInfo.type === 'primary';
    const isBackup = roleInfo.type === 'backup';
    const isChoice = roleInfo.type === 'choice';
    const timeLabel = timeSlot ? `${timeSlot.startStr}–${timeSlot.endStr}` : null;

    const isLab = name.toLowerCase().includes('laboratory') || 
                  name.toLowerCase().includes('lab') || 
                  (room && room.toLowerCase().includes('lab'));

    // Distinct styles based on choice/backup status
    let bgStyle = color.bg;
    let borderStyle = 'none';
    let leftBorderStyle = `4px solid ${color.border}`;
    let opacityStyle = 1;
    let shadowStyle = `0 4px 12px ${color.bg}40`;

    if (isBackup) {
        bgStyle = 'rgba(30, 41, 59, 0.75)'; // Medium-dark glass background
        borderStyle = `2px dashed ${color.border}`; // dashed border
        leftBorderStyle = `2px dashed ${color.border}`; // match border style to prevent overlap glitches
        opacityStyle = 1.0;
        shadowStyle = `0 2px 8px ${color.bg}15`;
    } else if (isChoice) {
        bgStyle = 'rgba(30, 41, 59, 0.7)'; // Medium glass background
        borderStyle = `2.5px dotted ${color.border}`; // dotted border
        leftBorderStyle = `2.5px dotted ${color.border}`; // match border style to prevent overlap glitches
        opacityStyle = 0.95;
        shadowStyle = `0 2px 8px ${color.bg}20`;
    }

    return (
        <div
            className="relative rounded-lg overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg min-h-full h-fit flex flex-col justify-between"
            style={{
                background: bgStyle,
                border: borderStyle,
                borderLeft: leftBorderStyle,
                boxShadow: shadowStyle,
                opacity: opacityStyle,
            }}
        >
            {/* Tint overlays for backup and choice cards to blend course colors */}
            {isBackup && (
                <div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ background: color.bg, opacity: 0.28 }}
                />
            )}
            {isChoice && (
                <div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{ background: color.bg, opacity: 0.28 }}
                />
            )}

            <div
                className="relative text-white min-h-full h-fit flex flex-col justify-between"
                style={{ 
                    paddingTop: compact ? '8px' : '12px',
                    paddingBottom: compact ? '8px' : '12px',
                    paddingRight: compact ? '6px' : '8px',
                    paddingLeft: compact ? '11px' : '15px'
                }}
            >
                <div className="flex items-center justify-between gap-1 min-h-full h-fit">
                    <div className="min-w-0 flex-1">
                        {/* Course code + Backup/Choice badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`font-bold leading-tight truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                                {code}
                            </p>
                            {isLab && (
                                <span 
                                    className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 flex items-center gap-0.5 text-black"
                                    style={{
                                        background: '#eab308',
                                        boxShadow: '0 0 8px rgba(234, 179, 8, 0.4)',
                                    }}
                                >
                                    <FlaskConical size={8} className="text-black" />
                                    Lab
                                </span>
                            )}
                            {isBackup && (
                                <span
                                    className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 text-white"
                                    style={{
                                        background: '#ef4444',
                                        boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                                    }}
                                >
                                    Backup
                                </span>
                            )}
                            {isChoice && (
                                <span
                                    className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                                    style={{
                                        background: roleInfo.level === 2 ? '#06b6d4' : '#d946ef',
                                        color: roleInfo.level === 2 ? '#000' : '#fff',
                                        boxShadow: roleInfo.level === 2 
                                            ? '0 0 8px rgba(6, 182, 212, 0.4)' 
                                            : '0 0 8px rgba(217, 70, 239, 0.4)',
                                    }}
                                >
                                    {roleInfo.label}
                                </span>
                            )}
                        </div>

                        {/* Course name */}
                        <p className={`leading-tight opacity-90 mt-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
                            {name}
                        </p>

                        {/* Section + Room inline */}
                        <p className={`opacity-80 leading-tight mt-0.5 ${compact ? 'text-[8.5px]' : 'text-[9.5px]'}`}>
                            Sec {section}{room ? ` | Room : ${room}` : ''}
                        </p>

                        {/* Faculty name + Time */}
                        {timeLabel && (
                            <>
                                {faculty && (
                                    <p className={`leading-tight truncate ${compact ? 'text-[8px] mt-0.5' : 'text-[9px] mt-1'}`} style={{ opacity: 0.75 }}>
                                        {faculty}
                                    </p>
                                )}
                                <p className={`font-bold tracking-tight mt-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'}`} style={{ opacity: 0.95 }}>
                                    {timeLabel}
                                </p>
                            </>
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
