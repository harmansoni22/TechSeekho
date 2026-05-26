"use client";

import Panel from "./Panel";

/**
 * Editorial scaffold for pages whose backend endpoints are not yet
 * implemented. Surfaces a clear note for engineers (which endpoint is
 * required, what shape) while still presenting a designed surface for
 * stakeholders to review the eventual layout.
 *
 * Pass `endpoints` to enumerate the missing API calls, and `previewSlots`
 * to render skeletal placeholders for the eventual content.
 */
const BackendPending = ({
    endpoints = [],
    whatItDoes,
    previewSlots = [],
    note,
}) => (
    <Panel
        eyebrow="Backend pending"
        title="This view is wired for the moment its API ships."
        description="The layout, accent, and data flow are ready. Connect the listed endpoints to the existing `useAuthedResource` hook and the page becomes live without further UI work."
    >
        <div className="grid gap-6 md:grid-cols-2">
            <div>
                <h3
                    className="font-display text-base"
                    style={{ color: "var(--dashboard-fg)", fontWeight: 500 }}
                >
                    What this view will do
                </h3>
                <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    {whatItDoes}
                </p>

                {endpoints.length > 0 && (
                    <div className="mt-5">
                        <p
                            className="text-[10px] uppercase tracking-[0.24em]"
                            style={{ color: "var(--role-accent)" }}
                        >
                            Endpoints required
                        </p>
                        <ul className="mt-2 space-y-1.5 text-sm">
                            {endpoints.map((ep, idx) => (
                                <li
                                    key={ep.name ?? idx}
                                    className="rounded-md border px-3 py-2 font-mono text-[12px]"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "color-mix(in srgb, var(--dashboard-surface) 90%, var(--role-accent) 10%)",
                                        color: "var(--dashboard-fg)",
                                    }}
                                >
                                    <span
                                        style={{ color: "var(--role-accent)" }}
                                    >
                                        {ep.method}
                                    </span>{" "}
                                    {ep.path}
                                    {ep.purpose && (
                                        <span
                                            className="ml-2 text-[11px] font-sans"
                                            style={{
                                                color: "var(--dashboard-muted)",
                                            }}
                                        >
                                            — {ep.purpose}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {note && (
                    <p
                        className="mt-5 text-xs italic"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {note}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                <p
                    className="text-[10px] uppercase tracking-[0.24em]"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    Layout preview
                </p>
                {previewSlots.length === 0
                    ? ["a", "b", "c"].map((tag, i) => (
                          <SkeletonBlock key={tag} delay={i * 0.08} />
                      ))
                    : previewSlots.map((slot, idx) => (
                          <SkeletonBlock
                              key={slot + idx}
                              delay={idx * 0.08}
                              label={slot}
                          />
                      ))}
            </div>
        </div>
    </Panel>
);

const SkeletonBlock = ({ delay = 0, label }) => (
    <div
        className="rounded-lg border px-4 py-3"
        style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor:
                "color-mix(in srgb, var(--dashboard-surface) 96%, var(--role-accent) 4%)",
        }}
    >
        {label && (
            <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--role-accent)" }}
            >
                {label}
            </p>
        )}
        <div
            className="mt-2 h-2 w-2/3 rounded-full opacity-60"
            style={{
                backgroundColor: "var(--dashboard-border)",
                animation: `dash-pulse 1.6s ${delay}s ease-in-out infinite`,
            }}
        />
        <div
            className="mt-2 h-2 w-1/2 rounded-full opacity-40"
            style={{
                backgroundColor: "var(--dashboard-border)",
                animation: `dash-pulse 1.6s ${delay + 0.15}s ease-in-out infinite`,
            }}
        />
    </div>
);

export default BackendPending;
