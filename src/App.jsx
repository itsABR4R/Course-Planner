/**
 * src/App.jsx
 * Main application component — wires together all parts of the Course Planner.
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, GraduationCap, Calendar, Sparkles, X, Download, Github, Wrench, Settings, RotateCcw, AlertCircle } from 'lucide-react';
import { loadCourseData, groupCoursesByCode } from './utils/parser';
import { useRoutine, getCourseRole, entriesOverlap } from './hooks/useRoutine';
import CalendarGrid from './components/CalendarGrid';
import CourseSearch from './components/CourseSearch';
import Toast from './components/Toast';
import { toPng } from 'html-to-image';
import { Analytics } from '@vercel/analytics/react';

// Import exam data JSON files
import baengExams from '../departments/baeng.json';
import bbaExams from '../departments/bba.json';
import bbaaisExams from '../departments/bbaais.json';
import bsbgeExams from '../departments/bsbge.json';
import ceExams from '../departments/ce.json';
import cseExams from '../departments/cse.json';
import bsdsExams from '../departments/bsds.json';
import bsecoExams from '../departments/bseco.json';
import eeeExams from '../departments/eee.json';
import bssedsExams from '../departments/bsseds.json';
import bssmsjExams from '../departments/bssmsj.json';

const EXAM_DATA_MAP = {
    BA_ENG: baengExams,
    BBA: bbaExams,
    BBA_AIS: bbaaisExams,
    BSBGE: bsbgeExams,
    BSCE: ceExams,
    BSCSE: cseExams,
    BSDS: bsdsExams,
    BSECO: bsecoExams,
    BSEEE: eeeExams,
    BSSEDS: bssedsExams,
    BSSMSJ: bssmsjExams,
};

function getExamInfo(courseCode, selectedDept) {
    if (!courseCode) return null;
    const cleanCode = courseCode.replace(/\s+/g, '').toLowerCase();

    // 1. Try selected department first
    const selectedData = EXAM_DATA_MAP[selectedDept];
    if (selectedData && selectedData.courses) {
        const match = selectedData.courses.find(c => c.code.replace(/\s+/g, '').toLowerCase() === cleanCode);
        if (match && match.day !== 'N/A' && match.slot !== 'N/A') {
            return match;
        }
    }

    // 2. Fallback: Try all other departments
    for (const deptId of Object.keys(EXAM_DATA_MAP)) {
        if (deptId === selectedDept) continue;
        const data = EXAM_DATA_MAP[deptId];
        if (data && data.courses) {
            const match = data.courses.find(c => c.code.replace(/\s+/g, '').toLowerCase() === cleanCode);
            if (match && match.day !== 'N/A' && match.slot !== 'N/A') {
                return match;
            }
        }
    }
    return null;
}

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
    const [mobileTab, setMobileTab] = useState('catalogue'); // 'catalogue' or 'schedule'
    const [courseMap, setCourseMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeptDisabled, setIsDeptDisabled] = useState(false);
    const [plannerMode, setPlannerMode] = useState('backup'); // 'backup' or 'conflict'
    const { routine, setRoutine, toast, addCourse, removeCourse, clearRoutine, showToast } = useRoutine();

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
        if (plannerMode === 'conflict') {
            // Check for time slot overlap with any course already in the routine
            for (const entry of routine) {
                // Skip if same course section is already added (handled separately by useRoutine)
                if (entry.code === courseEntry.code && entry.section === courseEntry.section) {
                    continue;
                }
                for (const newSlot of courseEntry.slots) {
                    for (const existingSlot of entry.slots) {
                        if (newSlot.day === existingSlot.day) {
                            const overlap = Math.max(newSlot.startMin, existingSlot.startMin) < Math.min(newSlot.endMin, existingSlot.endMin);
                            if (overlap) {
                                const dayStr = newSlot.day;
                                const timeStr = `${existingSlot.startStr}-${existingSlot.endStr}`;
                                showToast(
                                    `Conflict: ${courseEntry.code} Sec ${courseEntry.section} overlaps with ${entry.code} Sec ${entry.section} on ${dayStr} (${timeStr})`, 
                                    'error'
                                );
                                return; // Stop and do not add
                            }
                        }
                    }
                }
            }
        }

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

    // Calculate the exam schedule grid data and identify conflicts & warnings
    const examGrid = {};
    let hasExamConflict = false;
    let hasExamWarning = false;
    const conflictSlots = {};
    const warningDays = {};

    for (let d = 1; d <= 7; d++) {
        examGrid[`Day ${d}`] = { T1: [], T2: [], T3: [] };
    }

    routine.forEach(entry => {
        const exam = getExamInfo(entry.code, selectedDept);
        if (exam && exam.day !== 'N/A' && exam.slot !== 'N/A') {
            const dayKey = exam.day;
            const slotKey = exam.slot;
            if (examGrid[dayKey] && examGrid[dayKey][slotKey]) {
                if (!examGrid[dayKey][slotKey].some(c => c.code === entry.code)) {
                    examGrid[dayKey][slotKey].push({
                        code: entry.code,
                        title: exam.shortName || exam.title || entry.name
                    });
                }
            }
        }
    });

    for (let d = 1; d <= 7; d++) {
        const dayKey = `Day ${d}`;
        const t1Count = examGrid[dayKey].T1.length;
        const t2Count = examGrid[dayKey].T2.length;
        const t3Count = examGrid[dayKey].T3.length;
        const totalOnDay = t1Count + t2Count + t3Count;

        if (t1Count >= 2) { hasExamConflict = true; conflictSlots[dayKey] = { ...conflictSlots[dayKey], T1: true }; }
        if (t2Count >= 2) { hasExamConflict = true; conflictSlots[dayKey] = { ...conflictSlots[dayKey], T2: true }; }
        if (t3Count >= 2) { hasExamConflict = true; conflictSlots[dayKey] = { ...conflictSlots[dayKey], T3: true }; }

        if (totalOnDay >= 2) {
            hasExamWarning = true;
            warningDays[dayKey] = true;
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* ── Header ── */}
            <header className="glass-dark border-b border-white/8 px-4 md:px-6 py-3.5 md:py-4 sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between relative">
                    <div className="flex items-center gap-2.5 md:gap-3">
                        <img 
                            src="https://uiu.ucamcloud.com/assets/uiu-logo.webp" 
                            alt="UIU Logo" 
                            className="h-8 md:h-9 w-auto object-contain flex-shrink-0"
                        />
                        <div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <h1 className="text-sm md:text-base font-bold text-white leading-tight">UIU Course Planner</h1>
                                <span className="md:hidden text-[7px] font-black px-1.5 py-0.5 rounded-full border animate-pulse-glow flex-shrink-0">
                                    Summer-2026
                                </span>
                            </div>
                            <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight mt-0.5">Routine Maker & Conflict Detector</p>
                        </div>
                    </div>

                    {/* Absolute Centered Semester Label */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                        <span className="text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest border shadow-lg animate-pulse-glow">
                            Summer-2026
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {routine.length > 0 && (
                            <>
                                <span className="text-xs text-slate-400 hidden lg:inline">
                                    <span className="text-indigo-300 font-semibold">{routine.length}</span> course{routine.length !== 1 ? 's' : ''} added
                                </span>
                                <button
                                    onClick={handleSaveImage}
                                    className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-400/50 px-2.5 py-1.5 md:px-3 rounded-lg transition-all"
                                    title="Save schedule as image"
                                >
                                    <Download size={13} />
                                    <span className="hidden sm:inline">Save as Image</span>
                                </button>
                                <button
                                    onClick={clearRoutine}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 px-2.5 py-1.5 md:px-3 rounded-lg transition-all"
                                    title="Clear routine"
                                >
                                    <Trash2 size={13} />
                                    <span className="hidden sm:inline">Clear Routine</span>
                                </button>
                            </>
                        )}
                        <a
                            href="https://github.com/itsABR4R"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-all text-[#181717] hover:bg-slate-100 flex-shrink-0"
                            title="View GitHub Profile"
                        >
                            <Github className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" fill="currentColor" />
                        </a>
                    </div>
                </div>
            </header>

            {/* ── Department Selector & Mode Toggle ── */}
            <div className="max-w-screen-2xl w-full mx-auto px-4 lg:px-6 pt-4 lg:pt-6 relative z-30">
                <div className="glass-dark rounded-2xl p-2.5 border border-white/8 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    {/* Left: Department Tabs (scrollable) */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 w-full">
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

                    {/* Divider line (desktop only) */}
                    <div className="hidden md:block w-px h-6 bg-white/10 flex-shrink-0" />

                    {/* Right: Mode Toggle */}
                    <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5 flex-shrink-0 self-start md:self-auto gap-1">
                        
                        {/* Backup Mode Tooltip Wrapper */}
                        <div className="relative group">
                            <button
                                onClick={() => setPlannerMode('backup')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                    plannerMode === 'backup'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Backup Mode
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-slate-900 border border-white/10 rounded-lg shadow-xl text-[10px] text-slate-300 leading-normal invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-250 z-50 pointer-events-none text-center">
                                <span className="font-bold text-white block mb-0.5">Backup Mode</span>
                                Allows course overlaps. Ideal for planning alternative sections or schedules.
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
                            </div>
                        </div>

                        {/* Conflict Mode Tooltip Wrapper */}
                        <div className="relative group">
                            <button
                                onClick={() => {
                                    setPlannerMode('conflict');
                                    const keptEntries = [];
                                    const removedEntries = [];

                                    for (const entry of routine) {
                                        let hasConflict = false;
                                        for (const kept of keptEntries) {
                                            if (entriesOverlap(entry, kept)) {
                                                hasConflict = true;
                                                break;
                                            }
                                        }
                                        if (hasConflict) {
                                            removedEntries.push(entry);
                                        } else {
                                            keptEntries.push(entry);
                                        }
                                    }

                                    if (removedEntries.length > 0) {
                                        setRoutine(keptEntries);
                                        const removedNames = removedEntries.map(e => `${e.code} Sec ${e.section}`).join(', ');
                                        showToast(`Conflict Mode: Removed overlapping sections: ${removedNames}`, 'warning');
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                    plannerMode === 'conflict'
                                        ? 'bg-red-600/90 text-white shadow-sm shadow-red-900/20'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Conflict Mode
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2.5 bg-slate-900 border border-white/10 rounded-lg shadow-xl text-[10px] text-slate-300 leading-normal invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-250 z-50 pointer-events-none text-center">
                                <span className="font-bold text-red-400 block mb-0.5">Conflict Mode</span>
                                Prevents overlapping courses. Automatically drops any clashing sections.
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Mobile Tab Switcher (visible only under lg) */}
            <div className="flex lg:hidden w-full px-4 pt-3 gap-2 max-w-screen-2xl mx-auto">
                <button
                    onClick={() => setMobileTab('catalogue')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                        mobileTab === 'catalogue'
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400'
                    }`}
                >
                    <BookOpen size={14} />
                    Course Catalogue
                </button>
                <button
                    onClick={() => setMobileTab('schedule')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all border relative ${
                        mobileTab === 'schedule'
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                            : 'bg-white/5 border-white/5 text-slate-400'
                    }`}
                >
                    <Calendar size={14} />
                    Weekly Schedule
                    {routine.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border border-[#050814] animate-scale-in">
                            {routine.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Body ── */}
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 lg:p-6 pt-2 lg:pt-4 flex flex-col lg:flex-row gap-4 lg:gap-6">

                {/* ── Left Sidebar: Course Search ── */}
                <aside className={`w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 ${mobileTab === 'catalogue' ? 'block' : 'hidden lg:block'}`}>
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
                            <CourseSearch courseMap={courseMap} onAddCourse={handleAddCourse} routine={routine} getExamInfo={(code) => getExamInfo(code, selectedDept)} />
                        )}
                    </div>
                </aside>

                {/* ── Main Content: Routine Grid + Added list ── */}
                <div className={`flex-1 flex flex-col gap-4 min-w-0 ${mobileTab === 'schedule' ? 'block' : 'hidden lg:block'}`}>

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
                                getExamInfo={(code) => getExamInfo(code, selectedDept)}
                            />
                        )}
                    </div>

                    {/* Exam Schedule */}
                    <div className="flex flex-col gap-3 mt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={15} className="text-indigo-400" />
                                <h2 className="text-sm font-semibold text-slate-200">Exam Schedule</h2>
                            </div>
                            {routine.length > 0 && (
                                <button
                                    onClick={clearRoutine}
                                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-all font-bold hover:scale-[1.02]"
                                >
                                    <RotateCcw size={12} />
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Warnings / Conflicts Alert Box */}
                        {hasExamConflict && (
                            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-left animate-fade-in">
                                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0">
                                    <X size={12} strokeWidth={3} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-400">Conflict Detected</h4>
                                    <p className="text-xs text-red-500/80">Exams scheduled at the exact same time!</p>
                                </div>
                            </div>
                        )}

                        {hasExamWarning && (
                            <div className="flex items-center gap-3 p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-xl text-left animate-fade-in">
                                <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-white flex-shrink-0">
                                    <AlertCircle size={14} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-400">Warning</h4>
                                    <p className="text-xs text-yellow-500/80">Multiple exams on the same day!</p>
                                </div>
                            </div>
                        )}

                        <div className="w-full overflow-x-auto rounded-2xl border border-white/10 no-scrollbar glass">
                            <div 
                                className="grid text-slate-300"
                                style={{
                                    gridTemplateColumns: '90px repeat(3, minmax(180px, 1fr))',
                                    gridTemplateRows: 'auto repeat(7, minmax(90px, auto))',
                                    minWidth: '640px',
                                }}
                            >
                                {/* Header Row */}
                                <div className="py-4 px-3 text-center border-r border-b border-white/10 bg-white/5 font-semibold text-slate-400 text-xs uppercase tracking-wider flex items-center justify-center">
                                    Day
                                </div>
                                <div className="py-3 px-3 text-center border-r border-b border-white/10 bg-white/5 font-semibold text-slate-300 text-xs flex flex-col justify-center">
                                    <span className="font-bold">Slot T1</span>
                                    <span className="text-[10px] text-amber-500/80 font-medium mt-0.5">09:00 - 11:00</span>
                                </div>
                                <div className="py-3 px-3 text-center border-r border-b border-white/10 bg-white/5 font-semibold text-slate-300 text-xs flex flex-col justify-center">
                                    <span className="font-bold">Slot T2</span>
                                    <span className="text-[10px] text-amber-500/80 font-medium mt-0.5">11:30 - 13:30</span>
                                </div>
                                <div className="py-3 px-3 text-center border-b border-white/10 bg-white/5 font-semibold text-slate-300 text-xs flex flex-col justify-center">
                                    <span className="font-bold">Slot T3</span>
                                    <span className="text-[10px] text-amber-500/80 font-medium mt-0.5">14:00 - 16:00</span>
                                </div>

                                {/* Data Rows */}
                                {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                                    const dayKey = `Day ${dayNum}`;
                                    return (
                                        <React.Fragment key={dayNum}>
                                            {/* Day Label */}
                                            <div className="py-4 px-3 text-center border-r border-b border-white/10 bg-white/[0.02] font-semibold text-slate-300 text-xs flex items-center justify-center">
                                                Day {dayNum}
                                            </div>
                                            
                                            {/* Slots */}
                                            {['T1', 'T2', 'T3'].map((slotKey, idx) => {
                                                const courses = examGrid[dayKey][slotKey];
                                                const isConflict = conflictSlots[dayKey]?.[slotKey];
                                                const isWarning = warningDays[dayKey] && courses.length > 0;
                                                
                                                let highlightStyle = {};
                                                if (isConflict) {
                                                    highlightStyle = { border: '2px solid #ef4444', zIndex: 10 };
                                                } else if (isWarning) {
                                                    highlightStyle = { border: '2px solid #eab308', zIndex: 10 };
                                                }

                                                return (
                                                    <div
                                                        key={slotKey}
                                                        className={`p-2 bg-slate-950/10 flex flex-col justify-center gap-1.5 min-h-[90px] relative`}
                                                        style={{
                                                            ...highlightStyle,
                                                            borderRight: (isConflict || isWarning) ? '2px solid' : (idx === 2 ? 'none' : '1px solid rgba(255,255,255,0.1)'),
                                                            borderBottom: (isConflict || isWarning) ? '2px solid' : '1px solid rgba(255,255,255,0.1)',
                                                            borderColor: isConflict ? '#ef4444' : isWarning ? '#eab308' : undefined,
                                                        }}
                                                    >
                                                        {courses.map((course, cIdx) => (
                                                            <div
                                                                key={cIdx}
                                                                className="bg-orange-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-sm flex flex-col items-start gap-0.5 border border-orange-700/40 select-none animate-scale-in"
                                                            >
                                                                <span className="font-extrabold">{course.code}:</span>
                                                                <span className="opacity-90 font-medium leading-none">{course.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
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
