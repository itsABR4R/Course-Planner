/**
 * src/hooks/useRoutine.js
 *
 * Custom hook to manage the weekly routine state and detect scheduling conflicts.
 *
 * State shape:
 *   routine: Array<{
 *     id: string,          // unique id: "courseCode-section"
 *     code: string,
 *     name: string,
 *     section: string,
 *     faculty: string,
 *     room: string,
 *     slots: Array<{ day, startMin, endMin, startStr, endStr }>,
 *     color: string,       // assigned CSS color class
 *   }>
 */

import { useState, useCallback } from 'react';

/** Palette of distinct colors for course cards */
const COLOR_PALETTE = [
    { bg: 'rgba(99,102,241,0.85)', border: 'rgba(99,102,241,1)', text: '#fff', name: 'indigo' },
    { bg: 'rgba(168,85,247,0.85)', border: 'rgba(168,85,247,1)', text: '#fff', name: 'purple' },
    { bg: 'rgba(236,72,153,0.85)', border: 'rgba(236,72,153,1)', text: '#fff', name: 'pink' },
    { bg: 'rgba(20,184,166,0.85)', border: 'rgba(20,184,166,1)', text: '#fff', name: 'teal' },
    { bg: 'rgba(245,158,11,0.85)', border: 'rgba(245,158,11,1)', text: '#fff', name: 'amber' },
    { bg: 'rgba(34,197,94,0.85)', border: 'rgba(34,197,94,1)', text: '#fff', name: 'green' },
    { bg: 'rgba(239,68,68,0.85)', border: 'rgba(239,68,68,1)', text: '#fff', name: 'red' },
    { bg: 'rgba(14,165,233,0.85)', border: 'rgba(14,165,233,1)', text: '#fff', name: 'sky' },
    { bg: 'rgba(249,115,22,0.85)', border: 'rgba(249,115,22,1)', text: '#fff', name: 'orange' },
    { bg: 'rgba(16,185,129,0.85)', border: 'rgba(16,185,129,1)', text: '#fff', name: 'emerald' },
];

/**
 * Checks if two course entries overlap in schedule.
 */
export function entriesOverlap(entry1, entry2) {
    if (!entry1.slots || !entry2.slots) return false;
    for (const s1 of entry1.slots) {
        for (const s2 of entry2.slots) {
            if (
                s1.day === s2.day &&
                s1.startMin < s2.endMin && s2.startMin < s1.endMin
            ) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Dynamically computes the role details of a course entry.
 */
export function getCourseRole(entry, routine) {
    const isBackup = routine.findIndex(r => r.code === entry.code) !== routine.indexOf(entry);
    if (isBackup) {
        return { type: 'backup', label: 'Backup', shortLabel: 'BK' };
    }

    // Find all primary entries (first sections of courses)
    const primaryEntries = routine.filter(r => 
        routine.findIndex(other => other.code === r.code) === routine.indexOf(r)
    );

    // Find overlapping primary entries
    const overlappingPrimaries = primaryEntries.filter(r => 
        r.code !== entry.code && entriesOverlap(r, entry)
    );

    const allGroup = [entry, ...overlappingPrimaries];
    allGroup.sort((a, b) => routine.indexOf(a) - routine.indexOf(b));

    const choiceIndex = allGroup.indexOf(entry);
    if (choiceIndex === 0) {
        return { type: 'primary', label: 'Primary', shortLabel: '1st' };
    } else {
        const n = choiceIndex + 1;
        let suffix = 'th';
        if (n === 2) suffix = 'nd';
        if (n === 3) suffix = 'rd';
        return { 
            type: 'choice', 
            level: n, 
            label: `${n}${suffix} Choice`, 
            shortLabel: `${n}${suffix}` 
        };
    }
}

export function useRoutine() {
    const [routine, setRoutine] = useState([]);
    const [toast, setToast] = useState(null); // { message, type }
    const [colorIndex, setColorIndex] = useState(0);

    /** Show a toast notification for a brief duration */
    const showToast = useCallback((message, type = 'error') => {
        setToast({ message, type, id: Date.now() });
        setTimeout(() => setToast(null), 4000);
    }, []);

    /**
     * Adds a course section to the routine.
     * Returns false if a duplicate was found (and shows a toast).
     */
    const addCourse = useCallback((courseEntry) => {
        const id = `${courseEntry.code}-${courseEntry.section}`;

        // Prevent exact duplicate (same code + same section)
        if (routine.find(r => r.id === id)) {
            showToast('Already exists', 'warning');
            return false;
        }

        // Skip courses with no parseable schedule (TBA)
        if (!courseEntry.slots || courseEntry.slots.length === 0) {
            showToast(`${courseEntry.code} Section ${courseEntry.section} has a TBA schedule and cannot be added.`, 'warning');
            return false;
        }

        // Determine role: first section of this course = primary, rest = backup
        const sameCourseEntries = routine.filter(r => r.code === courseEntry.code);
        const isBackup = sameCourseEntries.length > 0;

        // Reuse the same color family as existing sections of this course (if any)
        const existingColor = sameCourseEntries[0]?.color;
        const color = existingColor ?? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
        if (!existingColor) setColorIndex(prev => prev + 1);

        const newEntry = { ...courseEntry, id, color, role: isBackup ? 'backup' : 'primary' };
        setRoutine(prev => [...prev, newEntry]);

        // Calculate role details for the toast message
        const tempRoutine = [...routine, newEntry];
        const roleInfo = getCourseRole(newEntry, tempRoutine);

        if (roleInfo.type === 'backup') {
            showToast(`📌 Added ${courseEntry.code} Sec ${courseEntry.section} as Backup`, 'success');
        } else if (roleInfo.type === 'choice') {
            showToast(`✓ Added ${courseEntry.code} Section ${courseEntry.section} as ${roleInfo.label}!`, 'success');
        } else {
            showToast(`✓ Added ${courseEntry.code} Section ${courseEntry.section}!`, 'success');
        }
        return true;
    }, [routine, colorIndex, showToast]);

    /** Removes a course from the routine */
    const removeCourse = useCallback((id) => {
        setRoutine(prev => prev.filter(r => r.id !== id));
    }, []);

    /** Clears the entire routine */
    const clearRoutine = useCallback(() => {
        setRoutine([]);
        setColorIndex(0);
    }, []);

    return {
        routine,
        toast,
        addCourse,
        removeCourse,
        clearRoutine,
        showToast,
    };
}
