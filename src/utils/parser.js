/**
 * src/utils/parser.js
 * 
 * Parses UIU schedule CSV into structured course objects.
 * 
 * CSV Schedule field format (examples):
 *   "Saturday 08:30-09:50 | Tuesday 08:30-09:50 | 304"
 *   "Sunday 14:00-16:30 | 627 - Computer Lab"
 *   "Wednesday 08:30-11:00 | 729"
 *   "Schedule TBA"
 */

import Papa from 'papaparse';

/** Full day names as they appear in the CSV */
const DAY_NAMES = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Converts a time string like "08:30" into total minutes from midnight.
 * @param {string} timeStr - e.g. "08:30" or "16:30"
 * @returns {number} minutes from midnight
 */
export function timeToMinutes(timeStr) {
    const [h, m] = timeStr.trim().split(':').map(Number);
    return h * 60 + m;
}

/**
 * Parses a single schedule segment like "Saturday 08:30-09:50"
 * @param {string} segment - a single day+time segment
 * @returns {{ day: string, startMin: number, endMin: number } | null}
 */
function parseSegment(segment) {
    const trimmed = segment.trim();
    // Match: "DayName HH:MM-HH:MM"
    const match = trimmed.match(/^(Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/i);
    if (!match) return null;

    const day = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    // Normalize to standard casing
    const normalDay = DAY_NAMES.find(d => d.toLowerCase() === day.toLowerCase()) || day;

    return {
        day: normalDay,
        startMin: timeToMinutes(match[2]),
        endMin: timeToMinutes(match[3]),
        startStr: match[2],
        endStr: match[3],
    };
}

/**
 * Parses the Schedule field string into an array of time slot objects.
 * Filters out room numbers / non-schedule tokens.
 * @param {string} scheduleStr - raw value from CSV "Schedule" column
 * @returns {Array<{ day: string, startMin: number, endMin: number, startStr: string, endStr: string }>}
 */
export function parseScheduleString(scheduleStr) {
    if (!scheduleStr || scheduleStr.trim().toUpperCase() === 'SCHEDULE TBA' || scheduleStr.trim().toUpperCase() === 'TBA') {
        return [];
    }

    const parts = scheduleStr.split('|');
    const slots = [];

    for (const part of parts) {
        const slot = parseSegment(part.trim());
        if (slot) {
            slots.push(slot);
        }
        // else it's a room number token like "304" or "627 - Computer Lab" — skip it
    }

    return slots;
}

/**
 * Cleans up raw room strings from the CSV.
 * e.g. "727 - Computer Lab" → "727 (Lab)"
 *      "304"               → "304"
 */
function cleanRoom(raw) {
    if (!raw) return '';
    // Strip " - Computer Lab" variants (case-insensitive) and append "(Lab)"
    const cleaned = raw.replace(/\s*-\s*computer\s*lab/i, '').trim();
    const isLab = /computer\s*lab/i.test(raw);
    return isLab ? `${cleaned} (Lab)` : cleaned;
}

/**
 * Fetches and parses the UIU schedule CSV file.

 * @param {string} csvPath - path to the CSV (typically '/UIU_Full_Schedule.csv')
 * @returns {Promise<Array>} array of parsed course objects
 */
export async function loadCourseData(csvPath = '/UIU_Full_Schedule.csv') {
    const response = await fetch(csvPath);
    if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            transform: (value) => value.trim(),
            complete: (results) => {
                const courses = results.data
                    .filter(row => row['Course Code'] && row['Course Name'])
                    .map((row) => ({
                        code: row['Course Code'],
                        name: row['Course Name'],
                        section: row['Section'],
                        faculty: row['Faculty'],
                        scheduleRaw: row['Schedule'],
                        room: cleanRoom(row['Room']),
                        slots: parseScheduleString(row['Schedule']),
                    }));
                resolve(courses);
            },
            error: reject,
        });
    });
}

/**
 * Groups course rows by course code, returning a map:
 *   { [courseCode]: { code, name, sections: [ { section, faculty, room, slots } ] } }
 */
export function groupCoursesByCode(courses) {
    const map = {};
    for (const course of courses) {
        if (!map[course.code]) {
            map[course.code] = {
                code: course.code,
                name: course.name,
                sections: [],
            };
        }
        map[course.code].sections.push({
            section: course.section,
            faculty: course.faculty,
            room: course.room,
            scheduleRaw: course.scheduleRaw,
            slots: course.slots,
        });
    }
    return map;
}

/**
 * Formats minutes-from-midnight back to a readable "HH:MM" string.
 */
export function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}
