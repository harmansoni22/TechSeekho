"use client";

import { useCallback, useRef, useState } from "react";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";
import Panel from "@/features/dashboard/components/ui/widgets/Panel.jsx";
import { api } from "@/lib/api";

const SUGGESTIONS = [
    "What does Module 3 of my path cover?",
    "Summarize the difference between supervised and unsupervised learning.",
    "Give me one practice problem on JavaScript Promises.",
    "What should I review before the next assessment?",
];

const StudentAiCompanionPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const send = useCallback(
        async (text) => {
            const trimmed = (text ?? "").trim();
            if (!trimmed || sending) return;
            setError(null);
            setSending(true);
            const userMessage = {
                id: `u-${Date.now()}`,
                role: "user",
                content: trimmed,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            try {
                const result = await api("/ai/chat", {
                    method: "POST",
                    body: JSON.stringify({ message: trimmed }),
                });
                const reply = result?.data?.response ?? "(empty reply)";
                setMessages((prev) => [
                    ...prev,
                    {
                        id: result?.data?.messageId ?? `a-${Date.now()}`,
                        role: "assistant",
                        content: reply,
                        createdAt:
                            result?.data?.timestamp ?? new Date().toISOString(),
                    },
                ]);
            } catch (err) {
                setError(err.message);
            } finally {
                setSending(false);
                inputRef.current?.focus();
            }
        },
        [sending],
    );

    const onSubmit = (e) => {
        e.preventDefault();
        send(input);
    };

    const onClear = () => {
        setMessages([]);
        setError(null);
        setInput("");
    };

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="AI Companion"
                subtitle="Course-grounded helper — independent of your operational data"
            />

            <Panel
                eyebrow="Chat"
                title="Ask about your coursework"
                description="Each message is independent — there is no persistent memory across sessions"
                actions={
                    messages.length > 0 ? (
                        <button
                            type="button"
                            onClick={onClear}
                            className="cursor-pointer rounded-md border px-3 py-1 text-xs font-medium transition hover:opacity-90 focus:outline-none focus:ring-2"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                color: "var(--dashboard-fg)",
                                backgroundColor: "var(--dashboard-surface)",
                            }}
                        >
                            Clear chat
                        </button>
                    ) : undefined
                }
            >
                {messages.length === 0 ? (
                    <div className="space-y-3">
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            Pick a starter prompt or type your own question.
                        </p>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {SUGGESTIONS.map((s) => (
                                <li key={s}>
                                    <button
                                        type="button"
                                        onClick={() => send(s)}
                                        disabled={sending}
                                        className="w-full cursor-pointer rounded-lg border px-3 py-2 text-left text-sm transition hover:opacity-95 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                                        style={{
                                            borderColor:
                                                "var(--dashboard-border)",
                                            color: "var(--dashboard-fg)",
                                            backgroundColor:
                                                "var(--dashboard-surface)",
                                        }}
                                    >
                                        {s}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {messages.map((m) => (
                            <li
                                key={m.id}
                                className="rounded-lg border p-3"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor:
                                        m.role === "user"
                                            ? "color-mix(in srgb, var(--dashboard-surface) 80%, var(--dashboard-primary) 20%)"
                                            : "var(--dashboard-surface)",
                                }}
                            >
                                <p
                                    className="text-[10px] uppercase tracking-[0.24em]"
                                    style={{
                                        color: "var(--dashboard-muted)",
                                    }}
                                >
                                    {m.role === "user" ? "You" : "AI Companion"}
                                </p>
                                <p
                                    className="mt-1 whitespace-pre-wrap text-sm"
                                    style={{ color: "var(--dashboard-fg)" }}
                                >
                                    {m.content}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}

                {error && (
                    <p
                        className="mt-3 rounded border p-3 text-sm"
                        style={{
                            borderColor: "rgba(239, 68, 68, 0.5)",
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            color: "#ef4444",
                        }}
                    >
                        {error}
                    </p>
                )}

                <form className="mt-4 flex gap-2" onSubmit={onSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question…"
                        maxLength={2000}
                        disabled={sending}
                        className="flex-1 rounded-md border px-3 py-2 text-sm"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                            color: "var(--dashboard-fg)",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition hover:opacity-95 focus:outline-none focus:ring-2 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: "var(--dashboard-primary)",
                            color: "var(--dashboard-primary-fg)",
                            opacity: sending || !input.trim() ? 0.6 : 1,
                        }}
                    >
                        {sending ? "Sending…" : "Send"}
                    </button>
                </form>
            </Panel>

            <Panel
                eyebrow="Boundaries"
                title="What the companion will and won't do"
            >
                <ul
                    className="list-disc space-y-2 pl-5 text-sm"
                    style={{ color: "var(--dashboard-muted)" }}
                >
                    <li>
                        Will: explain course concepts, suggest practice
                        problems, summarize topics, and recommend TechSeekho
                        courses from the public catalog.
                    </li>
                    <li>
                        Will not: see your private operational data (attendance,
                        marks, submissions). Use the analytics page for that.
                    </li>
                    <li>
                        Will not: persist chat history across page reloads. If
                        you need a record, copy the message.
                    </li>
                </ul>
            </Panel>
        </div>
    );
};

export default StudentAiCompanionPage;
