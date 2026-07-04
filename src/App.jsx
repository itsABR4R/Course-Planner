/**
 * src/App.jsx
 * Main application component — wires together all parts of the Course Planner.
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, GraduationCap, Calendar, Sparkles, X, Download, Github, Wrench, Settings } from 'lucide-react';
import { loadCourseData, groupCoursesByCode } from './utils/parser';
import { useRoutine, getCourseRole } from './hooks/useRoutine';
import CalendarGrid from './components/CalendarGrid';
import CourseSearch from './components/CourseSearch';
import Toast from './components/Toast';
import { toPng } from 'html-to-image';
import { Analytics } from '@vercel/analytics/react';

const DEPARTMENTS = [
    { id: 'BA_ENG', label: 'BA in English', csv: '/BA_ENG_Courses.csv' },
    { id: 'BBA', label: 'BBA', csv: '/BBA_Courses.csv' },
    { id: 'BBA_AIS', label: 'BBA in AIS', csv: '/BBA_AIS_Courses.csv' },
    { id: 'BSBGE', label: 'BSBGE', csv: '/BGE_Courses.csv' },
    { id: 'BSCE', label: 'BSCE', csv: '/CE_Courses.csv' },
    { id: 'BSCSE', label: 'BSCSE', csv: '/CSE_Courses.csv' },
    { id: 'BSDS', label: 'BSDS', csv: '/DS_Courses.csv' },
    { id: 'BSECO', label: 'BSECO', csv: '/ECO_Courses.csv' },
    { id: 'BSEEE', label: 'BSEEE', csv: '/EEE_Courses.csv' },
    { id: 'BSSEDS', label: 'BSSEDS', csv: '/SEDS_Courses.csv' },
    { id: 'BSSMSJ', label: 'BSSMSJ', csv: '/SMSJ_Courses.csv' },
];

export default function App() {
    const [selectedDept, setSelectedDept] = useState('BSCSE');
    const [courseMap, setCourseMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeptDisabled, setIsDeptDisabled] = useState(false);
    const { routine, toast, addCourse, removeCourse, clearRoutine, showToast } = useRoutine();

    // Load CSV whenever selectedDept changes
    useEffect(() => {
        const dept = DEPARTMENTS.find(d => d.id === selectedDept);
        if (!dept || !dept.csv) {
            setCourseMap({});
            setIsDeptDisabled(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsDeptDisabled(false);

        loadCourseData(dept.csv)
            .then(courses => {
                if (courses.length === 0) {
                    setIsDeptDisabled(true);
                } else {
                    setCourseMap(groupCoursesByCode(courses));
                }
                setLoading(false);
            })
            .catch(err => {
                // If it failed to fetch/load because file is not found (status 404/not found)
                if (err.message.includes('404') || err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('failed to load csv')) {
                    setIsDeptDisabled(true);
                } else {
                    setError(err.message);
                }
                setLoading(false);
            });
    }, [selectedDept]);

    const handleAddCourse = (courseEntry) => {
        addCourse({
            code: courseEntry.code,
            name: courseEntry.name,
            section: courseEntry.section,
            faculty: courseEntry.faculty,
            room: courseEntry.room,
            slots: courseEntry.slots,
        });
    };

    const handleSaveImage = () => {
        const node = document.getElementById('weekly-schedule-grid');
        if (!node) return;

        showToast('Generating image...', 'info');

        // We use a small timeout to let the toast render
        setTimeout(() => {
            toPng(node, {
                backgroundColor: '#0a0c1e', // Ensure a solid dark background is baked in
                style: {
                    borderRadius: '16px',
                }
            })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'uiu-schedule.png';
                link.href = dataUrl;
                link.click();
                showToast('Schedule saved as image!', 'success');
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
                showToast('Failed to save schedule as image.', 'error');
            });
        }, 100);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* ── Header ── */}
            <header className="glass-dark border-b border-white/8 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <img 
                            src="https://uiu.ucamcloud.com/assets/uiu-logo.webp" 
                            alt="UIU Logo" 
                            className="h-9 w-auto object-contain flex-shrink-0"
                        />
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">UIU Course Planner</h1>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Routine Maker & Conflict Detector</p>
                        </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest border shadow-lg animate-pulse-glow">
                            Summer-2026
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {routine.length > 0 && (
                            <>
                                <span className="text-xs text-slate-400">
                                    <span className="text-indigo-300 font-semibold">{routine.length}</span> course{routine.length !== 1 ? 's' : ''} added
                                </span>
                                <button
                                    onClick={handleSaveImage}
                                    className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-400/50 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Download size={13} />
                                    Save as Image
                                </button>
                                <button
                                    onClick={clearRoutine}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Trash2 size={13} />
                                    Clear Routine
                                </button>
                            </>
                        )}
                        <a
                            href="https://github.com/itsABR4R"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-all text-[#181717] hover:bg-slate-100 flex-shrink-0"
                            title="View GitHub Profile"
                        >
                            <Github size={30} fill="currentColor" />
                        </a>
                    </div>
                </div>
            </header>

            {/* ── Department Selector ── */}
            <div className="max-w-screen-2xl w-full mx-auto px-4 lg:px-6 pt-4 lg:pt-6">
                <div className="glass-dark rounded-2xl p-2.5 border border-white/8 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                    {DEPARTMENTS.map(dept => {
                        const isActive = selectedDept === dept.id;
                        return (
                            <button
                                key={dept.id}
                                onClick={() => setSelectedDept(dept.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                                    isActive 
                                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10 scale-[1.02]' 
                                        : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                                {dept.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Body ── */}
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 lg:p-6 pt-2 lg:pt-4 flex gap-4 lg:gap-6">

                {/* ── Left Sidebar: Course Search ── */}
                <aside className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">
                    <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <BookOpen size={15} className="text-indigo-400" />
                            <h2 className="text-sm font-semibold text-slate-200">Course Catalogue</h2>
                        </div>

                        {isDeptDisabled ? (
                            <div className="flex flex-col items-center justify-center text-center p-6 py-12 bg-white/[0.01] border border-white/5 rounded-xl animate-fade-in my-auto">
                                <div className="relative w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-6 shadow-inner">
                                    <Wrench className="text-slate-300 w-7 h-7" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center border border-white/10 shadow-md">
                                        <Settings className="text-slate-400 w-3.5 h-3.5 animate-spin-slow" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2">Disabled for {DEPARTMENTS.find(d => d.id === selectedDept)?.label || selectedDept}</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                                    Courses & Faculties is currently disabled for this department. If UCAM Cloud updates than this will too be updated soon.
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                                <p className="text-xs text-slate-500">Loading schedule…</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-red-400">Failed to load schedule</p>
                                <p className="text-xs text-slate-500 mt-1">{error}</p>
                            </div>
                        ) : (
                            <CourseSearch courseMap={courseMap} onAddCourse={handleAddCourse} routine={routine} />
                        )}
                    </div>
                </aside>

                {/* ── Main Content: Routine Grid + Added list ── */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* Routine summary chips */}
                    {routine.length > 0 && (
                        <div className="glass rounded-xl border border-white/10 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={13} className="text-indigo-400" />
                                <span className="text-xs font-semibold text-slate-300">Selected Courses</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {routine.map(entry => {
                                    const roleInfo = getCourseRole(entry, routine);
                                    const isBackup = roleInfo.type === 'backup';
                                    const isChoice = roleInfo.type === 'choice';

                                    let chipBg = entry.color.bg;
                                    let chipBorder = `1px solid ${entry.color.border}`;
                                    let chipOpacity = 1;

                                    if (isBackup) {
                                         chipBg = 'rgba(30, 41, 59, 0.75)';
                                         chipBorder = `1.5px dashed ${entry.color.border}`;
                                         chipOpacity = 1.0;
                                    } else if (isChoice) {
                                         chipBg = 'rgba(30, 41, 59, 0.6)';
                                         chipBorder = `1.5px dotted ${entry.color.border}`;
                                         chipOpacity = 0.95;
                                    }

                                    return (
                                        <div
                                            key={entry.id}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white font-medium relative"
                                            style={{
                                                background: chipBg,
                                                border: chipBorder,
                                                opacity: chipOpacity,
                                            }}
                                        >
                                            {/* Tint overlay for backup/choice chips */}
                                            {(isBackup || isChoice) && (
                                                <div 
                                                    className="absolute inset-0 rounded-full pointer-events-none" 
                                                    style={{ 
                                                        background: entry.color.bg, 
                                                        opacity: isBackup ? 0.28 : 0.3 
                                                    }} 
                                                />
                                            )}
                                            <span className="relative z-10">{entry.code}</span>
                                            <span className="opacity-70 relative z-10">§{entry.section}</span>
                                            {isBackup && (
                                                <span
                                                    className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider relative z-10 text-white"
                                                    style={{ 
                                                        background: '#ef4444',
                                                        boxShadow: '0 0 6px rgba(239, 68, 68, 0.3)'
                                                    }}
                                                >
                                                    BK
                                                </span>
                                            )}
                                            {isChoice && (
                                                <span
                                                    className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider relative z-10"
                                                    style={{ 
                                                        background: roleInfo.level === 2 ? '#06b6d4' : '#d946ef', 
                                                        color: roleInfo.level === 2 ? '#000' : '#fff' 
                                                    }}
                                                >
                                                    {roleInfo.shortLabel}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => removeCourse(entry.id)}
                                                className="ml-0.5 hover:opacity-100 opacity-60 transition-opacity relative z-10"
                                            >
                                                <X size={11} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Calendar Grid */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={15} className="text-indigo-400" />
                            <h2 className="text-sm font-semibold text-slate-200">Weekly Schedule</h2>
                            <span className="text-xs text-slate-600">(Sat – Wed · 08:30 – 16:30)</span>
                        </div>

                        {routine.length === 0 ? (
                            <div className="glass rounded-2xl border border-white/10 border-dashed flex flex-col items-center justify-center py-24 gap-3">
                                <Calendar size={36} className="text-slate-700" />
                                <p className="text-slate-500 text-sm font-medium">Your routine is empty</p>
                                <p className="text-slate-600 text-xs">Search for a course on the left and add sections to fill your week</p>
                            </div>
                        ) : (
                            <CalendarGrid 
                                routine={routine} 
                                onRemoveCourse={removeCourse} 
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* ── Toast ── */}
            <Toast toast={toast} onDismiss={() => { }} />
            
            {/* ── Vercel Analytics ── */}
            <Analytics />
        </div>
    );
}
