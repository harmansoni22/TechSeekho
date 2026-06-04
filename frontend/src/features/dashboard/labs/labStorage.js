/**
 * localStorage helper for Skill Labs project saves.
 *
 * One key per `(techId, exerciseId)` pair, e.g.
 *   techseekho_lab_v3:react:counter
 *
 * Stored value shape:
 *   { code: { html?, css?, js?, jsx? }, activeFile?: string, savedAt: number }
 *
 * All access is wrapped in try/catch — incognito mode and quota-exceeded must
 * fail soft, not blow up the page.
 */

const STORAGE_NAMESPACE = "techseekho_lab_v3";

function keyFor(techId, exerciseId) {
    return `${STORAGE_NAMESPACE}:${techId}:${exerciseId}`;
}

function listIndexKey(techId) {
    return `${STORAGE_NAMESPACE}:${techId}:__index`;
}

function safeGet(key) {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeSet(key, value) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Silently ignore quota/incognito errors.
    }
}

function safeRemove(key) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Silently ignore.
    }
}

/**
 * Save the current editor state for an exercise. Also updates a per-tech
 * index so the landing page can show "N exercises saved" without reading
 * every key.
 *
 * `meta.libraries` is an optional array of CDN library IDs to persist
 * alongside the code (Web lab only — React lab leaves it undefined).
 */
export function saveLabProject(techId, exerciseId, code, meta = {}) {
    if (!techId || !exerciseId) return;
    const payload = {
        code,
        activeFile: meta.activeFile,
        libraries: Array.isArray(meta.libraries) ? meta.libraries : undefined,
        savedAt: meta.savedAt ?? Date.now(),
    };
    safeSet(keyFor(techId, exerciseId), JSON.stringify(payload));

    // Maintain a small per-tech index (set of saved exercise IDs).
    const indexKey = listIndexKey(techId);
    const raw = safeGet(indexKey);
    let index = [];
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) index = parsed;
        } catch {
            // Reset on corruption.
            index = [];
        }
    }
    if (!index.includes(exerciseId)) {
        index.push(exerciseId);
        safeSet(indexKey, JSON.stringify(index));
    }
}

/**
 * Returns `{ code, savedAt }` or `null` if no save exists for this exercise.
 */
export function loadLabProject(techId, exerciseId) {
    if (!techId || !exerciseId) return null;
    const raw = safeGet(keyFor(techId, exerciseId));
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Clears the save for a single exercise. Also drops it from the per-tech
 * index so the dashboard count stays accurate.
 */
export function clearLabProject(techId, exerciseId) {
    if (!techId || !exerciseId) return;
    safeRemove(keyFor(techId, exerciseId));

    const indexKey = listIndexKey(techId);
    const raw = safeGet(indexKey);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        const next = parsed.filter((id) => id !== exerciseId);
        safeSet(indexKey, JSON.stringify(next));
    } catch {
        // ignore
    }
}

/**
 * Returns the set of exercise IDs that have a save for the given tech.
 * Used by the landing-page cards to show a "progress" hint without paying
 * the cost of reading every key.
 */
export function listSavedExerciseIds(techId) {
    if (!techId) return [];
    const raw = safeGet(listIndexKey(techId));
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}
