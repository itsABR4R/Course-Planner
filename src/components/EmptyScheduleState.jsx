import React, { useState } from 'react';

export default function EmptyScheduleState({ onDropSection }) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        // Prevent flickering when hovering child SVG elements
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const raw = e.dataTransfer.getData('application/json');
            if (raw) {
                const data = JSON.parse(raw);
                if (onDropSection) {
                    onDropSection(data);
                }
            }
        } catch (err) {
            console.error('Failed to parse dropped course payload:', err);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center animate-fade-in
                transition-all duration-200 cursor-default
                ${isDragOver
                    ? 'border-2 border-dashed border-orange-500 bg-[#1f160b]/90 ring-4 ring-orange-500/25 scale-[1.01] shadow-2xl shadow-orange-950/60'
                    : 'dark-panel border border-[#1a1f36]'}
            `}
        >
            {/* Vector Illustration */}
            <div className={`relative mb-6 select-none flex items-center justify-center transition-transform duration-200 ${isDragOver ? 'scale-105' : ''}`}>
                <svg
                    width="320"
                    height="190"
                    viewBox="0 0 320 190"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="max-w-full h-auto drop-shadow-md"
                >
                    <defs>
                        {/* Glow for Lamp Cone */}
                        <linearGradient id="lampConeGrad" x1="0%" y1="0%" x2="50%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Laptop Screen Glow */}
                        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
                        </linearGradient>

                        {/* Desk Wood Gradient */}
                        <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#92400e" />
                        </linearGradient>
                    </defs>

                    {/* Floor shadow */}
                    <ellipse cx="160" cy="176" rx="130" ry="6" fill="#05070e" opacity="0.8" />

                    {/* Chair Behind Desk */}
                    <g id="chair">
                        {/* Chair Backrest */}
                        <rect x="156" y="46" width="36" height="48" rx="6" fill="#1e243d" stroke="#2d375d" strokeWidth="1.5" />
                        <line x1="162" y1="58" x2="186" y2="58" stroke="#333f6a" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="162" y1="68" x2="186" y2="68" stroke="#333f6a" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="162" y1="78" x2="186" y2="78" stroke="#333f6a" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Chair Armrests */}
                        <path d="M152 70 H156 V84 H152" stroke="#2d375d" strokeWidth="2" strokeLinecap="round" />
                        <path d="M196 70 H192 V84 H196" stroke="#2d375d" strokeWidth="2" strokeLinecap="round" />

                        {/* Chair Seat */}
                        <rect x="153" y="94" width="42" height="10" rx="3" fill="#181e33" />

                        {/* Chair Stem & Caster Base */}
                        <rect x="172" y="104" width="4" height="42" fill="#0f1322" />
                        <path d="M174 146 L152 166 M174 146 L196 166 M174 146 L174 168" stroke="#161b2e" strokeWidth="3" strokeLinecap="round" />
                        {/* Wheels */}
                        <circle cx="152" cy="167" r="2.5" fill="#2d375d" />
                        <circle cx="196" cy="167" r="2.5" fill="#2d375d" />
                        <circle cx="174" cy="169" r="2.5" fill="#2d375d" />
                    </g>

                    {/* Lamp Cone of Light */}
                    <polygon points="104,74 65,160 170,160" fill="url(#lampConeGrad)" />

                    {/* Desk Legs */}
                    <g id="deskLegs">
                        {/* Left Legs */}
                        <rect x="100" y="100" width="4" height="66" fill="#1b2038" rx="1.5" />
                        <rect x="110" y="100" width="3.5" height="66" fill="#14182b" rx="1.5" />
                        <line x1="98" y1="130" x2="114" y2="130" stroke="#1b2038" strokeWidth="2" />

                        {/* Right Legs */}
                        <rect x="238" y="100" width="4" height="66" fill="#1b2038" rx="1.5" />
                        <rect x="248" y="100" width="3.5" height="66" fill="#14182b" rx="1.5" />
                        <line x1="236" y1="130" x2="252" y2="130" stroke="#1b2038" strokeWidth="2" />
                    </g>

                    {/* Wooden Desk Top */}
                    <rect x="90" y="95" width="166" height="8" rx="3" fill="url(#deskGrad)" stroke="#b45309" strokeWidth="1" />

                    {/* Laptop on Desk */}
                    <g id="laptop">
                        {/* Screen */}
                        <polygon points="172,62 208,62 204,92 168,92" fill="#0b0e1b" stroke="#334155" strokeWidth="1" />
                        <polygon points="174,64 206,64 203,90 171,90" fill="url(#screenGrad)" />
                        {/* Mini glowing code lines */}
                        <line x1="176" y1="70" x2="194" y2="70" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
                        <line x1="176" y1="75" x2="201" y2="75" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                        <line x1="176" y1="80" x2="188" y2="80" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

                        {/* Keyboard Base */}
                        <polygon points="163,94 209,94 213,97 159,97" fill="#475569" stroke="#334155" strokeWidth="0.5" />
                    </g>

                    {/* Desk Lamp on Left */}
                    <g id="lamp">
                        {/* Lamp Base on desk */}
                        <ellipse cx="112" cy="95" rx="6" ry="2" fill="#ea580c" />
                        {/* Articulated Rods */}
                        <line x1="112" y1="94" x2="103" y2="75" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="103" cy="75" r="2.5" fill="#f97316" />
                        <line x1="103" y1="75" x2="114" y2="60" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="114" cy="60" r="2.5" fill="#f97316" />

                        {/* Lamp Shade Head */}
                        <path d="M107 58 L122 66 L113 75 Z" fill="#ea580c" stroke="#f97316" strokeWidth="1" />
                        {/* Bulb */}
                        <circle cx="114" cy="70" r="3" fill="#fef08a" />
                    </g>

                    {/* Backpack on Floor beside desk */}
                    <g id="backpack">
                        {/* Main Bag Body */}
                        <rect x="76" y="126" width="22" height="38" rx="8" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
                        {/* Front Pocket */}
                        <rect x="78" y="140" width="18" height="20" rx="4" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
                        <line x1="82" y1="145" x2="92" y2="145" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
                        {/* Top Carry Loop */}
                        <path d="M83 126 C83 120 91 120 91 126" stroke="#c2410c" strokeWidth="2" fill="none" />
                        {/* Side Straps */}
                        <path d="M76 134 C72 142 72 154 76 158" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>

                    {/* Floating "Drag & Drop sections" sticky note badge on right */}
                    <g id="dragNote">
                        {/* Dashed Box */}
                        <rect
                            x="232"
                            y="44"
                            width="76"
                            height="66"
                            rx="8"
                            fill={isDragOver ? '#311b08' : '#0d1122'}
                            stroke={isDragOver ? '#f97316' : '#334155'}
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                        />
                        {/* Mini Calendar Icon */}
                        <rect x="262" y="56" width="16" height="14" rx="2" fill="none" stroke={isDragOver ? '#fb923c' : '#94a3b8'} strokeWidth="1.5" />
                        <line x1="262" y1="61" x2="278" y2="61" stroke={isDragOver ? '#fb923c' : '#94a3b8'} strokeWidth="1.5" />
                        <circle cx="266" cy="54" r="1" fill={isDragOver ? '#fb923c' : '#94a3b8'} />
                        <circle cx="274" cy="54" r="1" fill={isDragOver ? '#fb923c' : '#94a3b8'} />

                        {/* Text */}
                        <text x="270" y="84" textAnchor="middle" fill={isDragOver ? '#fed7aa' : '#94a3b8'} fontSize="8" fontWeight="600" fontFamily="sans-serif">
                            Drag &amp; Drop
                        </text>
                        <text x="270" y="94" textAnchor="middle" fill={isDragOver ? '#fed7aa' : '#94a3b8'} fontSize="8" fontWeight="600" fontFamily="sans-serif">
                            sections
                        </text>
                    </g>
                </svg>
            </div>

            {/* Typography */}
            <h3 className={`text-base md:text-lg font-bold tracking-tight transition-colors ${isDragOver ? 'text-orange-400' : 'text-white'}`}>
                {isDragOver ? 'Drop to add section to routine!' : 'Your routine is empty.'}
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                {isDragOver 
                    ? 'Release anywhere here to place this section into your weekly schedule.'
                    : 'Search for a course on the left to start building your dream schedule!'}
            </p>
        </div>
    );
}
