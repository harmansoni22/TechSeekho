"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
 *
 * Responsive behaviour (driven by DashboardChrome):
 *  - Desktop (>=768px): a persistent fixed rail, expandable or collapsed to
 *    icons-only via `collapsed`. Tooltips (native `title`) surface labels when
 *    collapsed.
 *  - Mobile (<768px): the same `<aside>` becomes an off-canvas drawer that
 *    slides in from the left when `drawerOpen` is true. While closed it is
 *    translated off-screen and made `inert` so it stays out of the tab order
 *    and away from assistive tech. While open, focus is trapped inside it and
 *    returned to the hamburger (`triggerRef`) on close.
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

// A single nav link. Module-level so both the flat and grouped render paths
// share one implementation (active state is computed by the caller).
const NavItem = ({ item, active, collapsed, onClick }) => (
    <Link
        href={item.href}
        onClick={onClick}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            collapsed && "md:h-11 md:w-11 md:justify-center md:px-0",
            active
                ? "text-[var(--role-accent-ink)]"
                : "hover:translate-x-[1px]",
        )}
        style={
            active
                ? {
                      backgroundColor: "var(--role-accent)",
                      boxShadow: "0 6px 18px var(--role-accent-soft)",
                  }
                : { color: "var(--dashboard-fg)" }
        }
    >
        {active ? null : (
            <span
                className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: "var(--role-accent)" }}
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
                          backgroundColor: "rgba(255,255,255,0.18)",
                          color: "var(--role-accent-ink)",
                      }
                    : {
                          backgroundColor: "var(--role-accent-soft)",
                          color: "var(--role-accent)",
                      }
            }
        >
            <Icon d={item.icon} size={16} />
        </span>
        <span className={cn("truncate", collapsed && "md:hidden")}>
            {item.label}
        </span>
    </Link>
);

