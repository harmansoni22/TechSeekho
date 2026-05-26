"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";
import {
    getExercises,
    LAB_TECH_ORDER,
    LAB_TECHS,
} from "@/features/dashboard/labs/labConfigs";
import { listSavedExerciseIds } from "@/features/dashboard/labs/labStorage";

/**
 * Skill Labs landing — one card per technology. Each card deep-links into
 * its own dedicated `/skill-labs/{techId}` route where the actual editor
 * runs. All exercises and saved-progress hints come from the centralized
 * labConfigs + labStorage; the cards don't know how the editor works.
 */

const SkillLabsLandingPage = () => {
    // Read saved counts on mount. We don't subscribe to localStorage
    // changes — the user will see fresh counts next time they revisit
    // the landing page, which is the only place the badge appears.
    const [savedCounts, setSavedCounts] = useState({});

    useEffect(() => {
        const counts = {};
        for (const techId of LAB_TECH_ORDER) {
            counts[techId] = listSavedExerciseIds(techId).length;
        }
        setSavedCounts(counts);
    }, []);

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="Skill Labs"
                subtitle="Pick a technology and start practicing. Everything runs in your browser."
            />

            <Panel
                eyebrow="Browser sandbox"
                title="Practice by technology"
                description="Each lab gives you starter code, exercises, a sandboxed live preview, and per-exercise local save slots."
            >
                <ul className="grid gap-4 md:grid-cols-2">
                    {LAB_TECH_ORDER.map((techId) => (
                        <li key={techId}>
                            <TechCard
                                tech={LAB_TECHS[techId]}
                                exerciseCount={getExercises(techId).length}
                                savedCount={savedCounts[techId] ?? 0}
                            />
                        </li>
                    ))}
                </ul>
            </Panel>
        </div>
    );
};

const TechCard = ({ tech, exerciseCount, savedCount }) => {
    const progress = exerciseCount
        ? Math.min(100, (savedCount / exerciseCount) * 100)
        : 0;
    return (
        <Link
            href={`/dashboard/student/skill-labs/${tech.id}`}
            className="group block cursor-pointer rounded-xl border p-5 transition hover:opacity-95 focus:outline-none focus:ring-2"
            style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "var(--dashboard-surface)",
                boxShadow: "var(--dashboard-shadow)",
            }}
            aria-label={`Open ${tech.label} lab`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <span
                            className="cursor-default inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                            style={{
                                backgroundColor: tech.accent,
                                color: "#ffffff",
                            }}
                            aria-hidden="true"
                        >
                            {tech.label.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                            <p
                                className="cursor-default text-[10px] uppercase tracking-[0.22em]"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                {tech.tagline}
                            </p>
                            <h3
                                className="font-display text-lg"
                                style={{ color: "var(--dashboard-fg)" }}
                            >
                                {tech.title}
                            </h3>
                        </div>
                    </div>
                </div>
                <span
                    className="cursor-default whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                        backgroundColor: "var(--dashboard-border)",
                        color: "var(--dashboard-muted)",
                    }}
                >
                    {tech.difficulty}
                </span>
            </div>

            <p
                className="mt-3 text-sm"
                style={{ color: "var(--dashboard-muted)" }}
            >
                {tech.description}
            </p>

            <div className="mt-4 flex items-center gap-3">
                <div
                    className="progress-track h-1.5 flex-1 overflow-hidden rounded-full"
                    aria-hidden="true"
                >
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: tech.accent,
                        }}
                    />
                </div>
                <span
                    className="cursor-default text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {savedCount}/{exerciseCount} saved
                </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <span
                    className="cursor-default text-xs"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {exerciseCount} exercise
                    {exerciseCount === 1 ? "" : "s"}
                </span>
                <span
                    className="text-sm font-semibold transition group-hover:translate-x-0.5"
                    style={{ color: tech.accent }}
                >
                    Start practice →
                </span>
            </div>
        </Link>
    );
};

export default SkillLabsLandingPage;
