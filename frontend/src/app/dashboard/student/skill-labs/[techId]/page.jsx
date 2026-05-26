"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";
import PracticeEditor from "@/features/dashboard/components/ui/widgets/PracticeEditor.jsx";
import {
    getExercises,
    getTech,
    LAB_TECH_ORDER,
} from "@/features/dashboard/labs/labConfigs";
import {
    clearLabProject,
    listSavedExerciseIds,
    loadLabProject,
    saveLabProject,
} from "@/features/dashboard/labs/labStorage";

/**
 * Per-tech lab experience. Single dynamic route covers all four technologies
 * — the tech config drives editor visibility, exercise list, and React-mode
 * switching. Adding a fifth lab is purely a labConfigs.js edit.
 */
const TechLabPage = () => {
    const { techId } = useParams();
    const tech = getTech(techId);
    const exercises = useMemo(() => getExercises(techId), [techId]);

    const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? null);
    const [savedSet, setSavedSet] = useState(() => new Set());
    const [resetSignal, setResetSignal] = useState(0);

    // Refresh saved badges and restore the last selected exercise per tech.
    useEffect(() => {
        if (!techId) return;
        setSavedSet(new Set(listSavedExerciseIds(techId)));
        const firstExerciseId = exercises[0]?.id ?? null;
        if (!firstExerciseId) return;

        try {
            const recentExerciseId = window.localStorage.getItem(
                `techseekho_lab_v3:${techId}:__recentExercise`,
            );
            const nextExerciseId = exercises.some(
                (exercise) => exercise.id === recentExerciseId,
            )
                ? recentExerciseId
                : firstExerciseId;
            setExerciseId(nextExerciseId);
        } catch {
            setExerciseId(firstExerciseId);
        }
    }, [techId, exercises]);

    useEffect(() => {
        if (!techId || !exerciseId) return;
        try {
            window.localStorage.setItem(
                `techseekho_lab_v3:${techId}:__recentExercise`,
                exerciseId,
            );
        } catch {
            // localStorage can fail in private browsing; the lab still works.
        }
    }, [techId, exerciseId]);

    if (!tech || exercises.length === 0) {
        // Unknown tech in the URL → 404 via Next's notFound boundary.
        notFound();
    }

    const exercise = exercises.find((e) => e.id === exerciseId) ?? exercises[0];

    const onClearSave = () => {
        if (!exercise) return;
        clearLabProject(techId, exercise.id);
        const next = new Set(savedSet);
        next.delete(exercise.id);
        setSavedSet(next);
        setResetSignal((value) => value + 1);
    };

    const loadCurrentProject = useCallback(
        () => loadLabProject(techId, exercise.id),
        [techId, exercise.id],
    );

    const onSaveProject = useCallback(
        (snapshot) => {
            saveLabProject(techId, exercise.id, snapshot.code, {
                activeFile: snapshot.activeFile,
                savedAt: snapshot.savedAt,
            });
            setSavedSet((current) => {
                const next = new Set(current);
                next.add(exercise.id);
                return next;
            });
        },
        [techId, exercise.id],
    );

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar title={tech.title} subtitle={tech.tagline} />

            {/* Breadcrumb + tech tabs */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                    href="/dashboard/student/skill-labs"
                    className="cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        color: "var(--dashboard-fg)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    ← All labs
                </Link>
                {LAB_TECH_ORDER.map((id) => {
                    const t = getTech(id);
                    const isActive = id === techId;
                    return (
                        <Link
                            key={id}
                            href={`/dashboard/student/skill-labs/${id}`}
                            aria-current={isActive ? "page" : undefined}
                            className={`rounded-md border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 ${
                                isActive
                                    ? "cursor-default"
                                    : "cursor-pointer hover:opacity-90"
                            }`}
                            style={{
                                borderColor: isActive
                                    ? t.accent
                                    : "var(--dashboard-border)",
                                color: isActive
                                    ? t.accent
                                    : "var(--dashboard-muted)",
                                backgroundColor: "var(--dashboard-surface)",
                                fontWeight: isActive ? 600 : 500,
                            }}
                        >
                            {t.label}
                        </Link>
                    );
                })}
            </div>

            <Panel
                eyebrow="Current exercise"
                title={exercise.title}
                description={`Difficulty: ${exercise.difficulty}`}
                actions={
                    savedSet.has(exercise.id) ? (
                        <button
                            type="button"
                            onClick={onClearSave}
                            className="cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-muted)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            Clear save
                        </button>
                    ) : null
                }
            >
                <p
                    className="text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {exercise.instructions}
                </p>
            </Panel>

            <PracticeEditor
                storageKey={`techseekho_lab_v3:${techId}:${exercise.id}`}
                initial={exercise.starter}
                langs={tech.langs}
                mode={tech.mode}
                loadProject={loadCurrentProject}
                saveProject={onSaveProject}
                resetSignal={resetSignal}
                title={`${exercise.title} workspace`}
                description={exercise.instructions}
            />

            <Panel
                eyebrow="Library"
                title="Pick a different exercise"
                description="Your code for each exercise is saved separately on this device."
            >
                <ul className="grid gap-2 sm:grid-cols-2">
                    {exercises.map((ex) => {
                        const isActive = ex.id === exercise.id;
                        const isSaved = savedSet.has(ex.id);
                        return (
                            <li key={ex.id}>
                                <button
                                    type="button"
                                    onClick={() => setExerciseId(ex.id)}
                                    aria-current={isActive ? "true" : undefined}
                                    className={`w-full rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 ${
                                        isActive
                                            ? "cursor-default"
                                            : "cursor-pointer hover:opacity-95"
                                    }`}
                                    style={{
                                        borderColor: isActive
                                            ? tech.accent
                                            : "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-sm font-semibold"
                                            style={{
                                                color: "var(--dashboard-fg)",
                                            }}
                                        >
                                            {ex.title}
                                        </span>
                                        <span
                                            className="cursor-default text-[10px] uppercase tracking-wide"
                                            style={{
                                                color: isSaved
                                                    ? tech.accent
                                                    : "var(--dashboard-muted)",
                                            }}
                                        >
                                            {isSaved ? "Saved" : ex.difficulty}
                                        </span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Panel>

            {tech.mode === "react" ? (
                <Panel
                    eyebrow="How this lab runs"
                    title="React in the browser"
                    description="Tech-specific notes for this lab."
                >
                    <p
                        className="text-sm"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        JSX is compiled by{" "}
                        <code
                            className="rounded px-1"
                            style={{
                                backgroundColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                            }}
                        >
                            @babel/standalone
                        </code>{" "}
                        inside the sandboxed iframe. The first run fetches
                        React, ReactDOM, and Babel from unpkg; subsequent runs
                        use the browser cache. There is no transpile step in the
                        host page bundle — all of this stays inside the preview
                        frame.
                    </p>
                </Panel>
            ) : null}
        </div>
    );
};

export default TechLabPage;
