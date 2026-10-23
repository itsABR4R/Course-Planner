import React, { useState, useEffect, useRef } from 'react';
import { 
    X, UploadCloud, FileSpreadsheet, Bookmark, Copy, Check, 
    ExternalLink, Sparkles, AlertCircle, Trash2, ArrowRight, CheckCircle2,
    GraduationCap 
} from 'lucide-react';
import { parseCSVText, groupCoursesByCode } from '../utils/parser';

const BOOKMARKLET_CODE = [
    'javascript:(function(){',
    'const m={"Sat":"Saturday","Sun":"Sunday","Mon":"Monday","Tue":"Tuesday","Wed":"Wednesday","Thu":"Thursday","Fri":"Friday"};',
    'const rows=[["Course Code","Course Name","Section","Faculty","Schedule","Room"]];',
    'if(window.__fullDecryptedCatalog&&window.__fullDecryptedCatalog.courses){',
    'window.__fullDecryptedCatalog.courses.forEach(c=>{',
    'const code=c.formal_code||c.course_code||"";',
    'const name=c.course_name||"";',
    '(c.sections||[]).forEach(s=>{',
    'const sec=s.section_name||"";',
    'const fac=(s.faculty_name&&s.faculty_name.trim())?s.faculty_name.trim():"TBA";',
    'const rm=(s.room_details&&s.room_details.trim())?s.room_details.trim():"TBA";',
    'let parts=[];',
    'if(Array.isArray(s.schedule)){',
    's.schedule.forEach(sl=>{',
    'let d=m[sl.day||sl.day_name]||(sl.day||sl.day_name||"");',
    'let t=sl.time||sl.time_slot||(sl.start_time&&sl.end_time?(sl.start_time+"-"+sl.end_time):"");',
    'if(d&&t)parts.push(d+" "+t);',
    '});',
    '}',
    'let sc=parts.join(" | ");',
    'sc=sc?(sc+" | "+rm):rm;',
    'rows.push([code,name,sec,fac,sc,rm]);',
    '});',
    '});',
    '}else{',
    'const re=/^([A-Z]{2,4}\\s+\\d{4}[A-Za-z]?)(?:\\s+\\d+\\s*cr)?$/i;',
    'Array.from(document.querySelectorAll("h2, h3, h4, div")).forEach(el=>{',
    'const txt=el.innerText?el.innerText.trim():"";',
    'if(el.children.length<=2&&re.test(txt)){',
    'const code=txt.match(re)[1];',
    'let name="";',
    'let sib=el.nextElementSibling;',
    'while(sib&&!name){',
    'const st=sib.innerText?sib.innerText.trim():"";',
    'if(st&&!st.includes("SECTION")&&!st.includes("FACULTY")){',
    'name=st.split("\\n")[0].trim();',
    'break;',
    '}',
    'sib=sib.nextElementSibling;',
    '}',
    'const tbl=(el.closest("section")||el.parentElement).querySelector("table");',
    'if(tbl){',
    'tbl.querySelectorAll("tbody tr, tr").forEach(tr=>{',
    'const tds=Array.from(tr.querySelectorAll("td")).map(td=>td.innerText.trim());',
    'if(tds.length>=4&&!tds[0].toUpperCase().includes("SECTION")){',
    'const sec=tds[0];',
    'const fac=tds[1].split("\\n")[0].trim()||"TBA";',
    'const sch=tds[2].split("\\n").map(l=>l.trim()).filter(Boolean).map(l=>l.replace(/\\b(Sat|Sun|Mon|Tue|Wed|Thu|Fri)\\b/g,d=>m[d]||d)).join(" | ");',
    'const rm=tds[3]||"TBA";',
    'rows.push([code,name,sec,fac,sch+" | "+rm,rm]);',
    '}',
    '});',
    '}',
    '}',
    '});',
    '}',
    'if(rows.length<=1){alert("No courses found on this page!");return;}',
    'const blob=new Blob([rows.map(r=>r.map(c=>\'"\'+String(c||"").replace(/"/g,\'""\')+\'"\').join(",")).join("\\n")],{type:"text/csv;charset=utf-8;"});',
    'const a=document.createElement("a");',
    'a.href=URL.createObjectURL(blob);',
    'a.download="Courses_"+new Date().toISOString().slice(0,10)+".csv";',
    'document.body.appendChild(a);',
    'a.click();',
    'a.remove();',
    '})();'
].join('');

