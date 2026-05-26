"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function PendingApprovalPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams?.get("next");
    const [reason, setReason] = useState(
        "Your institutional access is being verified.",
    );

    useEffect(() => {
        // UX-only. Backend remains source of truth.
        const timeout = setTimeout(() => {
            setReason(
                "You will be able to access the dashboard once your institution approves your onboarding.",
            );
        }, 600);
        return () => clearTimeout(timeout);
    }, []);

    const canGoBack = useMemo(() => Boolean(next), [next]);

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[#05050f] text-white">
            <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h1 className="text-2xl font-bold mb-2">Pending approval</h1>
                <p className="text-white/70 mb-6">{reason}</p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => router.push("/login")}
                        className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15"
                    >
                        Go to login
                    </button>
                    {canGoBack && (
                        <button
                            onClick={() => router.push(next)}
                            className="px-4 py-2 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/35 hover:bg-[#7c3aed]/25"
                        >
                            Back to requested page
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
