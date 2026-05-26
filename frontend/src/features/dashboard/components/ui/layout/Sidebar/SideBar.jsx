"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { navForRole } from "@/features/dashboard/config/navConfig";
import { useRoleTheme } from "@/features/dashboard/context/RoleThemeContext";
import { cn } from "@/lib/cn";

/**
 * Role-aware dashboard sidebar.
 *
 * Reads the active role from session + RoleThemeContext and renders only the
 * navigation entries that belong to that role. There is no global / shared
 * nav — every link points to a role-scoped route. Active state is computed
 * against `pathname` so deep-links (e.g. /dashboard/student/courses/abc)
 * still highlight the "My Courses" entry.
 *
 * Sign-out goes through `next-auth/react` so the JWT cookie is invalidated
 * before redirect; never clear it manually.
 */
const Icon = ({ d, size = 18 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {d.split(/\s+M/).map((segment, idx) => (
            <path
                key={`${segment.slice(0, 6)}-${idx}`}
                d={idx === 0 ? segment : `M${segment}`}
            />
        ))}
    </svg>
);

const isActiveHref = (pathname, href, home) => {
    if (!pathname) return false;
    // The role home should not light up for every nested route.
    if (href === home) return pathname === home;
    return pathname === href || pathname.startsWith(`${href}/`);
};

const SideBar = ({ collapsed = false, onToggleCollapsed }) => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { role, theme } = useRoleTheme();
    const [signingOut, setSigningOut] = useState(false);

    const nav = useMemo(() => navForRole(role), [role]);

    const userName = session?.user?.name || "Member";
    const userEmail = session?.user?.email || "";
    const monogram = theme?.monogram ?? "TS";

    const handleSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOut({ callbackUrl: "/login" });
        } finally {
            setSigningOut(false);
        }
    };

    return (
        <aside
            className={cn(
                "w-full md:fixed md:left-0 md:top-0 md:h-screen md:overflow-hidden flex flex-col border-b md:border-r md:border-b-0 transition-[width] duration-300 ease-out",
                collapsed ? "md:w-[4.75rem]" : "md:w-64",
            )}
            style={{
                // Chrome tracks the dashboard theme. Role personality lives on
                // interactive surfaces below (active nav item, monogram, sign
                // out) so the sidebar still feels role-flavored without
                // freezing the bg into a warm amber tint across every theme.
                backgroundColor: "var(--dashboard-surface)",
                color: "var(--dashboard-fg)",
                borderColor: "var(--dashboard-border)",
            }}
        >
            {/* Brand header */}
            <div
                className={cn(
                    "flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0",
                    collapsed && "md:justify-center md:px-3",
                )}
                style={{ borderBottom: "1px solid var(--dashboard-border)" }}
            >
                <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md font-semibold tracking-tight"
                    style={{
                        backgroundColor: "var(--role-accent)",
                        color: "var(--role-accent-ink)",
                        fontFamily:
                            '"Fraunces", "Cormorant Garamond", "Iowan Old Style", serif',
                        boxShadow: "0 8px 24px var(--role-accent-soft)",
                    }}
                >
                    {monogram}
                </span>
                <div className={cn("min-w-0", collapsed && "md:hidden")}>
                    <p
                        className="text-[10px] uppercase tracking-[0.22em]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        TechSeekho
                    </p>
                    <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {theme?.label ?? "Dashboard"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    aria-label={
                        collapsed
                            ? "Expand dashboard sidebar"
                            : "Collapse dashboard sidebar"
                    }
                    className={cn(
                        "ml-auto hidden h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition hover:opacity-90 focus:outline-none focus:ring-2 md:inline-flex",
                        collapsed && "md:absolute md:right-2 md:top-2",
                    )}
                    style={{
                        borderColor: "var(--dashboard-border)",
                        color: "var(--dashboard-muted)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        {collapsed ? (
                            <path d="M9 18l6-6-6-6" />
                        ) : (
                            <path d="M15 18l-6-6 6-6" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Primary nav */}
            <nav
                className={cn(
                    "flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1",
                    collapsed && "md:px-2 md:items-center",
                )}
                style={{ scrollbarWidth: "thin" }}
                aria-label="Primary"
            >
                {nav.items.map((item) => {
                    const active = isActiveHref(pathname, item.href, nav.home);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            aria-current={active ? "page" : undefined}
                            aria-label={collapsed ? item.label : undefined}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                collapsed &&
                                    "md:h-11 md:w-11 md:justify-center md:px-0",
                                active
                                    ? "text-[var(--role-accent-ink)]"
                                    : "hover:translate-x-[1px]",
                            )}
                            style={
                                active
                                    ? {
                                          backgroundColor: "var(--role-accent)",
                                          boxShadow:
                                              "0 6px 18px var(--role-accent-soft)",
                                      }
                                    : {
                                          color: "var(--dashboard-fg)",
                                      }
                            }
                        >
                            {active ? null : (
                                <span
                                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                    style={{
                                        backgroundColor: "var(--role-accent)",
                                    }}
                                />
                            )}
                            <span
                                className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                                    active ? "" : "group-hover:scale-[1.02]",
                                )}
                                style={
                                    active
                                        ? {
                                              backgroundColor:
                                                  "rgba(255,255,255,0.18)",
                                              color: "var(--role-accent-ink)",
                                          }
                                        : {
                                              backgroundColor:
                                                  "var(--role-accent-soft)",
                                              color: "var(--role-accent)",
                                          }
                                }
                            >
                                <Icon d={item.icon} size={16} />
                            </span>
                            <span
                                className={cn(
                                    "truncate",
                                    collapsed && "md:hidden",
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer: profile/settings + identity card + sign out */}
            <div
                className={cn(
                    "flex-shrink-0 border-t px-3 pt-3 pb-4",
                    collapsed && "md:px-2",
                )}
                style={{ borderColor: "var(--dashboard-border)" }}
            >
                <div className="flex flex-col gap-1 pb-3">
                    {nav.footer.map((item) => {
                        const active = isActiveHref(
                            pathname,
                            item.href,
                            nav.home,
                        );
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                aria-label={collapsed ? item.label : undefined}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                                    collapsed &&
                                        "md:h-10 md:justify-center md:px-0",
                                )}
                                style={{
                                    color: active
                                        ? "var(--role-accent)"
                                        : "var(--dashboard-muted)",
                                    backgroundColor: active
                                        ? "var(--role-accent-soft)"
                                        : "transparent",
                                }}
                            >
                                <Icon d={item.icon} size={14} />
                                <span className={cn(collapsed && "md:hidden")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div
                    className={cn(
                        "mb-3 rounded-lg border px-3 py-2",
                        collapsed && "md:hidden",
                    )}
                    style={{
                        borderColor: "var(--dashboard-border)",
                        // Identity card stays on theme. The accent shows up on
                        // the sign-out button below it instead.
                        backgroundColor:
                            "color-mix(in srgb, var(--dashboard-surface) 92%, var(--dashboard-fg) 8%)",
                    }}
                >
                    <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {userName}
                    </p>
                    <p
                        className="truncate text-[11px]"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {userEmail}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    title={collapsed ? "Sign out" : undefined}
                    aria-label={collapsed ? "Sign out" : undefined}
                    className={cn(
                        "w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
                        collapsed && "md:h-10 md:px-0",
                    )}
                    style={{
                        backgroundColor: "var(--role-accent)",
                        color: "var(--role-accent-ink)",
                        boxShadow: "0 10px 26px var(--role-accent-soft)",
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                    </svg>
                    <span className={cn(collapsed && "md:hidden")}>
                        {signingOut ? "Signing out…" : "Sign Out"}
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default SideBar;
