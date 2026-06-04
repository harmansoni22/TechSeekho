"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SideBar from "@/features/dashboard/components/ui/layout/Sidebar/SideBar";

const SIDEBAR_STORAGE_KEY = "techseekho_dashboard_sidebar_collapsed";

/**
 * Shared dashboard shell for every role (Super Admin, Admin, Coordinator,
 * Trainer, Student). It owns the single SideBar instance and the responsive
 * behaviour around it:
 *
 *  - Desktop (>=768px): a persistent left rail that can be expanded (labels)
 *    or collapsed (icons only). The collapsed preference is persisted in
 *    localStorage and the content area animates its left margin to match.
 *  - Tablet / mobile (<768px): the rail becomes an off-canvas drawer. It is
 *    hidden by default, opened via the hamburger button in the mobile header,
 *    and closed by the backdrop, the ESC key, navigating, or resizing up to
 *    desktop. Focus management lives in SideBar (it owns the drawer DOM).
 *
 * The drawer is never rendered as a stacked full-width column above content —
 * the SideBar is `fixed` at every breakpoint, so on mobile the content keeps
 * the full viewport width.
 */
const DashboardChrome = ({ children }) => {
    const pathname = usePathname();
    // Immersive layout (no sidebar, full-width canvas) only applies to the
    // actual code editor under `/skill-labs/{techId}`. The Skill Labs LANDING
    // page keeps the regular dashboard chrome so students can still navigate
    // via the global sidebar.
    const immersive = Boolean(
        pathname && /^\/dashboard\/student\/skill-labs\/[^/]+/.test(pathname),
    );
    const [collapsed, setCollapsed] = useState(false);
    const [desktop, setDesktop] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const hamburgerRef = useRef(null);

    useEffect(() => {
        try {
            setCollapsed(
                window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
            );
        } catch {
            // localStorage is optional chrome persistence.
        }
    }, []);

    useEffect(() => {
        const update = () => setDesktop(window.innerWidth >= 768);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Close the mobile drawer whenever we navigate to a new route so the rail
    // doesn't linger over the freshly loaded page. `pathname` is the trigger
    // even though the body doesn't read it.
    // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the intended trigger
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // The drawer is a mobile-only concept. Once we cross into desktop the
    // persistent rail takes over, so drop any lingering open state.
    useEffect(() => {
        if (desktop) setDrawerOpen(false);
    }, [desktop]);

    // Lock body scroll and wire ESC-to-close while the drawer is open.
    useEffect(() => {
        if (!drawerOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (event) => {
            if (event.key === "Escape") setDrawerOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [drawerOpen]);

    const toggleCollapsed = () => {
        setCollapsed((current) => {
            const next = !current;
            try {
                window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
            } catch {
                // localStorage is optional chrome persistence.
            }
            return next;
        });
    };

    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    if (immersive) {
        return (
            <section
                className="flex-1 overflow-y-auto"
                style={{ color: "var(--dashboard-fg)" }}
            >
                <div className="w-full px-2 py-2 md:px-3 md:py-3">
                    {children}
                </div>
            </section>
        );
    }

    return (
        <>
            <SideBar
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
                desktop={desktop}
                drawerOpen={drawerOpen}
                onCloseDrawer={closeDrawer}
                triggerRef={hamburgerRef}
            />

            {/* Drawer backdrop (mobile only). A real button keeps click-to-close
                keyboard accessible without handlers on a non-interactive div. */}
            {drawerOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={closeDrawer}
                    className="fixed inset-0 z-40 border-0 md:hidden"
                    style={{
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        cursor: "default",
                    }}
                />
            )}

            <section
                className="flex-1 overflow-y-auto transition-[margin] duration-300 ease-out"
                style={{
                    color: "var(--dashboard-fg)",
                    marginLeft: !desktop
                        ? 0
                        : collapsed
                          ? "var(--dashboard-sidebar-collapsed)"
                          : "var(--dashboard-sidebar-expanded)",
                }}
            >
                {/* Mobile header: hosts the hamburger that opens the drawer.
                    Hidden on desktop where the persistent rail is always shown. */}
                <header
                    className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 md:hidden"
                    style={{
                        backgroundColor: "var(--dashboard-surface)",
                        borderColor: "var(--dashboard-border)",
                    }}
                >
                    <button
                        ref={hamburgerRef}
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open navigation menu"
                        aria-expanded={drawerOpen}
                        aria-controls="dashboard-sidebar"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border focus:outline-none focus:ring-2"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            color: "var(--dashboard-fg)",
                            backgroundColor: "var(--dashboard-surface)",
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 12h18" />
                            <path d="M3 6h18" />
                            <path d="M3 18h18" />
                        </svg>
                    </button>
                    <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        Dashboard
                    </span>
                </header>

                <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
                    {children}
                </div>
            </section>
        </>
    );
};

export default DashboardChrome;
