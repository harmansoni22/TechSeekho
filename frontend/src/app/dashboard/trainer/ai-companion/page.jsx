"use client";

import { useState } from "react";
import RoleHero from "@/features/dashboard/components/ui/layout/PageShell/RoleHero";
import Panel from "@/features/dashboard/components/ui/widgets/Panel";
import { api } from "@/lib/api";

/**
 * Trainer AI Companion.
 *
 * Wraps the existing /ai/chat endpoint (Hugging Face → Qwen). Each request is
 * stateless — no session memory yet. Backend already enforces requireRole
 * including TRAINER for /ai/chat.
 */
export default function TrainerAiCompanionPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        const text = input.trim();
        if (!text || busy) return;
        setError(null);
        setBusy(true);

        const userMsg = { id: `u-${Date.now()}`, role: "user", text };
        const next = [...messages, userMsg];
        setMessages(next);
        setInput("");

        try {
            const res = await api("/ai/chat", {
                method: "POST",
                body: JSON.stringify({ message: text }),
            });
            setMessages([
                ...next,
                {
                    id: `a-${Date.now()}`,
                    role: "assistant",
                    text: res?.response ?? "(no reply)",
                },
            ]);
        } catch (err) {
            setError(err.message);
            setMessages(next); // keep user message visible above the error
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-8">
            <RoleHero
                eyebrow="Learning Craft · AI Companion"
                title="A draft partner for lesson prep."
                subtitle="Stateless chat — each question is independent. Don't paste student PII; the prompt isn't private to your institution."
            />

            <Panel
                eyebrow="Chat"
                title="Ask a teaching question"
                description="Each prompt stands alone — there's no conversation memory yet."
            >
                <div
                    className="mb-4 max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor:
                            "color-mix(in srgb, var(--dashboard-surface) 96%, var(--role-accent) 4%)",
                    }}
                >
                    {messages.length === 0 && (
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            No messages yet. Try "Suggest a 30-minute lesson on
                            basic Python loops."
                        </p>
                    )}
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className="rounded-md px-3 py-2 text-sm"
                            style={{
                                backgroundColor:
                                    m.role === "user"
                                        ? "var(--dashboard-surface)"
                                        : "var(--role-accent-soft)",
                                color: "var(--dashboard-fg)",
                                borderLeft:
                                    m.role === "user"
                                        ? "2px solid var(--role-accent)"
                                        : "2px solid transparent",
                            }}
                        >
                            <p
                                className="mb-1 text-[10px] uppercase tracking-[0.18em]"
                                style={{ color: "var(--role-accent)" }}
                            >
                                {m.role}
                            </p>
                            {m.text}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask something…"
                        className="flex-1 rounded-md border px-3 py-2 text-sm"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                            color: "var(--dashboard-fg)",
                        }}
                        disabled={busy}
                    />
                    <button
                        type="submit"
                        disabled={busy || !input.trim()}
                        className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                        }}
                    >
                        {busy ? "…" : "Send"}
                    </button>
                </form>

                {error && (
                    <p className="mt-3 text-sm" style={{ color: "#b91c1c" }}>
                        {error}
                    </p>
                )}
            </Panel>
        </div>
    );
}