const SideBar = ({
    collapsed = false,
    onToggleCollapsed,
    desktop = false,
    drawerOpen = false,
    onCloseDrawer,
    triggerRef,
}) => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { role, theme } = useRoleTheme();
    const [signingOut, setSigningOut] = useState(false);
    const asideRef = useRef(null);

    const nav = useMemo(() => navForRole(role), [role]);

    // Collapsible nav groups (expanded rail only). Every group defaults open;
    // the group that holds the active route is force-open and not collapsible,
    // so the user can never hide the page they're currently on. State is keyed
    // by group label and merged (not reset) when the role/nav changes.
    const [openGroups, setOpenGroups] = useState({});
    useEffect(() => {
        if (!nav.groups) return;
        setOpenGroups((prev) => {
            const next = { ...prev };
            for (const group of nav.groups) {
                if (next[group.label] === undefined) next[group.label] = true;
            }
            return next;
        });
    }, [nav]);
    const toggleGroup = (label) =>
        setOpenGroups((prev) => ({ ...prev, [label]: prev[label] === false }));

    // While the mobile drawer is open: move focus inside it, trap Tab within
    // it, and restore focus to the trigger (hamburger) once it closes.
    useEffect(() => {
        if (!drawerOpen) return;
        const node = asideRef.current;
        if (!node) return;

        const getFocusable = () =>
            Array.from(
                node.querySelectorAll(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((el) => el.offsetParent !== null);

        getFocusable()[0]?.focus();

        const onKeyDown = (event) => {
            if (event.key !== "Tab") return;
            const items = getFocusable();
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        node.addEventListener("keydown", onKeyDown);
        return () => {
            node.removeEventListener("keydown", onKeyDown);
            triggerRef?.current?.focus();
        };
    }, [drawerOpen, triggerRef]);

    const userName = session?.user?.name || "Member";
    const userEmail = session?.user?.email || "";
    const monogram = theme?.monogram ?? "TS";

    // Profile is reached via the identity card (and its collapsed avatar), not a
    // standalone always-visible link. Pull the profile entry out of the footer
    // and render the rest (e.g. Settings, for roles that keep it there) as the
    // secondary footer links.
    const profileItem =
        (nav.footer ?? []).find((i) => i.href.endsWith("/profile")) ?? null;
    const secondaryFooter = (nav.footer ?? []).filter(
        (i) => i !== profileItem,
    );
    const initials =
        userName
            .split(/\s+/)
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "U";
    const profileActive = profileItem
        ? isActiveHref(pathname, profileItem.href, nav.home)
        : false;

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
            ref={asideRef}
            id="dashboard-sidebar"
            inert={!desktop && !drawerOpen ? true : undefined}
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r transition-[transform,width] duration-300 ease-out md:z-30",
                drawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
                "md:translate-x-0 md:shadow-none",
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
                {/* Static brand badge. Shown on mobile always; on desktop only
                    when expanded (collapsed rail uses the toggle button below
                    instead, so logo + chevron don't crowd the 4.75rem rail). */}
                <span
                    className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-md font-semibold tracking-tight",
                        collapsed && "md:hidden",
                    )}
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
                {/* Desktop icon rail: the monogram itself is the expand toggle.
                    Hover swaps it for a ">" affordance. Desktop-only. */}
                {collapsed && (
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        aria-label="Expand dashboard sidebar"
                        title="Expand"
                        className="group/brand relative hidden h-10 w-10 cursor-pointer items-center justify-center rounded-md font-semibold tracking-tight transition md:inline-flex"
                        style={{
                            backgroundColor: "var(--role-accent)",
                            color: "var(--role-accent-ink)",
                            fontFamily:
                                '"Fraunces", "Cormorant Garamond", "Iowan Old Style", serif',
                            boxShadow: "0 8px 24px var(--role-accent-soft)",
                        }}
                    >
                        <span className="transition-opacity group-hover/brand:opacity-0">
                            {monogram}
                        </span>
                        <svg
                            className="absolute opacity-0 transition-opacity group-hover/brand:opacity-100"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                )}
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
                {/* Collapse control — desktop, expanded state only. When
                    collapsed the monogram above takes over as the expand
                    toggle, so this button is intentionally not rendered. */}
                {!collapsed && (
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        aria-label="Collapse dashboard sidebar"
                        className="ml-auto hidden h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition hover:opacity-90 focus:outline-none focus:ring-2 md:inline-flex"
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
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
                {/* Mobile-only drawer close. The collapse button above is
                    desktop-only (md:inline-flex), so on mobile this takes the
                    ml-auto slot. */}
                <button
                    type="button"
                    onClick={onCloseDrawer}
                    aria-label="Close navigation menu"
                    className="ml-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition hover:opacity-90 focus:outline-none focus:ring-2 md:hidden"
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
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Primary nav — grouped when the role declares `groups`, flat
                otherwise. Group labels collapse to a hairline rule on the
                icon-only rail so the structure survives without text. A group
                with no `label` renders its items flat — no header, no collapse
                chevron — useful for a lead-in section (e.g. a standalone
                Overview) that shouldn't sit under a heading. */}
            <nav
                className={cn(
                    "flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1",
                    collapsed ? "dash-scroll-bare md:px-2 md:items-center" : "dash-scroll",
                )}
                aria-label="Primary"
            >
                {nav.groups
                    ? nav.groups.map((group, groupIndex) => {
                          const hasActive = group.items.some((item) =>
                              isActiveHref(pathname, item.href, nav.home),
                          );
                          // Icon rail: always show items (no room for headers).
                          // Expanded: show when the group is open OR holds the
                          // active route.
                          const open =
                              hasActive || openGroups[group.label] !== false;
                          const showItems = collapsed || open;
                          return (
                              <div
                                  key={group.label ?? `group-${groupIndex}`}
                                  className={cn(
                                      "flex w-full flex-col gap-1",
                                      groupIndex > 0 && "mt-3",
                                      collapsed && "md:items-center",
                                  )}
                              >
                                  {collapsed ? (
                                      groupIndex > 0 ? (
                                          <span
                                              className="hidden md:mb-1 md:block md:h-px md:w-6"
                                              style={{
                                                  backgroundColor:
                                                      "var(--dashboard-border)",
                                              }}
                                              aria-hidden="true"
                                          />
                                      ) : null
                                  ) : group.label ? (
                                      <button
                                          type="button"
                                          onClick={() =>
                                              !hasActive &&
                                              toggleGroup(group.label)
                                          }
                                          disabled={hasActive}
                                          aria-expanded={open}
                                          className={cn(
                                              "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors",
                                              !hasActive &&
                                                  "hover:bg-[var(--role-accent-soft)]",
                                          )}
                                          style={{
                                              color: "var(--dashboard-muted)",
                                              cursor: hasActive
                                                  ? "default"
                                                  : "pointer",
                                          }}
                                      >
                                          <span>{group.label}</span>
                                          <svg
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              aria-hidden="true"
                                              style={{
                                                  transform: open
                                                      ? "rotate(0deg)"
                                                      : "rotate(-90deg)",
                                                  transition:
                                                      "transform 0.2s ease",
                                                  opacity: hasActive ? 0.4 : 1,
                                              }}
                                          >
                                              <path d="M6 9l6 6 6-6" />
                                          </svg>
                                      </button>
                                  ) : null}
                                  {showItems &&
                                      group.items.map((item) => (
                                          <NavItem
                                              key={item.href}
                                              item={item}
                                              active={isActiveHref(
                                                  pathname,
                                                  item.href,
                                                  nav.home,
                                              )}
                                              collapsed={collapsed}
                                              onClick={onCloseDrawer}
                                          />
                                      ))}
                              </div>
                          );
                      })
                    : nav.items.map((item) => (
                          <NavItem
                              key={item.href}
                              item={item}
                              active={isActiveHref(
                                  pathname,
                                  item.href,
                                  nav.home,
                              )}
                              collapsed={collapsed}
                              onClick={onCloseDrawer}
                          />
                      ))}
            </nav>

            {/* Footer: profile/settings + identity card + sign out */}
            <div
                className={cn(
                    "flex-shrink-0 border-t px-3 pt-3 pb-4",
                    collapsed && "md:px-2",
                )}
                style={{ borderColor: "var(--dashboard-border)" }}
            >
                {secondaryFooter.length > 0 && (
                    <div className="flex flex-col gap-1 pb-3">
                        {secondaryFooter.map((item) => {
                            const active = isActiveHref(
                                pathname,
                                item.href,
                                nav.home,
                            );
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onCloseDrawer}
                                    title={collapsed ? item.label : undefined}
                                    aria-label={
                                        collapsed ? item.label : undefined
                                    }
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
                                    <span
                                        className={cn(collapsed && "md:hidden")}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Identity card IS the profile link. Expanded: full name/email
                    card. Collapsed rail: a circular initials avatar. Either way
                    it navigates to the role's profile route — so there's no
                    separate, always-visible Profile link. */}
                {profileItem ? (
                    <Link
                        href={profileItem.href}
                        onClick={onCloseDrawer}
                        aria-current={profileActive ? "page" : undefined}
                        title={collapsed ? `${userName} · Profile` : undefined}
                        aria-label={
                            collapsed ? `${userName}, open profile` : undefined
                        }
                        className={cn(
                            "group/id mb-3 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-[var(--role-accent-soft)]",
                            collapsed &&
                                "md:mb-3 md:justify-center md:border-0 md:px-0 md:py-0",
                        )}
                        style={{
                            borderColor: profileActive
                                ? "var(--role-accent-ring)"
                                : "var(--dashboard-border)",
                            backgroundColor: profileActive
                                ? "var(--role-accent-soft)"
                                : "color-mix(in srgb, var(--dashboard-surface) 92%, var(--dashboard-fg) 8%)",
                        }}
                    >
                        <span
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase"
                            style={{
                                backgroundColor: "var(--role-accent-soft)",
                                color: "var(--role-accent)",
                            }}
                            aria-hidden="true"
                        >
                            {initials}
                        </span>
                        <div className={cn("min-w-0", collapsed && "md:hidden")}>
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
                    </Link>
                ) : (
                    <div
                        className={cn(
                            "mb-3 rounded-lg border px-3 py-2",
                            collapsed && "md:hidden",
                        )}
                        style={{
                            borderColor: "var(--dashboard-border)",
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
                )}

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
