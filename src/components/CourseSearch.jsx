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
    User, MapPin, Clock, SlidersHorizontal, X, Pin, Check,
} from 'lucide-react';

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
                    px-3 py-2 text-sm rounded-lg border
                    transition-all duration-200
                    ${open
                        ? 'bg-violet-600/20 border-violet-500/70 text-white'
                        : 'bg-white/5 border-violet-500/30 text-slate-300 hover:border-violet-500/60 hover:bg-white/8'}
                `}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon size={12} className="text-slate-400 flex-shrink-0" />}
                    <span className={`truncate text-sm font-medium ${value ? 'text-white' : 'text-slate-400'}`}>
                        {label}
                    </span>
                </div>
                {open
                    ? <ChevronUp size={13} className="text-violet-400 flex-shrink-0" />
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
                        background: '#0f1322',
                    }}
                    className="rounded-xl border border-violet-500/25 overflow-hidden shadow-2xl animate-fade-in"
                >
                    {/* "Any" option */}
                    <button
                        type="button"
                        onClick={() => { onChange(''); setOpen(false); }}
                        className={`
                            w-full flex items-center justify-between px-3 py-2.5 text-sm
                            transition-colors duration-100
                            ${!value ? 'text-violet-300 bg-violet-600/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'}
                        `}
                    >
                        <span className="italic">{placeholder}</span>
                        {!value && <Check size={12} className="text-violet-400" />}
                    </button>
                    <div className="border-t border-white/8" />
                    {/* Options list */}
                    <div className="max-h-52 overflow-y-auto">
                        {options.map(opt => (
                            <button
                                type="button"
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2 text-sm
                                    transition-colors duration-100
                                    ${value === opt.value
                                        ? 'text-violet-300 bg-violet-600/20 font-semibold'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                                `}
                            >
                                <span>{opt.label}</span>
                                {value === opt.value && <Check size={12} className="text-violet-400" />}
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
function SectionRow({ courseCode, courseName, section, onAdd, showCourseName = false }) {
    const hasTBA = !section.slots || section.slots.length === 0;

    return (
        <div
            className={`
                flex items-center justify-between px-3 py-2 rounded-lg
                transition-all duration-150 group
                ${hasTBA
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-white/10 hover:border-white/20 border border-transparent'}
            `}
            onClick={() => !hasTBA && onAdd(section)}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-indigo-300 w-8 flex-shrink-0">
                    {section.section}
                </span>
                <div className="min-w-0">
                    {showCourseName && (
                        <p className="text-[10px] font-semibold text-indigo-400 truncate">
                            {courseCode} — {courseName}
                        </p>
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
                <button className="
                    ml-2 flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-lg
                    bg-indigo-600/30 text-indigo-300 border border-indigo-500/30
                    group-hover:bg-indigo-600 group-hover:text-white
                    transition-all duration-150
                ">
                    Add
                </button>
            )}
        </div>
    );
}

