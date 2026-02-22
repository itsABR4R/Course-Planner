/**
 * src/components/CourseSearch.jsx
 *
 * Searchable course finder with section selector.
 * - Type a course code or name to filter courses
 * - Click a result to expand its available sections
 * - Click a section to add it to the routine
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, BookOpen, User, MapPin, Clock } from 'lucide-react';

function SectionRow({ section, onAdd }) {
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

function CourseItem({ courseGroup, onAddSection }) {
    const [expanded, setExpanded] = useState(false);

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
                    : <ChevronDown size={15} className="text-slate-400 flex-shrink-0 ml-2" />
                }
            </button>

            {expanded && (
                <div className="border-t border-white/10 px-3 pb-3 pt-2 space-y-1 animate-fade-in">
                    {courseGroup.sections.map((sec) => (
                        <SectionRow
                            key={sec.section}
                            section={sec}
                            onAdd={() => onAddSection({ ...courseGroup, ...sec })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CourseSearch({ courseMap, onAddCourse }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const courseList = useMemo(() => Object.values(courseMap), [courseMap]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return courseList.slice(0, 30); // show first 30 by default
        return courseList.filter(c =>
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [query, courseList]);

    return (
        <div className="flex flex-col gap-3">
            {/* Search input */}
            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by course code or name…"
                    className="
            w-full pl-9 pr-4 py-2.5 text-sm
            bg-white/5 border border-white/10
            rounded-xl text-slate-200 placeholder-slate-500
            focus:outline-none focus:border-indigo-500/60 focus:bg-white/8
            transition-all duration-200
          "
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
                {filtered.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-8">
                        No courses found for "{query}"
                    </div>
                ) : (
                    <>
                        {!query && (
                            <p className="text-xs text-slate-600 mb-2">
                                Showing {courseList.length} courses — type to search
                            </p>
                        )}
                        {filtered.map(cg => (
                            <CourseItem
                                key={cg.code}
                                courseGroup={cg}
                                onAddSection={onAddCourse}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
