"use client";

import Link from "next/link";
import Card from "@/app/components/ui/Card";
import TopBar from "@/app/dashboard/components/layout/TopBar/TopBar";
import { useDashboardTheme } from "@/app/dashboard/context/DashboardThemeContext";
import { useMemo, useState } from "react";

const notificationItems = [
  { key: "Study reminder notifications", description: "Get reminded to stay consistent.", enabled: true },
  { key: "Weekly progress summary", description: "Receive your weekly learning recap.", enabled: true },
  { key: "Mentor session reminders", description: "Never miss upcoming mentor sessions.", enabled: true },
  { key: "Learning goal tracking", description: "Track your milestones and daily momentum.", enabled: true },
];

const preferenceItems = [
  { key: "Language", value: "English" },
  { key: "Timezone", value: "Asia/Kolkata" },
  { key: "Dashboard density", value: "Comfortable" },
  { key: "Data refresh", value: "Auto" },
];

const legalLinks = [
  { title: "Privacy Policy", href: "/dashboard/legal/privacy-policy" },
  { title: "Terms & Conditions", href: "/dashboard/legal/terms-and-conditions" },
  { title: "Refund Policy", href: "/dashboard/legal/refund-policy" },
];

const Settings = () => {
  const { themeKey, themes, setThemeKey } = useDashboardTheme();

  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(notificationItems);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return notifications;
    return notifications.filter(
      (item) =>
        item.key.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }, [search, notifications]);

  const enabledCount = notifications.filter((item) => item.enabled).length;

  const toggleNotification = (key) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  return (
    <div className="space-y-6" style={{ color: "var(--dashboard-fg)" }}>
      <TopBar
        title="Settings"
        subtitle="Customize appearance, notifications, and learning preferences"
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          className="border p-5 md:p-6"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--dashboard-fg)" }}
              >
                Appearance
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--dashboard-muted)" }}>
                Choose a dashboard theme that matches your workflow.
              </p>
            </div>

            <div
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--dashboard-bg-subtle)",
                color: "var(--dashboard-muted)",
                border: "1px solid var(--dashboard-border)",
              }}
            >
              Active theme: {themes[themeKey]?.label}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(themes).map(([key, item]) => {
              const active = key === themeKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setThemeKey(key)}
                  className={`group rounded-2xl border p-4 text-left transition duration-200 ${
                    active ? "cursor-default" : "cursor-pointer hover:-translate-y-0.5"
                  }`}
                  style={{
                    borderColor: active
                      ? "var(--dashboard-primary)"
                      : "var(--dashboard-border)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--dashboard-primary) 14%, var(--dashboard-surface) 86%)"
                      : "var(--dashboard-bg-subtle)",
                    boxShadow: active
                      ? "0 0 0 1px color-mix(in srgb, var(--dashboard-primary) 30%, transparent)"
                      : "none",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: active
                            ? "var(--dashboard-fg)"
                            : "var(--dashboard-fg)",
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--dashboard-muted)" }}
                      >
                        {active ? "Currently applied" : "Tap to preview this theme"}
                      </p>
                    </div>

                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: active
                          ? "var(--dashboard-primary)"
                          : "var(--dashboard-border)",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          className="border p-5 md:p-6"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
          }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--dashboard-fg)" }}
          >
            Settings Snapshot
          </h3>

          <div className="mt-5 space-y-3">
            {[
              { label: "Themes available", value: Object.keys(themes).length },
              { label: "Notifications enabled", value: `${enabledCount}/${notifications.length}` },
              { label: "Layout mode", value: "Personalized" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "var(--dashboard-bg-subtle)",
                }}
              >
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--dashboard-muted)" }}>
                  {item.label}
                </p>
                <p
                  className="mt-2 text-base font-semibold"
                  style={{
                    color: "var(--dashboard-fg)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card
          className="border p-5 md:p-6"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-surface)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--dashboard-fg)" }}
              >
                Notifications
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--dashboard-muted)" }}>
                Manage reminders that support your learning routine.
              </p>
            </div>

            <div className="relative w-full md:max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search settings"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "var(--dashboard-bg-subtle)",
                  color: "var(--dashboard-fg)",
                }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredNotifications.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "var(--dashboard-bg-subtle)",
                }}
              >
                <div className="pr-2">
                  <p className="text-sm font-medium" style={{ color: "var(--dashboard-fg)" }}>
                    {item.key}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--dashboard-muted)" }}>
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification(item.key)}
                  className="flex min-w-[92px] items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition"
                  style={{
                    backgroundColor: item.enabled
                      ? "color-mix(in srgb, var(--dashboard-primary) 18%, var(--dashboard-surface) 82%)"
                      : "var(--dashboard-surface)",
                    color: item.enabled
                      ? "var(--dashboard-primary)"
                      : "var(--dashboard-muted)",
                    border: "1px solid var(--dashboard-border)",
                  }}
                >
                  {item.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div
                className="rounded-2xl border p-6 text-center"
                style={{
                  borderColor: "var(--dashboard-border)",
                  backgroundColor: "var(--dashboard-bg-subtle)",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--dashboard-fg)" }}>
                  No settings found
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--dashboard-muted)" }}>
                  Try a different keyword.
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card
            className="border p-5 md:p-6"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--dashboard-fg)" }}
            >
              Preferences
            </h3>

            <div className="mt-5 space-y-3">
              {preferenceItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-bg-subtle)",
                  }}
                >
                  <span className="text-sm" style={{ color: "var(--dashboard-muted)" }}>
                    {item.key}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--dashboard-fg)" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-5 rounded-2xl border p-4"
              style={{
                borderColor: "var(--dashboard-border)",
                backgroundColor: "color-mix(in srgb, var(--dashboard-primary) 8%, var(--dashboard-surface) 92%)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--dashboard-fg)" }}>
                Tip
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--dashboard-muted)" }}>
                Keep only the reminders that genuinely help your consistency.
              </p>
            </div>
          </Card>

          <Card
            className="border p-5 md:p-6"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-surface)",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--dashboard-fg)" }}
            >
              Legal Policies
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--dashboard-muted)" }}>
              Access the policy documents that apply to your dashboard experience.
            </p>

            <div className="mt-4 space-y-2">
              {legalLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl border px-3 py-2 text-sm transition hover:opacity-90"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    color: "var(--dashboard-fg)",
                    backgroundColor: "var(--dashboard-bg-subtle)",
                  }}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Settings;