export default function UploadCSVModal({ 
    isOpen, 
    onClose, 
    onUploadSuccess, 
    departments = [],
    currentDept = 'BSCSE',
    deptCSVs = {},
    onClearDeptCSV,
    showDeptSelect = false,
}) {
    const [targetDept, setTargetDept] = useState(currentDept);
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState(null);
    const [pendingData, setPendingData] = useState(null);
    const [showManualSteps, setShowManualSteps] = useState(false);
    const [showUCAMGuide, setShowUCAMGuide] = useState(false);
    const fileInputRef = useRef(null);

    const activeDeptId = showDeptSelect ? targetDept : currentDept;
    const activeDeptObj = departments.find(d => d.id === activeDeptId);
    const activeDeptLabel = activeDeptObj ? activeDeptObj.label : activeDeptId;

    useEffect(() => {
        if (currentDept) setTargetDept(currentDept);
    }, [currentDept, isOpen]);

    if (!isOpen) return null;

    const handleCopyBookmarklet = () => {
        navigator.clipboard.writeText(BOOKMARKLET_CODE).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const processFile = (file) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
            setParseError('Please upload a valid .csv file.');
            setPendingData(null);
            return;
        }

        setParseError(null);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const courses = await parseCSVText(text);

                if (!courses || courses.length === 0) {
                    setParseError('No valid course entries found. Please ensure the CSV contains "Course Code", "Course Name", and "Section" columns.');
                    setPendingData(null);
                    return;
                }

                const grouped = groupCoursesByCode(courses);
                const uniqueCodes = Object.keys(grouped);
                const totalSections = courses.length;

                setPendingData({
                    filename: file.name,
                    courses,
                    grouped,
                    uniqueCodes,
                    totalSections,
                    rawText: text,
                });
            } catch (err) {
                setParseError(err.message || 'Failed to parse CSV file.');
                setPendingData(null);
            }
        };
        reader.readAsText(file);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file);
    };

    const handleApply = () => {
        if (!pendingData) return;
        onUploadSuccess(pendingData.courses, pendingData.filename, activeDeptId);
        setPendingData(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#090b16] border border-[#1e243d] shadow-2xl text-slate-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#181d33] bg-[#0c0f20]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                            <UploadCloud size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                                Update Course Schedule (CSV)
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {showDeptSelect 
                                    ? "Upload a CSV schedule file to update your department's courses" 
                                    : `Upload a CSV schedule file to update courses for ${activeDeptLabel}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
                    {/* Target Department Selection - only rendered if showDeptSelect */}
                    {showDeptSelect && (
                        <div className="rounded-xl p-3 bg-[#11162d] border border-[#232c54] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={16} className="text-orange-400" />
                                <span className="font-semibold text-white text-xs">Assign schedule to department:</span>
                            </div>
                            <select
                                value={targetDept}
                                onChange={(e) => setTargetDept(e.target.value)}
                                className="bg-[#080b18] text-orange-300 font-bold border border-orange-500/40 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-400 cursor-pointer"
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.label} {deptCSVs[d.id] ? '(Custom CSV Loaded)' : d.id === 'BSCSE' ? '(Default Catalog)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Active Custom CSV Banner if already loaded for active department */}
                    {deptCSVs[activeDeptId] && (
                        <div className="rounded-xl p-3 bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3 animate-fade-in">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-emerald-300 text-xs truncate">
                                        Custom schedule active for {activeDeptLabel}: {deptCSVs[activeDeptId].filename}
                                    </p>
                                    <p className="text-[10px] text-emerald-400/70">
                                        {deptCSVs[activeDeptId].count} courses loaded
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => onClearDeptCSV(activeDeptId)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-500/30 transition-colors flex items-center gap-1.5 flex-shrink-0"
                                title="Remove and switch back to default"
                            >
                                <Trash2 size={11} />
                                {activeDeptId === 'BSCSE' ? 'Reset to Default' : 'Remove'}
                            </button>
                        </div>
                    )}

                    {/* Primary CSV Upload Box */}
                    <div className="rounded-xl p-4 bg-[#0d1022] border border-[#1c223c] space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-white text-xs">
                                <FileSpreadsheet size={15} className="text-orange-400" />
                                <span>Drop or Select Your CSV File</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                                Target: <strong className="text-orange-400">{activeDeptLabel}</strong>
                            </span>
                        </div>

                        {/* Hidden native input */}
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".csv,text/csv" 
                            className="hidden" 
                            onChange={(e) => processFile(e.target.files?.[0])}
                        />

                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleFileDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                rounded-xl p-6 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
                                ${isDragging 
                                    ? 'border-orange-500 bg-orange-500/10 scale-[1.01]' 
                                    : 'border-[#262f54] hover:border-orange-500/50 bg-[#070914] hover:bg-[#0a0d1d]'}
                            `}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#141930] flex items-center justify-center text-orange-400 mb-2 border border-[#273059]">
                                <UploadCloud size={24} />
                            </div>
                            <p className="font-bold text-slate-200 text-xs sm:text-sm">
                                Drop your <span className="text-orange-400">.csv</span> file here, or click to browse
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Supports standard UIU UCAM exported CSV routines
                            </p>
                        </div>

                        {/* Parsing Error Box */}
                        {parseError && (
                            <div className="rounded-xl p-3 bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
                                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Invalid CSV File</p>
                                    <p className="text-[11px] text-red-300/80 mt-0.5">{parseError}</p>
                                </div>
                            </div>
                        )}

                        {/* Pending parsed review */}
                        {pendingData && (
                            <div className="rounded-xl p-3.5 bg-[#0e1327] border border-orange-500/35 space-y-2.5 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet size={15} className="text-emerald-400" />
                                        <span className="font-bold text-white text-xs truncate max-w-[280px]">
                                            {pendingData.filename}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        Ready
                                    </span>
                                </div>

                                <p className="text-[11px] text-slate-300">
                                    Found <strong className="text-white">{pendingData.uniqueCodes.length} courses</strong> across <strong className="text-white">{pendingData.totalSections} sections</strong>.
                                </p>

                                {/* Sample course badges preview */}
                                <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                                    {pendingData.uniqueCodes.slice(0, 10).map((code) => (
                                        <span key={code} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#181d36] text-slate-300 border border-white/5">
                                            {code}
                                        </span>
                                    ))}
                                    {pendingData.uniqueCodes.length > 10 && (
                                        <span className="text-[10px] text-slate-500 self-center px-1">
                                            +{pendingData.uniqueCodes.length - 10} more
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={handleApply}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition-all"
                                >
                                    <span>Load into {activeDeptLabel}</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Expandable UCAM Bookmarklet Helper */}
                    <div className="rounded-xl border border-[#1d2545] bg-[#090c1a] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowUCAMGuide(!showUCAMGuide)}
                            className="w-full flex items-center justify-between p-3.5 text-left text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-orange-400" />
                                <span className="font-semibold text-xs">Need to export your schedule from UCAM Cloud?</span>
                            </div>
                            <span className="text-[11px] text-orange-400 font-bold">
                                {showUCAMGuide ? 'Hide Instructions' : 'View Bookmarklet Guide'}
                            </span>
                        </button>

                        {showUCAMGuide && (
                            <div className="p-4 pt-1 space-y-4 border-t border-[#181e38] animate-fade-in text-[11px]">
                                {/* Step 1: Drag Bookmarklet */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-white">
                                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] font-black">
                                            1
                                        </span>
                                        <h4>Get the UCAM Bookmarklet</h4>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed">
                                        Drag this button up to your browser's <strong className="text-slate-200">Bookmarks Bar</strong> (press <kbd className="px-1 py-0.5 bg-[#171c33] border border-[#262e52] rounded text-[10px] text-slate-300 font-mono">Ctrl + Shift + B</kbd> to show it):
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <a
                                            href={BOOKMARKLET_CODE}
                                            draggable="true"
                                            onDragStart={(e) => e.dataTransfer.setData('text/plain', BOOKMARKLET_CODE)}
                                            onClick={(e) => e.preventDefault()}
                                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-950/40 border border-orange-400/40 cursor-grab active:cursor-grabbing transition-transform hover:scale-105 select-none"
                                            title="Drag this button to your bookmarks bar"
                                        >
                                            <Bookmark size={13} className="fill-white" />
                                            <span>📌 Export UCAM Courses</span>
                                        </a>

                                        <button
                                            onClick={handleCopyBookmarklet}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141930] hover:bg-[#1b2242] border border-[#273059] text-slate-300 hover:text-white font-semibold text-xs transition-all"
                                            title="Copy bookmarklet javascript code"
                                        >
                                            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                            <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
                                        </button>
                                    </div>

                                    {/* Toggle manual instructions */}
                                    <div className="pt-1">
                                        <button
                                            onClick={() => setShowManualSteps(!showManualSteps)}
                                            className="text-[11px] text-orange-400/90 hover:text-orange-300 underline font-medium"
                                        >
                                            {showManualSteps ? 'Hide manual bookmark setup' : 'Need help adding the bookmark manually?'}
                                        </button>
                                        {showManualSteps && (
                                            <ol className="mt-2 pl-4 list-decimal space-y-1 text-[11px] text-slate-400 animate-fade-in">
                                                <li>Right-click an empty spot on your browser's Bookmarks bar and choose <strong>Add page...</strong> (or <em>Add bookmark</em>).</li>
                                                <li>Set the name to <strong>Export UCAM Courses</strong>.</li>
                                                <li>Click <strong>Copy Code</strong> above, paste it into the <strong>URL</strong> field, and click <strong>Save</strong>.</li>
                                            </ol>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Run in UCAM */}
                                <div className="space-y-1.5 pt-2 border-t border-[#181e38]">
                                    <div className="flex items-center gap-2 font-bold text-white">
                                        <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] font-black">
                                            2
                                        </span>
                                        <h4>Run in UCAM Cloud</h4>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed">
                                        Log into <a href="https://ucamcloud.uiu.ac.bd/" target="_blank" rel="noopener noreferrer" className="text-orange-400 font-semibold inline-flex items-center gap-1 hover:underline">UCAM Cloud <ExternalLink size={10} /></a>, open your active Course Offerings or Schedule page, and click your new <strong className="text-white">Export UCAM Courses</strong> bookmark. It will automatically download your <code className="px-1.5 py-0.5 rounded bg-[#171c33] text-orange-300 font-mono text-[10px]">Courses_YYYY-MM-DD.csv</code> file.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3 border-t border-[#181d33] bg-[#0c0f20] flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
