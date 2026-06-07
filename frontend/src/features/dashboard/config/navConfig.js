/**
 * Per-role navigation configuration for the dashboard sidebar.
 *
 * The sidebar reads the active role from the session and renders only the
 * matching list. There is no shared global nav — every entry below points to
 * a role-scoped route under `/dashboard/{role}/...`.
 *
 * To add a feature for a role:
 *   1. Add the entry to the role's array here.
 *   2. Create the page file under `/app/dashboard/{role}/<path>/page.jsx`.
 *   3. Add the route to `dashboardRoutePermissions.js`, scoped to that role.
 *
 * Keep this file dependency-free (no React imports) so it can be reused from
 * tests, server components, and links rendered in static markup.
 */

// Tiny SVG path strings keep the bundle small and the icon system uniform.
// All icons are 24×24, currentColor stroke, drawn via `<path d={…}>` inside
// the Sidebar component.
const ICONS = {
    home: "M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z M9 22V12h6v10",
    building:
        "M3 21h18 M5 21V7l7-4 7 4v14 M9 9h1 M9 13h1 M9 17h1 M14 9h1 M14 13h1 M14 17h1",
    shield: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    gauge: "M12 14l4-4 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    sliders:
        "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
    clipboard:
        "M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z M5 5h14v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5z",
    chart: "M3 3v18h18 M7 15v3 M12 9v9 M17 12v6",
    flag: "M4 22V4 M4 4h14l-3 5 3 5H4",
    megaphone:
        "M3 11v2a4 4 0 0 0 4 4h1l4 4V7l-4 4H7a4 4 0 0 0-4 4 M15 8a4 4 0 0 1 0 8 M19 5a8 8 0 0 1 0 14",
    puzzle: "M19 11h-1a3 3 0 0 0 0-6h-4V4a2 2 0 0 0-4 0v1H6a2 2 0 0 0-2 2v4h1a3 3 0 1 1 0 6H4v4a2 2 0 0 0 2 2h4v-1a3 3 0 0 1 6 0v1h4a2 2 0 0 0 2-2v-4",
    book: "M4 19.5A2.5 2.5 0 0 0 6.5 22H20 M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5z",
    flask: "M9 2h6 M9 2l-.5 7.5A4.5 4.5 0 0 0 13 14.9V19H8v-4.1A4.5 4.5 0 0 0 9.5 9.5L9 2z M15 2l.5 7.5A4.5 4.5 0 0 1 11 14.9V19h5v-4.1A4.5 4.5 0 0 1 14.5 9.5L15 2z",
    play: "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z M10 8l6 4-6 4V8z",
    medal: "M8 21l4-3 4 3V11a4 4 0 0 0-8 0v10z M8 11a4 4 0 1 1 8 0 4 4 0 0 1-8 0z",
    briefcase:
        "M2 7h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z M16 7V4a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v3",
    chat: "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-7.6-4.7L3 21l1.7-1.9A8.5 8.5 0 1 1 21 11.5z",
    cpu: "M9 3v3 M15 3v3 M9 18v3 M15 18v3 M3 9h3 M3 15h3 M18 9h3 M18 15h3 M4 4h16v16H4z M9 9h6v6H9z",
    star: "M12 2l3 6.5 7 1-5 5 1.5 7L12 18l-6.5 3.5L7 14.5l-5-5 7-1L12 2z",
    rocket: "M5 13l4 4-3 3-2-2 1-5 M14 6l4 4 M14 6c-3 1-5 4-6 7l4 4c3-1 6-3 7-6 M19 5l-2 2",
    gear: "M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .65.39 1.23 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09c-.65 0-1.23.39-1.51 1z",
    user: "M20 21v-2a4 4 0 0 0-3-3.87 M4 21v-2a4 4 0 0 1 3-3.87 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    scroll: "M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a4 4 0 0 1-4 4H6a2 2 0 0 1-2-2V4z M8 6h8 M8 10h8 M8 14h5",
    scale: "M12 3v18 M5 21h14 M5 7l-3 7h6L5 7z M19 7l-3 7h6l-3-7z M8 7h8",
    stack: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 18l9 5 9-5",
};

// Roles may declare grouped navigation. `withGroups` keeps a flat `items`
// array in sync (derived from the groups) so existing consumers that read
// `.items` — the Super Admin overview's route→icon map and the SideBar's flat
// fallback for un-migrated roles — keep working unchanged. Migrate a role by
// switching its value to `withGroups(home, groups, footer)`; leave the others
// as flat `{ home, items, footer }` until their turn.
function withGroups(home, groups, footer) {
    return {
        home,
        groups,
        items: groups.flatMap((group) => group.items),
        footer,
    };
}

