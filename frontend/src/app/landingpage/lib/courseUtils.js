// days in milliseconds:
// 24 hrs in one day * 60 mins in hr * 60 secs in min * 1000ms in sec
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// fetch course date
function parseCourseDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const [, year, month, day] = match;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCourseDate(value, locale = "en-IN") {
    const date = parseCourseDate(value);
    if (!date) return "N/A";

    return date.toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function getCourseDurationDays(startsAt, endDate) {
    const start = parseCourseDate(startsAt);
    const end = parseCourseDate(endDate);

    if (!start || !end) return null;

    const rawDiff = end.getTime() - start.getTime();
    if (rawDiff < 0) return null;

    return Math.floor(rawDiff / DAY_IN_MS) + 1;
}

export function getCourseDurationLabel(startsAt, endDate) {
    const durationDays = getCourseDurationDays(startsAt, endDate);
    if (durationDays === null) return "N/A";

    if (durationDays % 30 === 0) {
        const months = durationDays / 30;
        return `${months} month${months > 1 ? "s" : ""}`;
    }

    if (durationDays % 7 === 0) {
        const weeks = durationDays / 7;
        return `${weeks} week${weeks > 1 ? "s" : ""}`;
    }

    return `${durationDays} day${durationDays > 1 ? "s" : ""}`;
}
