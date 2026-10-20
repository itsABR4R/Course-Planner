/**
 * src/components/CourseSearch.jsx
 *
 * Course Catalogue with:
 *  - Autocomplete suggestions dropdown when typing in the search bar
 *  - Click a suggestion → pins to that single course (sections auto-expand)
 *  - Advanced Search (toggle): filter sections within the pinned/filtered set
 *    • By Faculty → sections matching faculty name
 *    • By Time    → sections matching day or time
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, ChevronDown, ChevronUp, BookOpen,
    User, MapPin, Clock, SlidersHorizontal, X, Pin, Check, GripVertical,
} from 'lucide-react';

/* ─── Color accent based on course prefix ─── */
function getCourseAccentColor(code = '') {
    const clean = code.trim().toUpperCase();
    if (clean.startsWith('CSE') || clean.startsWith('ACT') || clean.startsWith('ACC')) return '#f97316'; // orange
    if (clean.startsWith('BDS') || clean.startsWith('SOC') || clean.startsWith('DEV')) return '#06b6d4'; // cyan
    if (clean.startsWith('BIO') || clean.startsWith('BGE') || clean.startsWith('CHE') || clean.startsWith('PHY')) return '#10b981'; // emerald
    if (clean.startsWith('EEE') || clean.startsWith('MAT') || clean.startsWith('MATH')) return '#f59e0b'; // amber
    if (clean.startsWith('ENG') || clean.startsWith('MSC') || clean.startsWith('ECO')) return '#8b5cf6'; // purple
    if (clean.startsWith('BBA') || clean.startsWith('FIN') || clean.startsWith('MKT') || clean.startsWith('MGT')) return '#3b82f6'; // blue
    return '#f97316';
}

