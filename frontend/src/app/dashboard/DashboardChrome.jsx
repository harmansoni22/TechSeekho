"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SideBar from "@/features/dashboard/components/ui/layout/Sidebar/SideBar";

const SIDEBAR_STORAGE_KEY = "techseekho_dashboard_sidebar_collapsed";

const DashboardChrome = ({ children }) => {
    const pathname = usePathname();
    const immersive = pathname?.startsWith("/dashboard/student/skill-labs");
    const [collapsed, setCollapsed] = useState(false);
    const [desktop, setDesktop] = useState(false);

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

    return (
        <>
            {immersive ? null : (
                <SideBar
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                />
            )}
            <section
                className="flex-1 overflow-y-auto transition-[margin] duration-300 ease-out"
                style={{
                    color: "var(--dashboard-fg)",
                    marginLeft: !desktop
                        ? 0
                        : immersive
                          ? 0
                          : collapsed
                            ? "var(--dashboard-sidebar-collapsed)"
                            : "var(--dashboard-sidebar-expanded)",
                }}
            >
                <div
                    className={
                        immersive
                            ? "w-full px-2 py-2 md:px-3 md:py-3"
                            : "mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10"
                    }
                >
                    {children}
                </div>
            </section>
        </>
    );
};

export default DashboardChrome;
