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
 * Checks if two time intervals [s1, e1) and [s2, e2) overlap.
 * Returns true if they conflict.
 */
function intervalsOverlap(s1, e1, s2, e2) {
    return s1 < e2 && s2 < e1;
}

/**
 * Checks whether a candidate course entry conflicts with any existing routine entry.
 * Returns the conflicting entry, or null if no conflict.
 */
function findConflict(candidate, routine) {
    for (const existing of routine) {
        for (const cSlot of candidate.slots) {
            for (const eSlot of existing.slots) {
                if (
                    cSlot.day === eSlot.day &&
                    intervalsOverlap(cSlot.startMin, cSlot.endMin, eSlot.startMin, eSlot.endMin)
                ) {
                    return existing; // return the conflicting course
                }
            }
        }
    }
    return null;
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
     * Returns false if a conflict was found (and shows a toast).
     */
    const addCourse = useCallback((courseEntry) => {
        const id = `${courseEntry.code}-${courseEntry.section}`;

        // Prevent duplicate
        if (routine.find(r => r.id === id)) {
            showToast(`${courseEntry.code} Section ${courseEntry.section} is already in your routine.`, 'warning');
            return false;
        }

        // Skip courses with no parseable schedule (TBA)
        if (!courseEntry.slots || courseEntry.slots.length === 0) {
            showToast(`${courseEntry.code} Section ${courseEntry.section} has a TBA schedule and cannot be added to the grid.`, 'warning');
            return false;
        }

        // Check for conflicts
        const conflict = findConflict(courseEntry, routine);
        if (conflict) {
            showToast(
                `⚠ Time Conflict! ${courseEntry.code}-${courseEntry.section} overlaps with "${conflict.name}" (${conflict.code}-${conflict.section}).`,
                'error'
            );
            return false;
        }

        // All clear — assign color and add
        const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
        setColorIndex(prev => prev + 1);
        setRoutine(prev => [...prev, { ...courseEntry, id, color }]);
        showToast(`✓ Added ${courseEntry.code} Section ${courseEntry.section}!`, 'success');
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