/* ─── Custom styled dropdown ─── */
function CustomSelect({ value, onChange, options, placeholder = 'Any', icon: Icon }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const panelRef = useRef(null);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                panelRef.current && !panelRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* Recalculate position on open & on scroll/resize */
    const calcPos = () => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    useEffect(() => {
        if (!open) return;
        calcPos();
        window.addEventListener('scroll', calcPos, true);
        window.addEventListener('resize', calcPos);
        return () => {
            window.removeEventListener('scroll', calcPos, true);
            window.removeEventListener('resize', calcPos);
        };
    }, [open]);

    const selected = options.find(o => o.value === value);
    const label = selected ? selected.label : placeholder;

    return (
        <div className="relative flex-1 select-none">
            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => { calcPos(); setOpen(o => !o); }}
                className={`
                    w-full flex items-center justify-between gap-2
                    px-3 py-2 text-xs rounded-lg border
                    transition-all duration-200
                    ${open
                        ? 'bg-[#14182e] border-orange-500/60 text-white'
                        : 'bg-[#0a0c18] border-[#1d233e] text-slate-300 hover:border-[#2d375e]'}
                `}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon size={12} className="text-slate-400 flex-shrink-0" />}
                    <span className={`truncate text-xs font-medium ${value ? 'text-white' : 'text-slate-400'}`}>
                        {label}
                    </span>
                </div>
                {open
                    ? <ChevronUp size={13} className="text-orange-400 flex-shrink-0" />
                    : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />}
            </button>

            {/* Portal panel — renders at document.body, fully above everything */}
            {open && createPortal(
                <div
                    ref={panelRef}
                    style={{
                        position: 'fixed',
                        top: pos.top,
                        left: pos.left,
                        width: pos.width,
                        zIndex: 9999,
                        background: '#0d1020',
                    }}
                    className="rounded-xl border border-[#232b4b] overflow-hidden shadow-2xl animate-fade-in"
                >
                    {/* "Any" option */}
                    <button
                        type="button"
                        onClick={() => { onChange(''); setOpen(false); }}
                        className={`
                            w-full flex items-center justify-between px-3 py-2 text-xs
                            transition-colors duration-100
                            ${!value ? 'text-orange-300 bg-orange-600/20 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                        `}
                    >
                        <span className="italic">{placeholder}</span>
                        {!value && <Check size={12} className="text-orange-400" />}
                    </button>
                    <div className="border-t border-[#1a1f36]" />
                    {/* Options list */}
                    <div className="max-h-52 overflow-y-auto">
                        {options.map(opt => (
                            <button
                                type="button"
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2 text-xs
                                    transition-colors duration-100
                                    ${value === opt.value
                                        ? 'text-orange-300 bg-orange-600/20 font-semibold'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <span>{opt.label}</span>
                                {value === opt.value && <Check size={12} className="text-orange-400" />}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}


/* ─── Section row ─── */
function SectionRow({ courseCode, courseName, section, onAdd, showCourseName = false, isAdded, getExamInfo }) {
    const hasTBA = !section.slots || section.slots.length === 0;
    const exam = getExamInfo ? getExamInfo(courseCode) : null;

    const handleDragStart = (e) => {
        const payload = {
            code: courseCode,
            name: courseName,
            section: section.section,
            faculty: section.faculty,
            room: section.room,
            slots: section.slots,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.setData('text/plain', `${courseCode} Sec ${section.section}`);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            draggable={!hasTBA && !isAdded}
            onDragStart={handleDragStart}
            className={`
                flex items-center justify-between px-3 py-2.5 rounded-lg
                transition-all duration-150 group select-none
                ${hasTBA
                    ? 'opacity-50 cursor-not-allowed bg-black/20'
                    : isAdded
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'cursor-grab active:cursor-grabbing hover:bg-white/[0.04] bg-[#0c0f1e] border border-[#1a1f36] hover:border-slate-600'}
            `}
            onClick={() => !hasTBA && !isAdded && onAdd(section)}
            title={!hasTBA && !isAdded ? "Click or drag to routine" : undefined}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {!hasTBA && !isAdded && (
                    <GripVertical size={13} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-bold text-orange-400 w-7 flex-shrink-0">
                    §{section.section}
                </span>
                <div className="min-w-0 flex-1">
                    {showCourseName && (
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-semibold text-slate-200 break-words whitespace-normal">
                                {courseCode} — {courseName}
                            </p>
                            {exam && (
                                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-[#26170d] text-orange-300 border border-orange-500/30 flex-shrink-0">
                                    {exam.day} / {exam.slot}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <User size={10} className="flex-shrink-0 text-slate-500" />
                        <span className="truncate">{section.faculty}</span>
                    </div>
                    {section.slots.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                            {section.slots.map((s, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <Clock size={9} className="flex-shrink-0 text-slate-500" />
                                    <span>{s.day} {s.startStr}–{s.endStr}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {section.room && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <MapPin size={9} className="flex-shrink-0" />
                            <span className="truncate">{section.room}</span>
                        </div>
                    )}
                    {hasTBA && <span className="text-[10px] text-amber-500">Schedule TBA</span>}
                </div>
            </div>
            {!hasTBA && (
                <button
                    disabled={isAdded}
                    className={`
                        ml-2 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-150
                        ${isAdded
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 cursor-not-allowed'
                            : 'bg-[#181d33] text-slate-200 border border-[#2b345a] group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-500'}
                    `}
                >
                    {isAdded ? 'Added' : 'Add'}
                </button>
            )}
        </div>
    );
}

/* ─── Collapsible course item ─── */
function CourseItem({ courseGroup, onAddSection, defaultExpanded = false, routine, getExamInfo }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    // If defaultExpanded flips (e.g. suggestion selected), sync state
    useEffect(() => { setExpanded(defaultExpanded); }, [defaultExpanded]);

    const exam = getExamInfo ? getExamInfo(courseGroup.code) : null;
    const accentColor = getCourseAccentColor(courseGroup.code);

    const handleCardDragStart = (e) => {
        // Find the first unadded section or default to first section
        const sec = courseGroup.sections.find(s => !routine.some(r => r.id === `${courseGroup.code}-${s.section}`)) || courseGroup.sections[0];
        if (sec) {
            const payload = {
                code: courseGroup.code,
                name: courseGroup.name,
                section: sec.section,
                faculty: sec.faculty,
                room: sec.room,
                slots: sec.slots,
            };
            e.dataTransfer.setData('application/json', JSON.stringify(payload));
            e.dataTransfer.setData('text/plain', `${courseGroup.code} Sec ${sec.section}`);
            e.dataTransfer.effectAllowed = 'copy';
        }
    };

    return (
        <div 
            className="rounded-xl overflow-hidden bg-[#0c0f1e] border border-[#1a1f36] mb-2.5 transition-all shadow-md"
            style={{ borderLeft: `3.5px solid ${accentColor}` }}
        >
            <div 
                draggable={courseGroup.sections.length > 0}
                onDragStart={handleCardDragStart}
                className="w-full px-3.5 py-3 hover:bg-white/[0.02] transition-colors text-left flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none"
                title="Drag card or click to expand sections"
            >
                {/* Top row: Icon + Code + Section count + Chevron */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Overlapping double loop / book icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: accentColor }} className="flex-shrink-0">
                            <circle cx="8" cy="12" r="5" />
                            <circle cx="16" cy="12" r="5" />
                        </svg>
                        <span className="text-xs font-bold text-white tracking-wide">{courseGroup.code}</span>
                        <span className="text-[11px] text-slate-400 font-normal">({courseGroup.sections.length} sections)</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button 
                            onClick={() => setExpanded(p => !p)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title={expanded ? "Collapse sections" : "Expand sections"}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>

                {/* Middle row: Course title */}
                <p className="text-xs font-semibold text-slate-200 leading-snug break-words whitespace-normal">
                    {courseGroup.name}
                </p>

                {/* Bottom row: Exam badge + Add to Routine button */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {exam && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#26170d] text-orange-300 border border-orange-500/35 flex-shrink-0 shadow-sm">
                                {exam.day} / {exam.slot}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            if (courseGroup.sections.length === 1 && !routine.some(r => r.id === `${courseGroup.code}-${courseGroup.sections[0].section}`)) {
                                onAddSection({ ...courseGroup, ...courseGroup.sections[0] });
                            } else {
                                setExpanded(p => !p);
                            }
                        }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#181d33] hover:bg-[#222949] text-white border border-[#2b345a] flex items-center gap-1 transition-all flex-shrink-0 shadow-sm"
                    >
                        <span>+ Add to Routine</span>
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-[#1a1f36] px-3 pb-3 pt-2 space-y-1.5 bg-[#090b16]/70 animate-fade-in">
                    {courseGroup.sections.map((sec) => {
                        const isAdded = routine && routine.some(r => r.id === `${courseGroup.code}-${sec.section}`);
                        return (
                            <SectionRow
                                key={sec.section}
                                courseCode={courseGroup.code}
                                courseName={courseGroup.name}
                                section={sec}
                                isAdded={isAdded}
                                onAdd={() => onAddSection({ ...courseGroup, ...sec })}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Advanced flat results ─── */
function AdvancedResults({ results, onAddSection, routine, getExamInfo }) {
    if (results === null) return null;
    if (results.length === 0) {
        return <div className="text-center text-slate-500 text-sm py-8">No sections found.</div>;
    }
    return (
        <div className="space-y-1.5 animate-fade-in">
            {results.map(({ courseGroup, section }, i) => {
                const isAdded = routine && routine.some(r => r.id === `${courseGroup.code}-${section.section}`);
                return (
                    <div key={i} className="rounded-xl overflow-hidden bg-[#0c0f1e] border border-[#1a1f36]">
                        <SectionRow
                            courseCode={courseGroup.code}
                            courseName={courseGroup.name}
                            section={section}
                            showCourseName={true}
                            isAdded={isAdded}
                            onAdd={() => onAddSection({ ...courseGroup, ...section })}
                            getExamInfo={getExamInfo}
                        />
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main export ─── */
export default function CourseSearch({ courseMap, onAddCourse, routine, getExamInfo }) {
    const [query, setQuery] = useState('');
    const [showSugg, setShowSugg] = useState(false);
    const [pinned, setPinned] = useState(null); // pinned course code (from suggestion click)

    const [advOpen, setAdvOpen] = useState(false);
    const [advMode, setAdvMode] = useState('faculty');
    const [advQuery, setAdvQuery] = useState('');   // faculty text
    const [advDay, setAdvDay] = useState('');   // time: day filter
    const [advTime, setAdvTime] = useState('');   // time: slot filter

    const wrapRef = useRef(null);
    const scrollRef = useRef(null);
    const trackRef = useRef(null);
    const [scrollRatio, setScrollRatio] = useState(0);
    const [viewportRatio, setViewportRatio] = useState(1);

    const courseList = useMemo(() => Object.values(courseMap), [courseMap]);

    const updateScrollMetrics = () => {
        const el = scrollRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const maxScroll = scrollHeight - clientHeight;
        const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
        const viewRatio = scrollHeight > 0 ? Math.min(1, Math.max(0.18, clientHeight / scrollHeight)) : 1;
        setScrollRatio(ratio);
        setViewportRatio(viewRatio);
    };

    const handleMouseDown = (e) => {
        const track = trackRef.current;
        const el = scrollRef.current;
        if (!track || !el) return;

        const onMove = (moveEvent) => {
            const rect = track.getBoundingClientRect();
            const moveRatio = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0) {
                el.scrollTop = moveRatio * maxScroll;
            }
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        onMove(e);
    };

    /* Close suggestions on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSugg(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* Suggestions — top 6 fuzzy matches while typing (only when not pinned) */
    const suggestions = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q || pinned) return [];
        return courseList
            .filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
            .slice(0, 6);
    }, [query, courseList, pinned]);

    /* Course list shown in results area */
    const filtered = useMemo(() => {
        if (pinned) return courseList.filter(c => c.code === pinned);
        const q = query.toLowerCase().trim();
        if (!q) return courseList;
        return courseList.filter(c =>
            c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        );
    }, [query, pinned, courseList]);

    /* Unique days & time-slots derived from currently filtered courses */
    const uniqueDays = useMemo(() => {
        return ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];
    }, []);

    const uniqueTimes = useMemo(() => {
        const times = new Set();
        for (const cg of filtered)
            for (const sec of cg.sections)
                for (const s of sec.slots) times.add(`${s.startStr}–${s.endStr}`);
        return [...times].sort();
    }, [filtered]);

    /* Advanced search scoped to filtered list */
    const advResults = useMemo(() => {
        if (!advOpen) return null;
        if (advMode === 'faculty') {
            const q = advQuery.toLowerCase().trim();
            if (!q) return null;
            const hits = [];
            for (const cg of filtered)
                for (const sec of cg.sections)
                    if (sec.faculty && sec.faculty.toLowerCase().includes(q))
                        hits.push({ courseGroup: cg, section: sec });
            return hits;
        } else {
            if (!advDay && !advTime) return null;
            const hits = [];
            for (const cg of filtered) {
                for (const sec of cg.sections) {
                    const match = sec.slots.some(s => {
                        const dayOk = !advDay || s.day === advDay;
                        const timeOk = !advTime || `${s.startStr}–${s.endStr}` === advTime;
                        return dayOk && timeOk;
                    });
                    if (match) hits.push({ courseGroup: cg, section: sec });
                }
            }
            return hits;
        }
    }, [advOpen, advMode, advQuery, advDay, advTime, filtered]);

    useEffect(() => {
        updateScrollMetrics();
        const el = scrollRef.current;
        if (!el) return;

        let ro;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => {
                updateScrollMetrics();
            });
            ro.observe(el);
            if (el.firstElementChild) ro.observe(el.firstElementChild);
        }
        return () => {
            if (ro) ro.disconnect();
        };
    }, [filtered, advResults, advOpen, pinned]);

    const handleSuggClick = (cg) => {
        setPinned(cg.code);
        setQuery(cg.code + ' — ' + cg.name);
        setShowSugg(false);
        setAdvQuery(''); setAdvDay(''); setAdvTime('');
    };

    const clearPin = () => {
        setPinned(null);
        setQuery('');
        setAdvQuery(''); setAdvDay(''); setAdvTime('');
    };

    const toggleAdv = () => { setAdvOpen(o => !o); setAdvQuery(''); setAdvDay(''); setAdvTime(''); };

    return (
        <div className="flex flex-col gap-3" ref={wrapRef}>

            {/* ── Catalogue Header ── */}
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-orange-400" />
                    <h2 className="text-sm font-semibold text-white">Course Catalogue</h2>
                </div>
                <button className="text-slate-400 hover:text-white transition-colors">
                    <ChevronUp size={15} />
                </button>
            </div>

            {/* ── Search bar with suggestions ── */}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setPinned(null);          // typing unlocks the pin
                        setShowSugg(true);
                    }}
                    onFocus={() => !pinned && setShowSugg(true)}
                    placeholder="Search by course code or name…"
                    className="
                        w-full pl-9 pr-8 py-2 text-xs
                        bg-[#070914] border border-[#1a1f36]
                        rounded-xl text-slate-200 placeholder-slate-500
                        focus:outline-none focus:border-orange-500/60 focus:bg-[#090c1a]
                        transition-all duration-200
                    "
                />
                {(query || pinned) && (
                    <button
                        onClick={clearPin}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs z-10"
                    >✕</button>
                )}

                {/* Suggestions dropdown */}
                {showSugg && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-[#232b4b] overflow-hidden shadow-2xl animate-fade-in" style={{ background: '#0d1020' }}>
                        {suggestions.map(cg => (
                            <button
                                key={cg.code}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => handleSuggClick(cg)}
                                className="w-full flex flex-col gap-0.5 px-4 py-2 hover:bg-white/5 transition-colors text-left border-b border-[#1a1f36] last:border-b-0"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={12} className="text-orange-400 flex-shrink-0" />
                                        <span className="text-xs font-bold text-white">{cg.code}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">{cg.sections.length} sec</span>
                                </div>
                                <p className="text-[11px] text-slate-400 pl-5">{cg.name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Pinned course indicator */}
            {pinned && (
                <div className="flex items-center gap-2 text-xs text-orange-300 bg-orange-600/10 border border-orange-500/25 rounded-lg px-3 py-1.5">
                    <Pin size={11} />
                    <span className="flex-1 truncate">Showing sections of <strong>{pinned}</strong></span>
                    <button onClick={clearPin} className="text-slate-500 hover:text-white">
                        <X size={11} />
                    </button>
                </div>
            )}

            {/* ── Advanced Search toggle ── */}
            <button
                onClick={toggleAdv}
                className={`
                    flex items-center gap-2 self-start text-xs font-semibold px-3 py-1.5 rounded-lg
                    border transition-all duration-200
                    ${advOpen
                        ? 'bg-[#181d33] border-orange-500/50 text-orange-300'
                        : 'bg-[#111425] border-[#212744] text-slate-300 hover:text-white hover:border-slate-500'}
                `}
            >
                <SlidersHorizontal size={12} />
                Advanced Search
                {advOpen && <X size={11} className="ml-1 opacity-70" />}
            </button>

            {/* ── Advanced panel ── */}
            {advOpen && (
                <div className="rounded-xl border border-[#1a1f36] bg-[#090b16] p-3 flex flex-col gap-2.5 animate-fade-in">
                    <div className="flex gap-2">
                        {[
                            { id: 'faculty', label: 'By Faculty', icon: User },
                            { id: 'time', label: 'By Time', icon: Clock },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setAdvMode(id); setAdvQuery(''); setAdvDay(''); setAdvTime(''); }}
                                className={`
                                    flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
                                    border transition-all duration-150
                                    ${advMode === id
                                        ? 'bg-orange-600 border-orange-500 text-white shadow-sm'
                                        : 'bg-[#101324] border-[#1d233e] text-slate-400 hover:text-white'}
                                `}
                            >
                                <Icon size={11} />{label}
                            </button>
                        ))}
                    </div>

                    {/* Faculty: text input */}
                    {advMode === 'faculty' && (
                        <div className="relative">
                            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                value={advQuery}
                                onChange={e => setAdvQuery(e.target.value)}
                                placeholder="Type faculty name…"
                                autoFocus
                                className="
                                    w-full pl-8 pr-4 py-1.5 text-xs
                                    bg-[#070914] border border-[#1d233e]
                                    rounded-lg text-slate-200 placeholder-slate-500
                                    focus:outline-none focus:border-orange-500/60
                                    transition-all duration-200
                                "
                            />
                            {advQuery && (
                                <button onClick={() => setAdvQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
                            )}
                        </div>
                    )}

                    {/* Time: two dropdowns */}
                    {advMode === 'time' && (
                        <div className="flex gap-2">
                            <CustomSelect
                                value={advDay}
                                onChange={setAdvDay}
                                placeholder="Any Day"
                                icon={Clock}
                                options={uniqueDays.map(d => ({ value: d, label: d.slice(0, 3) }))}
                            />
                            <CustomSelect
                                value={advTime}
                                onChange={setAdvTime}
                                placeholder="Any Time"
                                icon={Clock}
                                options={uniqueTimes.map(t => ({ value: t, label: t }))}
                            />
                        </div>
                    )}

                    {advResults !== null && (
                        <p className="text-[10px] text-slate-500">
                            {advResults.length === 0
                                ? 'No sections match.'
                                : `${advResults.length} section${advResults.length !== 1 ? 's' : ''} found`}
                        </p>
                    )}
                </div>
            )}

            {/* ── Results (hidden while suggestion dropdown is visible) ── */}
            {!(showSugg && suggestions.length > 0) && (
                <div className="flex flex-col flex-1">
                    <div 
                        ref={scrollRef}
                        onScroll={updateScrollMetrics}
                        className="overflow-y-auto max-h-[calc(100vh-340px)] pr-1 custom-scrollbar"
                    >
                        {advOpen && (advMode === 'faculty' ? advQuery : (advDay || advTime)) ? (
                            <AdvancedResults results={advResults} onAddSection={onAddCourse} routine={routine} getExamInfo={getExamInfo} />
                        ) : (
                            <>
                                {!query && !pinned && !advOpen && (
                                    <p className="text-xs text-slate-500 mb-2 font-medium">
                                        Showing {courseList.length} courses — type to search
                                    </p>
                                )}
                                {filtered.length === 0 ? (
                                    <div className="text-center text-slate-500 text-sm py-8">
                                        No courses found for "{query}"
                                    </div>
                                ) : (
                                    filtered.map(cg => (
                                        <CourseItem
                                            key={cg.code}
                                            courseGroup={cg}
                                            onAddSection={onAddCourse}
                                            defaultExpanded={pinned === cg.code}
                                            routine={routine}
                                            getExamInfo={getExamInfo}
                                        />
                                    ))
                                )}
                            </>
                        )}
                    </div>

                    {/* Scroll preview pill bar at bottom */}
                    <div className="mt-2.5 py-1 px-3 bg-[#090b16] border border-[#161a2e] rounded-full flex items-center justify-between text-[11px] text-slate-500 select-none">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-400">Scroll preview</span>
                            <span className="text-[10px] text-amber-400/90 font-mono font-semibold">
                                {Math.round(scrollRatio * 100)}%
                            </span>
                        </div>
                        <div 
                            ref={trackRef}
                            onMouseDown={handleMouseDown}
                            className="w-24 sm:w-28 h-2.5 bg-[#131728] border border-[#1e2338] rounded-full p-0.5 flex items-center cursor-pointer relative overflow-hidden group/track"
                            title="Scroll progress (click or drag to jump)"
                        >
                            <div 
                                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-amber-300 rounded-full transition-all duration-75 relative shadow-[0_0_8px_rgba(245,158,11,0.45)]"
                                style={{
                                    width: `${Math.round(scrollRatio * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