export const NAV_CONFIG = {
    SUPER_ADMIN: withGroups(
        "/dashboard/super-admin",
        [
            {
                items: [
                    {
                        href: "/dashboard/super-admin",
                        label: "Overview",
                        icon: ICONS.home,
                    },
                ]
            },
            {
                label: "Governance",
                items: [
                    {
                        href: "/dashboard/super-admin/institution-lifecycle",
                        label: "Institution Lifecycle",
                        icon: ICONS.flag,
                    },
                ],
            },
            {
                label: "Institutions",
                items: [
                    {
                        href: "/dashboard/super-admin/institutions",
                        label: "Institutions",
                        icon: ICONS.building,
                    },
                ],
            },
            {
                label: "Roles & Access",
                items: [
                    {
                        href: "/dashboard/super-admin/role-management",
                        label: "Role Management",
                        icon: ICONS.shield,
                    },
                    {
                        href: "/dashboard/super-admin/users",
                        label: "User Directory",
                        icon: ICONS.user,
                    },
                ],
            },
            {
                label: "Admins",
                items: [
                    {
                        href: "/dashboard/super-admin/admins",
                        label: "Admins",
                        icon: ICONS.users,
                    },
                    {
                        href: "/dashboard/super-admin/admin-management",
                        label: "Admin Management",
                        icon: ICONS.shield,
                    },
                ],
            },
            {
                label: "Trainers",
                items: [
                    {
                        href: "/dashboard/super-admin/trainer-management",
                        label: "Trainer Management",
                        icon: ICONS.gauge,
                    },
                ],
            },
            {
                label: "Analytics",
                items: [
                    {
                        href: "/dashboard/super-admin/platform-analytics",
                        label: "Platform Analytics",
                        icon: ICONS.chart,
                    },
                ],
            },
            {
                label: "Settings",
                items: [
                    {
                        href: "/dashboard/super-admin/audit-logs",
                        label: "Audit Logs",
                        icon: ICONS.scroll,
                    },
                    {
                        href: "/dashboard/super-admin/legal",
                        label: "Legal & Policies",
                        icon: ICONS.scale,
                    },
                    {
                        href: "/dashboard/super-admin/platform-config",
                        label: "Platform Config",
                        icon: ICONS.sliders,
                    },
                    {
                        href: "/dashboard/super-admin/settings",
                        label: "Settings",
                        icon: ICONS.gear,
                    },
                ],
            },
        ],
        [
            {
                href: "/dashboard/super-admin/profile",
                label: "Profile",
                icon: ICONS.user,
            },
        ],
    ),

    ADMIN: {
        home: "/dashboard/admin",
        items: [
            { href: "/dashboard/admin", label: "Overview", icon: ICONS.home },
            {
                href: "/dashboard/admin/institutions",
                label: "Institutions",
                icon: ICONS.building,
            },
            {
                href: "/dashboard/admin/students",
                label: "Students",
                icon: ICONS.users,
            },
            {
                href: "/dashboard/admin/trainers",
                label: "Trainers",
                icon: ICONS.users,
            },
            {
                href: "/dashboard/admin/batches",
                label: "Batches",
                icon: ICONS.stack,
            },
            {
                href: "/dashboard/admin/attendance",
                label: "Attendance",
                icon: ICONS.gauge,
            },
            {
                href: "/dashboard/admin/assignments",
                label: "Assignments",
                icon: ICONS.clipboard,
            },
            {
                href: "/dashboard/admin/announcements",
                label: "Announcements",
                icon: ICONS.megaphone,
            },
            {
                href: "/dashboard/admin/analytics",
                label: "Analytics",
                icon: ICONS.chart,
            },
            {
                href: "/dashboard/admin/reports",
                label: "Reports",
                icon: ICONS.scroll,
            },
            {
                href: "/dashboard/admin/legal",
                label: "Legal & Policies",
                icon: ICONS.scale,
            },
        ],
        footer: [
            {
                href: "/dashboard/admin/profile",
                label: "Profile",
                icon: ICONS.user,
            },
            {
                href: "/dashboard/admin/settings",
                label: "Settings",
                icon: ICONS.gear,
            },
        ],
    },

    INSTITUTION_COORDINATOR: {
        home: "/dashboard/coordinator",
        items: [
            {
                href: "/dashboard/coordinator",
                label: "Overview",
                icon: ICONS.home,
            },
            {
                href: "/dashboard/coordinator/batches",
                label: "Batches",
                icon: ICONS.stack,
            },
            {
                href: "/dashboard/coordinator/students",
                label: "Students",
                icon: ICONS.users,
            },
            {
                href: "/dashboard/coordinator/trainers",
                label: "Trainers",
                icon: ICONS.users,
            },
            {
                href: "/dashboard/coordinator/attendance",
                label: "Attendance",
                icon: ICONS.clipboard,
            },
            {
                href: "/dashboard/coordinator/progress",
                label: "Progress",
                icon: ICONS.gauge,
            },
            {
                href: "/dashboard/coordinator/announcements",
                label: "Announcements",
                icon: ICONS.megaphone,
            },
            {
                href: "/dashboard/coordinator/analytics",
                label: "Analytics",
                icon: ICONS.chart,
            },
            {
                href: "/dashboard/coordinator/community",
                label: "Community",
                icon: ICONS.chat,
            },
            {
                href: "/dashboard/coordinator/legal",
                label: "Legal",
                icon: ICONS.scale,
            },
        ],
        footer: [
            {
                href: "/dashboard/coordinator/profile",
                label: "Profile",
                icon: ICONS.user,
            },
            {
                href: "/dashboard/coordinator/settings",
                label: "Settings",
                icon: ICONS.gear,
            },
        ],
    },

    TRAINER: {
        home: "/dashboard/trainer",
        items: [
            { href: "/dashboard/trainer", label: "Overview", icon: ICONS.home },
            {
                href: "/dashboard/trainer/batches",
                label: "Batches",
                icon: ICONS.stack,
            },
            {
                href: "/dashboard/trainer/course",
                label: "My Courses",
                icon: ICONS.book,
            },
            {
                href: "/dashboard/trainer/modules",
                label: "Modules",
                icon: ICONS.puzzle,
            },
            {
                href: "/dashboard/trainer/attendance",
                label: "Attendance",
                icon: ICONS.gauge,
            },
            {
                href: "/dashboard/trainer/assignments",
                label: "Assignments",
                icon: ICONS.clipboard,
            },
            {
                href: "/dashboard/trainer/submissions",
                label: "Submissions",
                icon: ICONS.scroll,
            },
            {
                href: "/dashboard/trainer/community",
                label: "Announcements",
                icon: ICONS.megaphone,
            },
            {
                href: "/dashboard/trainer/ai-companion",
                label: "AI Companion",
                icon: ICONS.cpu,
            },
            {
                href: "/dashboard/trainer/legal",
                label: "Legal",
                icon: ICONS.scale,
            },
        ],
        footer: [
            {
                href: "/dashboard/trainer/profile",
                label: "Profile",
                icon: ICONS.user,
            },
            {
                href: "/dashboard/trainer/settings",
                label: "Settings",
                icon: ICONS.gear,
            },
        ],
    },

    STUDENT: withGroups(
        "/dashboard/student",
        [
            {
                items: [
                    {
                        href: "/dashboard/student",
                        label: "Overview",
                        icon: ICONS.home,
                    },
                ],
            },
            {
                label: "Learning",
                items: [
                    {
                        href: "/dashboard/student/courses",
                        label: "My Courses",
                        icon: ICONS.book,
                    },
                    {
                        href: "/dashboard/student/learning",
                        label: "Active Learning",
                        icon: ICONS.play,
                    },
                    {
                        href: "/dashboard/student/skill-labs",
                        label: "Skill Labs",
                        icon: ICONS.flask,
                    },
                    {
                        href: "/dashboard/student/assignments",
                        label: "Assignments",
                        icon: ICONS.clipboard,
                    },
                ],
            },
            {
                label: "Progress & Rewards",
                items: [
                    {
                        href: "/dashboard/student/certifications",
                        label: "Certifications",
                        icon: ICONS.medal,
                    },
                    {
                        href: "/dashboard/student/leaderboard",
                        label: "Leaderboard",
                        icon: ICONS.star,
                    },
                    {
                        href: "/dashboard/student/rewards",
                        label: "Rewards",
                        icon: ICONS.rocket,
                    },
                    {
                        href: "/dashboard/student/analytics",
                        label: "My Analytics",
                        icon: ICONS.chart,
                    },
                ],
            },
            {
                label: "Community & Support",
                items: [
                    {
                        href: "/dashboard/student/ai-companion",
                        label: "AI Companion",
                        icon: ICONS.cpu,
                    },
                    {
                        href: "/dashboard/student/mentors",
                        label: "Mentors",
                        icon: ICONS.users,
                    },
                    {
                        href: "/dashboard/student/community",
                        label: "Community",
                        icon: ICONS.chat,
                    },
                ],
            },
            {
                label: "Career",
                items: [
                    {
                        href: "/dashboard/student/jobs",
                        label: "Job Board",
                        icon: ICONS.briefcase,
                    },
                ],
            },
            {
                label: "Settings",
                items: [
                    {
                        href: "/dashboard/student/legal",
                        label: "Legal",
                        icon: ICONS.scale,
                    },
            {
                href: "/dashboard/student/settings",
                label: "Settings",
                icon: ICONS.gear,
            },
                ],
            },
        ],
        [
            {
                href: "/dashboard/student/profile",
                label: "Profile",
                icon: ICONS.user,
            }
        ],
    ),
};

const EMPTY_NAV = { home: "/dashboard", items: [], footer: [] };

export function navForRole(roleKey) {
    if (!roleKey) return EMPTY_NAV;
    return NAV_CONFIG[String(roleKey).toUpperCase()] ?? EMPTY_NAV;
}
