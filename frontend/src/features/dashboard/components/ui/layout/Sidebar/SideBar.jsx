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

const SideBar = () => {
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
            className="w-full md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:overflow-hidden flex flex-col border-b md:border-r md:border-b-0 backdrop-blur"
            style={{
                backgroundColor:
                    "color-mix(in srgb, var(--dashboard-surface) 94%, var(--role-accent) 6%)",
                borderColor: "var(--dashboard-border)",
                backgroundImage: "var(--role-glow)",
            }}
        >
            {/* Brand header */}
            <div
                className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0"
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
                <div className="min-w-0">
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
            </div>

            {/* Primary nav */}
            <nav
                className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1"
                style={{ scrollbarWidth: "thin" }}
                aria-label="Primary"
            >
                {nav.items.map((item) => {
                    const active = isActiveHref(pathname, item.href, nav.home);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
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
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer: profile/settings + identity card + sign out */}
            <div
                className="flex-shrink-0 border-t px-3 pt-3 pb-4"
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
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors"
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
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div
                    className="mb-3 rounded-lg border px-3 py-2"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor:
                            "color-mix(in srgb, var(--dashboard-surface) 86%, var(--role-accent) 14%)",
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
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all disabled:opacity-60"
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
                    <span>{signingOut ? "Signing out…" : "Sign Out"}</span>
                </button>
            </div>
        </aside>
    );
};

export default SideBar;