/* ─── Collapsible course item ─── */
function CourseItem({ courseGroup, onAddSection, defaultExpanded = false }) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    // If defaultExpanded flips (e.g. suggestion selected), sync state
    useEffect(() => { setExpanded(defaultExpanded); }, [defaultExpanded]);

    return (
        <div className="glass rounded-xl overflow-hidden border border-white/10 mb-2">
            <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                onClick={() => setExpanded(p => !p)}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <BookOpen size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-indigo-300">{courseGroup.code}</span>
                        <span className="text-xs text-slate-500">({courseGroup.sections.length} sections)</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{courseGroup.name}</p>
                </div>
                {expanded
                    ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0 ml-2" />
                    : <ChevronDown size={15} className="text-slate-400 flex-shrink-0 ml-2" />}
            </button>
            {expanded && (
                <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-1 animate-fade-in">
                    {courseGroup.sections.map((sec) => (
                        <SectionRow
                            key={sec.section}
                            courseCode={courseGroup.code}
                            courseName={courseGroup.name}
                            section={sec}
                            onAdd={() => onAddSection({ ...courseGroup, ...sec })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Advanced flat results ─── */
function AdvancedResults({ results, onAddSection }) {
    if (results === null) return null;
    if (results.length === 0) {
        return <div className="text-center text-slate-500 text-sm py-8">No sections found.</div>;
    }
    return (
        <div className="space-y-1 animate-fade-in">
            {results.map(({ courseGroup, section }, i) => (
                <div key={i} className="glass rounded-xl overflow-hidden border border-white/10">
                    <SectionRow
                        courseCode={courseGroup.code}
                        courseName={courseGroup.name}
                        section={section}
                        showCourseName={true}
                        onAdd={() => onAddSection({ ...courseGroup, ...section })}
                    />
                </div>
            ))}
        </div>
    );
}

/* ─── Main export ─── */
export default function CourseSearch({ courseMap, onAddCourse }) {
    const [query, setQuery] = useState('');
    const [showSugg, setShowSugg] = useState(false);
    const [pinned, setPinned] = useState(null); // pinned course code (from suggestion click)

    const [advOpen, setAdvOpen] = useState(false);
    const [advMode, setAdvMode] = useState('faculty');
    const [advQuery, setAdvQuery] = useState('');   // faculty text
    const [advDay, setAdvDay] = useState('');   // time: day filter
    const [advTime, setAdvTime] = useState('');   // time: slot filter

    const wrapRef = useRef(null);

    const courseList = useMemo(() => Object.values(courseMap), [courseMap]);

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
        const days = new Set();
        for (const cg of filtered)
            for (const sec of cg.sections)
                for (const s of sec.slots) days.add(s.day);
        // desired order
        const ORDER = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        return ORDER.filter(d => days.has(d));
    }, [filtered]);

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

            {/* ── Search bar with suggestions ── */}
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
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
                        w-full pl-9 pr-8 py-2.5 text-sm
                        bg-white/5 border border-white/10
                        rounded-xl text-slate-200 placeholder-slate-500
                        focus:outline-none focus:border-indigo-500/60 focus:bg-white/8
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
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-white/15 overflow-hidden shadow-2xl animate-fade-in" style={{ background: '#151a2d' }}>
                        {suggestions.map(cg => (
                            <button
                                key={cg.code}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => handleSuggClick(cg)}
                                className="w-full flex flex-col gap-0.5 px-4 py-2.5 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-b-0"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={12} className="text-indigo-400 flex-shrink-0" />
                                        <span className="text-sm font-bold text-indigo-300">{cg.code}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">{cg.sections.length} sec</span>
                                </div>
                                <p className="text-xs text-slate-400 pl-5">{cg.name}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Pinned course indicator */}
            {pinned && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-600/15 border border-indigo-500/25 rounded-lg px-3 py-1.5">
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
                        ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}
                `}
            >
                <SlidersHorizontal size={12} />
                Advanced Search
                {advOpen && <X size={11} className="ml-1 opacity-70" />}
            </button>

            {/* ── Advanced panel ── */}
            {advOpen && (
                <div className="glass rounded-xl border border-violet-500/20 p-3 flex flex-col gap-3 animate-fade-in">
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
                                        ? 'bg-violet-600 border-violet-500 text-white'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}
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
                                    w-full pl-8 pr-4 py-2 text-sm
                                    bg-white/5 border border-violet-500/30
                                    rounded-lg text-slate-200 placeholder-slate-500
                                    focus:outline-none focus:border-violet-500/70
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
                <div className="overflow-y-auto max-h-[calc(100vh-300px)] pr-1">
                    {advOpen && (advMode === 'faculty' ? advQuery : (advDay || advTime)) ? (
                        <AdvancedResults results={advResults} onAddSection={onAddCourse} />
                    ) : (
                        <>
                            {!query && !pinned && !advOpen && (
                                <p className="text-xs text-slate-600 mb-2">
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
                                    />
                                ))
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
