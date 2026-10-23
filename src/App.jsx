/**
 * src/App.jsx
 * Main application component — wires together all parts of the Course Planner.
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
    BookOpen, Trash2, GraduationCap, Calendar, Sparkles, X, Download, Github, 
    Wrench, Settings, RotateCcw, AlertCircle, AlertTriangle, UploadCloud, 
    Plus, ArrowRight, FileSpreadsheet 
} from 'lucide-react';
import { loadCourseData, groupCoursesByCode, parseCSVText } from './utils/parser';
import { useRoutine, getCourseRole, entriesOverlap } from './hooks/useRoutine';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import CalendarGrid from './components/CalendarGrid';
import CourseSearch from './components/CourseSearch';
import EmptyScheduleState from './components/EmptyScheduleState';
import Toast from './components/Toast';
import UploadCSVModal from './components/UploadCSVModal';
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
    { id: 'BA_ENG', label: 'BA in English' },
    { id: 'BBA', label: 'BBA' },
    { id: 'BBA_AIS', label: 'BBA in AIS' },
    { id: 'BSBGE', label: 'BSBGE' },
    { id: 'BSCE', label: 'BSCE' },
    { id: 'BSCSE', label: 'BSCSE', csv: '/CSE_Courses.csv' },
    { id: 'BSDS', label: 'BSDS' },
    { id: 'BSECO', label: 'BSECO' },
    { id: 'BSEEE', label: 'BSEEE' },
    { id: 'BSSEDS', label: 'BSSEDS' },
    { id: 'BSSMSJ', label: 'BSSMSJ' },
];

export default function App() {
    useAutoUpdate();

    const [selectedDept, setSelectedDept] = useState(() => {
        try {
            const saved = localStorage.getItem('uiu_selected_dept');
            return saved && DEPARTMENTS.some(d => d.id === saved) ? saved : 'BSCSE';
        } catch {
            return 'BSCSE';
        }
    });
    const [mobileTab, setMobileTab] = useState('catalogue'); // 'catalogue' or 'schedule'
    const [courseMap, setCourseMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [plannerMode, setPlannerMode] = useState(() => {
        try {
            const saved = localStorage.getItem('uiu_planner_mode');
            return saved === 'conflict' || saved === 'backup' ? saved : 'backup';
        } catch {
            return 'backup';
        }
    });
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [modalShowDeptSelect, setModalShowDeptSelect] = useState(false);
    const [deptDragOver, setDeptDragOver] = useState(false);
    const deptFileInputRef = useRef(null);

    // Persist selectedDept and plannerMode across reloads
    useEffect(() => {
        try {
            localStorage.setItem('uiu_selected_dept', selectedDept);
        } catch {}
    }, [selectedDept]);

    useEffect(() => {
        try {
            localStorage.setItem('uiu_planner_mode', plannerMode);
        } catch {}
    }, [plannerMode]);

    const [deptCSVs, setDeptCSVs] = useState(() => {
        try {
            const saved = localStorage.getItem('uiu_dept_csvs');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const { routine, setRoutine, toast, addCourse, removeCourse, clearRoutine, showToast } = useRoutine();

    const isAwaitingCSV = selectedDept !== 'BSCSE' && (!deptCSVs[selectedDept] || Object.keys(courseMap).length === 0);

    // Clean up legacy custom CSV from earlier versions
    useEffect(() => {
        try {
            localStorage.removeItem('uiu_custom_course_csv');
        } catch {}
    }, []);

    const handleDeptCSVUpload = async (deptId, fileOrText, filename) => {
        try {
            let text = typeof fileOrText === 'string' ? fileOrText : await fileOrText.text();
            const name = filename || fileOrText.name || `${deptId}_Courses.csv`;
            const courses = await parseCSVText(text);
            if (!courses || courses.length === 0) {
                showToast('No valid course entries found in CSV', 'error');
                return;
            }
            const grouped = groupCoursesByCode(courses);
            const dataObj = {
                filename: name,
                courses,
                count: Object.keys(grouped).length,
                totalSections: courses.length,
                uploadedAt: new Date().toISOString()
            };
            const newDeptCSVs = {
                ...deptCSVs,
                [deptId]: dataObj
            };
            setDeptCSVs(newDeptCSVs);
            try {
                localStorage.setItem('uiu_dept_csvs', JSON.stringify(newDeptCSVs));
            } catch (e) {
                console.warn('LocalStorage save failed:', e);
            }
            if (selectedDept === deptId) {
                setCourseMap(grouped);
            } else {
                setSelectedDept(deptId);
            }
            setError(null);
            setLoading(false);
            showToast(`Loaded ${Object.keys(grouped).length} courses for ${DEPARTMENTS.find(d => d.id === deptId)?.label || deptId}!`, 'success');
        } catch (err) {
            showToast('Failed to parse CSV: ' + err.message, 'error');
        }
    };

    const handleClearDeptCSV = (deptId) => {
        const newDeptCSVs = { ...deptCSVs };
        delete newDeptCSVs[deptId];
        setDeptCSVs(newDeptCSVs);
        try {
            localStorage.setItem('uiu_dept_csvs', JSON.stringify(newDeptCSVs));
        } catch {}

        if (deptId === 'BSCSE') {
            setLoading(true);
            setError(null);
            loadCourseData('/CSE_Courses.csv')
                .then(courses => {
                    setCourseMap(groupCoursesByCode(courses));
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
            showToast('Reset BSCSE to official course catalog', 'info');
        } else {
            if (selectedDept === deptId) {
                setCourseMap({});
            }
            showToast(`Removed custom routine for ${DEPARTMENTS.find(d => d.id === deptId)?.label || deptId}`, 'info');
        }
    };

    const handleUploadSuccess = (courses, filename, targetDept) => {
        const deptId = targetDept || selectedDept;
        const grouped = groupCoursesByCode(courses);
        const dataObj = {
            filename,
            count: Object.keys(grouped).length,
            totalSections: courses.length,
            courses,
            uploadedAt: new Date().toISOString(),
        };
        const newDeptCSVs = {
            ...deptCSVs,
            [deptId]: dataObj
        };
        setDeptCSVs(newDeptCSVs);
        try {
            localStorage.setItem('uiu_dept_csvs', JSON.stringify(newDeptCSVs));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }

        if (selectedDept === deptId) {
            setCourseMap(grouped);
        } else {
            setSelectedDept(deptId);
        }
        setLoading(false);
        setError(null);
        showToast(`Loaded ${Object.keys(grouped).length} courses into ${DEPARTMENTS.find(d => d.id === deptId)?.label || deptId}!`, 'success');
    };

    // Global drag & drop for CSV file anywhere onto the page
    useEffect(() => {
        const handleWindowDragOver = (e) => {
            if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
                e.preventDefault();
            }
        };

        const handleWindowDrop = async (e) => {
            const files = e.dataTransfer.files;
            if (!files || files.length === 0) return;
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
                e.preventDefault();
                try {
                    handleDeptCSVUpload(selectedDept, file, file.name);
                } catch (err) {
                    setIsUploadModalOpen(true);
                }
            }
        };

        window.addEventListener('dragover', handleWindowDragOver);
        window.addEventListener('drop', handleWindowDrop);
        return () => {
            window.removeEventListener('dragover', handleWindowDragOver);
            window.removeEventListener('drop', handleWindowDrop);
        };
    }, [selectedDept, deptCSVs]);

    // Load CSV whenever selectedDept changes
    useEffect(() => {
        if (selectedDept === 'BSCSE') {
            if (deptCSVs['BSCSE'] && deptCSVs['BSCSE'].courses) {
                setCourseMap(groupCoursesByCode(deptCSVs['BSCSE'].courses));
                setLoading(false);
                setError(null);
            } else {
                setLoading(true);
                setError(null);
                loadCourseData('/CSE_Courses.csv')
                    .then(courses => {
                        setCourseMap(groupCoursesByCode(courses));
                        setLoading(false);
                    })
                    .catch(err => {
                        setError(err.message);
                        setLoading(false);
                    });
            }
            return;
        }

        // For all other departments (BA in English, BSBGE, BSCE, BBA, etc.):
        // Do not load any static CSV file. Only show user-uploaded CSV if present.
        setLoading(false);
        setError(null);
        if (deptCSVs[selectedDept] && deptCSVs[selectedDept].courses) {
            setCourseMap(groupCoursesByCode(deptCSVs[selectedDept].courses));
        } else {
            setCourseMap({});
        }
    }, [selectedDept, deptCSVs]);

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
            <header className="bg-[#070914]/90 backdrop-blur-md border-b border-[#161a2f] px-4 md:px-6 py-3 sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto flex items-center justify-between relative">
                    <div className="flex items-center gap-2.5 md:gap-3">
                        <img 
                            src="https://uiu.ucamcloud.com/assets/uiu-logo.webp" 
                            alt="UIU Logo" 
                            className="h-8 md:h-9 w-auto object-contain flex-shrink-0"
                        />
                        <div>
                            <h1 className="text-sm md:text-base font-bold text-white leading-tight">UIU Course Planner</h1>
                            <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight mt-0.5">Routine Maker & Conflict Detector</p>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-slate-800 mx-1 md:mx-2" />
                        <span className="hidden sm:inline text-xs md:text-sm font-medium text-slate-400">
                            United International University
                        </span>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {routine.length > 0 && (
                            <>
                                <span className="text-xs text-slate-400 hidden lg:inline">
                                    <span className="text-orange-400 font-semibold">{routine.length}</span> course{routine.length !== 1 ? 's' : ''} added
                                </span>
                                <button
                                    onClick={handleSaveImage}
                                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-[#121629] border border-[#232a4a] hover:border-[#384377] px-2.5 py-1.5 md:px-3 rounded-lg transition-all"
                                    title="Save schedule as image"
                                >
                                    <Download size={13} />
                                    <span className="hidden sm:inline">Save as Image</span>
                                </button>
                                <button
                                    onClick={clearRoutine}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/30 border border-red-500/30 hover:border-red-400/50 px-2.5 py-1.5 md:px-3 rounded-lg transition-all"
                                    title="Clear routine"
                                >
                                    <Trash2 size={13} />
                                    <span className="hidden sm:inline">Clear Routine</span>
                                </button>
                            </>
                        )}

                        <span className="text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 bg-[#0e2417] text-emerald-400 shadow-sm shadow-emerald-950/40 animate-pulse-glow flex-shrink-0">
                            Fall-2026
                        </span>
                        
                        <a
                            href="https://github.com/itsABR4R"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Visit GitHub Profile"
                            className="flex-shrink-0 transition-transform hover:scale-105"
                        >
                            <img
                                src="https://github.com/itsABR4R.png"
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full border border-slate-700/60 hover:border-slate-400 object-cover shadow-sm transition-colors"
                            />
                        </a>
                        {/* <a
                            href="https://github.com/itsABR4R/Course-Planner"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#181717] hover:bg-slate-200 transition-colors shadow-sm flex-shrink-0"
                            title="View GitHub Repository"
                        >
                            <Github size={18} fill="currentColor" />
                        </a> */}
                    </div>
                </div>
            </header>

            {/* ── Top Notice Banner ── */}
            <div className="max-w-screen-2xl w-full mx-auto px-4 lg:px-6 pt-3 lg:pt-4 relative z-30">
                <div className="rounded-xl px-4 py-2.5 border border-amber-500/35 bg-[#171207]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/15 animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-amber-400">
                            <AlertTriangle size={15} className="text-amber-400" />
                        </div>
                        <p className="text-xs text-amber-200/90 leading-normal">
                            <span className="font-bold text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-transparent border border-amber-500/50 uppercase tracking-wider mr-2">
                                Notice
                            </span>
                            Courses are pre-loaded for <span className="font-semibold text-white">BSCSE</span>. For other departments, export & sync your courses directly from UCAM Cloud or upload a CSV!
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setModalShowDeptSelect(true);
                            setIsUploadModalOpen(true);
                        }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 whitespace-nowrap transition-colors flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                    >
                        <UploadCloud size={12} />
                        <span>Sync from UCAM Cloud</span>
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            {/* ── Department Selector & Mode Toggle ── */}
            <div className="max-w-screen-2xl w-full mx-auto px-4 lg:px-6 pt-3 lg:pt-4 relative z-30">
                <div className="dark-panel rounded-2xl p-2 md:p-2.5 flex flex-col md:flex-row md:items-center gap-3 justify-between shadow-xl">
                    {/* Left: Department Tabs (scrollable) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 w-full">
                        {DEPARTMENTS.map(dept => {
                            const isActive = selectedDept === dept.id;
                            const hasCustomData = deptCSVs[dept.id] != null;

                            return (
                                <button
                                    key={dept.id}
                                    onClick={() => setSelectedDept(dept.id)}
                                    className={`px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 rounded-lg ${
                                        isActive 
                                            ? 'text-white font-bold bg-[#14182b] border-b-2 border-orange-500 shadow-sm' 
                                            : 'text-slate-400 font-semibold hover:text-slate-200 hover:bg-white/5'
                                    }`}
                                >
                                    <span>{dept.label}</span>
                                    {hasCustomData && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" title="Custom schedule active" />
                                    )}
                                </button>
                            );
                        })}


                    </div>

                    {/* Divider line (desktop only) */}
                    <div className="hidden md:block w-px h-6 bg-[#1f2644] flex-shrink-0" />

                    {/* Right: Mode Toggle */}
                    <div className="flex items-center bg-[#070914] rounded-xl p-1 border border-[#1a1f36] flex-shrink-0 self-start md:self-auto gap-1">
                        
                        {/* Backup Mode Tooltip Wrapper */}
                        <div className="relative group">
                            <button
                                onClick={() => setPlannerMode('backup')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                    plannerMode === 'backup'
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-950/40'
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
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                    plannerMode === 'conflict'
                                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/40'
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

            {/* Mobile Tab Switcher (visible only under lg and only when NOT awaiting CSV) */}
            {!isAwaitingCSV && (
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
            )}

            {/* ── Body ── */}
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 lg:p-6 pt-2 lg:pt-4 flex flex-col gap-4 lg:gap-6">
                {isAwaitingCSV ? (
                    <div className="w-full flex-1 flex flex-col items-center justify-center py-8 md:py-16 px-4 animate-fade-in my-auto">
                        <div className="dark-panel rounded-3xl p-6 sm:p-10 max-w-xl w-full border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                                <UploadCloud size={38} />
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                    {DEPARTMENTS.find(d => d.id === selectedDept)?.label || selectedDept}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-white">
                                    Upload Course Schedule
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                                    Courses for <strong className="text-slate-200">{DEPARTMENTS.find(d => d.id === selectedDept)?.label || selectedDept}</strong> are not pre-loaded. Drop your CSV or sync using UCAM Bookmarklet to unlock the routine builder and exam calendar.
                                </p>
                            </div>

                            {/* Drag & Drop Card */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDeptDragOver(true); }}
                                onDragLeave={() => setDeptDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDeptDragOver(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) handleDeptCSVUpload(selectedDept, file);
                                }}
                                onClick={() => deptFileInputRef.current?.click()}
                                className={`w-full rounded-2xl p-8 sm:p-10 border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center group ${
                                    deptDragOver
                                        ? 'border-orange-500 bg-orange-500/15 scale-[1.01]'
                                        : 'border-[#283258] hover:border-orange-500/60 bg-[#070914] hover:bg-[#0a0d20]'
                                }`}
                            >
                                <input 
                                    ref={deptFileInputRef}
                                    type="file" 
                                    accept=".csv,text/csv" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDeptCSVUpload(selectedDept, file);
                                    }}
                                />
                                <div className="w-14 h-14 rounded-2xl bg-[#131830] flex items-center justify-center text-orange-400 mb-3 border border-[#273059] group-hover:scale-110 group-hover:border-orange-500/40 transition-transform">
                                    <FileSpreadsheet size={26} />
                                </div>
                                <p className="font-bold text-slate-200 text-sm sm:text-base">
                                    Drop your <span className="text-orange-400">.csv</span> file here
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    or click to browse from device
                                </p>
                            </div>

                            {/* Bookmarklet Helper CTA */}
                            <div className="w-full pt-1 flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={() => {
                                        setModalShowDeptSelect(false);
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-950/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    <span>How to Export from UCAM Cloud (Bookmarklet)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full">
                        {/* ── Left Sidebar: Course Search ── */}
                        <aside className={`w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4 ${mobileTab === 'catalogue' ? 'block' : 'hidden lg:block'}`}>
                            <div className="dark-panel rounded-2xl p-4 flex flex-col gap-3 flex-1 shadow-lg">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                                        <p className="text-xs text-slate-500">Loading schedule…</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-red-400">Failed to load schedule</p>
                                        <p className="text-xs text-slate-500 mt-1">{error}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Department Routine Status & CSV Management Bar */}
                                        <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[#0b0e1e] border border-[#1b223c]">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        deptCSVs[selectedDept] ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                                    }`}>
                                                        <FileSpreadsheet size={14} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[160px]" title={deptCSVs[selectedDept]?.filename || `${selectedDept} Default`}>
                                                                {deptCSVs[selectedDept] ? deptCSVs[selectedDept].filename : `${selectedDept} Catalog`}
                                                            </span>
                                                            {deptCSVs[selectedDept] ? (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex-shrink-0">
                                                                    Custom
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold flex-shrink-0">
                                                                    Official
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {Object.keys(courseMap).length} courses available
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action buttons row */}
                                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#161c33]">
                                                <button
                                                    onClick={() => {
                                                        setModalShowDeptSelect(false);
                                                        setIsUploadModalOpen(true);
                                                    }}
                                                    className="flex-1 py-1.5 px-3 rounded-lg border border-dashed border-orange-500/50 hover:border-orange-500/80 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400 hover:text-orange-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                                                    title="Update CSV file for this department"
                                                >
                                                    <Plus size={13} className="text-orange-400" />
                                                    <span>Update CSV</span>
                                                </button>

                                                {deptCSVs[selectedDept] && (
                                                    <button
                                                        onClick={() => handleClearDeptCSV(selectedDept)}
                                                        className="py-1.5 px-2.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-800/40 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                                                        title={selectedDept === 'BSCSE' ? "Reset to official CSE catalog" : "Remove uploaded CSV"}
                                                    >
                                                        {selectedDept === 'BSCSE' ? (
                                                            <>
                                                                <RotateCcw size={12} />
                                                                <span>Reset</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 size={12} />
                                                                <span>Clear</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <CourseSearch courseMap={courseMap} onAddCourse={handleAddCourse} routine={routine} getExamInfo={(code) => getExamInfo(code, selectedDept)} />
                                    </>
                                )}
                            </div>
                        </aside>

                        {/* ── Main Content: Routine Grid + Added list ── */}
                        <div className={`flex-1 flex flex-col gap-4 min-w-0 ${mobileTab === 'schedule' ? 'block' : 'hidden lg:block'}`}>

                    {/* Routine summary chips */}
                    {routine.length > 0 && (
                        <div className="dark-panel rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={13} className="text-orange-400" />
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
                                            <span className="opacity-70 relative z-10 font-medium">{entry.section}</span>
                                            {roleInfo.type === 'primary' && (
                                                <span 
                                                    title="1st Choice Course" 
                                                    className="relative z-10 flex items-center select-none text-[12px] filter drop-shadow-[0_0_5px_rgba(245,158,11,0.7)] transition-transform hover:scale-125"
                                                >
                                                    👑
                                                </span>
                                            )}
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
                            <Calendar size={15} className="text-orange-400" />
                            <h2 className="text-sm font-semibold text-white">Weekly Schedule</h2>
                            <span className="text-xs text-slate-500 font-medium">(Sat – Wed · 08:30 – 16:30)</span>
                        </div>

                        {routine.length === 0 ? (
                            <EmptyScheduleState onDropSection={handleAddCourse} />
                        ) : (
                            <CalendarGrid 
                                routine={routine} 
                                onRemoveCourse={removeCourse} 
                                getExamInfo={(code) => getExamInfo(code, selectedDept)}
                                onDropSection={handleAddCourse}
                            />
                        )}
                    </div>

                    {/* Exam Schedule */}
                    <div className="flex flex-col gap-3 mt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={15} className="text-orange-400" />
                                <h2 className="text-sm font-semibold text-white">Exam Schedule</h2>
                            </div>
                            {routine.length > 0 && (
                                <button
                                    onClick={clearRoutine}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-all font-semibold"
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

                        <div className="w-full overflow-x-auto rounded-2xl border border-[#1a1f36] no-scrollbar dark-panel">
                            <div 
                                className="grid text-slate-300"
                                style={{
                                    gridTemplateColumns: '90px repeat(3, minmax(180px, 1fr))',
                                    gridTemplateRows: 'auto repeat(7, minmax(90px, auto))',
                                    minWidth: '640px',
                                }}
                            >
                                {/* Header Row */}
                                <div className="py-4 px-3 text-center border-r border-b border-[#1a1f36] bg-[#101322] font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center justify-center">
                                    DAY
                                </div>
                                <div 
                                    className="py-3 px-3 text-center border-r border-b border-[#1a1f36] flex flex-col justify-center relative"
                                    style={{ background: 'linear-gradient(135deg, #2b1410 0%, #3d1b14 100%)' }}
                                >
                                    <span className="font-bold text-white text-xs">Slot T1</span>
                                    <span className="text-[10px] text-amber-500 font-medium mt-0.5">09:00 - 11:00</span>
                                </div>
                                <div 
                                    className="py-3 px-3 text-center border-r border-b border-[#1a1f36] flex flex-col justify-center relative"
                                    style={{ background: 'linear-gradient(135deg, #26220e 0%, #362e12 100%)' }}
                                >
                                    <span className="font-bold text-white text-xs">Slot T2</span>
                                    <span className="text-[10px] text-yellow-500/90 font-medium mt-0.5">11:20 - 13:20</span>
                                </div>
                                <div 
                                    className="py-3 px-3 text-center border-b border-[#1a1f36] flex flex-col justify-center relative"
                                    style={{ background: 'linear-gradient(135deg, #241a12 0%, #342418 100%)' }}
                                >
                                    <span className="font-bold text-white text-xs">Slot T3</span>
                                    <span className="text-[10px] text-amber-500 font-medium mt-0.5">14:00 - 16:00</span>
                                </div>

                                {/* Data Rows */}
                                {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                                    const dayKey = `Day ${dayNum}`;
                                    return (
                                        <React.Fragment key={dayNum}>
                                            {/* Day Label */}
                                            <div className="py-4 px-3 text-center border-r border-b border-[#1a1f36] bg-[#0c0f1d] font-bold text-slate-300 text-xs flex items-center justify-center">
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
                                                        className={`p-2 dot-grid flex flex-col justify-center gap-1.5 min-h-[90px] relative`}
                                                        style={{
                                                            ...highlightStyle,
                                                            borderRight: (isConflict || isWarning) ? '2px solid' : (idx === 2 ? 'none' : '1px solid #161a2f'),
                                                            borderBottom: (isConflict || isWarning) ? '2px solid' : '1px solid #161a2f',
                                                            borderColor: isConflict ? '#ef4444' : isWarning ? '#eab308' : undefined,
                                                        }}
                                                    >
                                                        {courses.map((course, cIdx) => (
                                                            <div
                                                                key={cIdx}
                                                                className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-sm flex flex-col items-start gap-0.5 border border-orange-500/40 select-none animate-scale-in"
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
            </div>
        )}
    </main>

            {/* ── Custom CSV / UCAM Bookmarklet Sync Modal ── */}
            <UploadCSVModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
                departments={DEPARTMENTS}
                currentDept={selectedDept}
                deptCSVs={deptCSVs}
                onClearDeptCSV={handleClearDeptCSV}
                showDeptSelect={modalShowDeptSelect}
            />

            {/* ── Toast ── */}
            <Toast toast={toast} onDismiss={() => { }} />
            
            {/* ── Vercel Analytics ── */}
            <Analytics />
        </div>
    );
}
