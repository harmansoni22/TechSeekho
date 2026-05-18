"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import Card from "@/app/components/ui/Card";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import TopBar from "@/features/dashboard/components/ui/layout/TopBar/TopBar";

const RewardsPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userKarma = 2850;
    const karmaToNextLevel = 3000;

    const fetchAchievements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/student/achievements", {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch achievements");
            }

            const result = await response.json();
            return result.data;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            fetchAchievements();
        }
    }, [fetchAchievements, status, router]);

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorScreen
                dashboard
                type="network"
                title="Rewards could not load."
                message={error}
                onRetry={fetchAchievements}
                homeHref="/dashboard/student"
                homeLabel="Student home"
            />
        );
    }

    const rewardCategories = [
        {
            name: "Digital Tools",
            items: [
                {
                    id: 1,
                    name: "Premium Figma License",
                    cost: 1200,
                    description: "1-year premium access to Figma",
                    image: "🎨",
                },
                {
                    id: 2,
                    name: "GitHub Pro Subscription",
                    cost: 800,
                    description: "Private repositories and advanced features",
                    image: "📚",
                },
                {
                    id: 3,
                    name: "VS Code Extensions Pack",
                    cost: 300,
                    description: "Curated set of productivity extensions",
                    image: "⚡",
                },
            ],
        },
        {
            name: "Mentorship Sessions",
            items: [
                {
                    id: 4,
                    name: "1-on-1 with Senior Developer",
                    cost: 1500,
                    description: "60-minute session with industry expert",
                    image: "👨‍💻",
                },
                {
                    id: 5,
                    name: "Resume Review",
                    cost: 500,
                    description:
                        "Professional resume feedback and optimization",
                    image: "📄",
                },
                {
                    id: 6,
                    name: "Mock Interview",
                    cost: 800,
                    description: "Practice technical interview with feedback",
                    image: "🎤",
                },
            ],
        },
        {
            name: "Learning Resources",
            items: [
                {
                    id: 7,
                    name: "Online Course Voucher",
                    cost: 2000,
                    description: "$200 voucher for any Udemy course",
                    image: "🎓",
                },
                {
                    id: 8,
                    name: "Book Allowance",
                    cost: 600,
                    description: "$60 credit for technical books",
                    image: "📖",
                },
                {
                    id: 9,
                    name: "Conference Ticket",
                    cost: 2500,
                    description: "Entry to tech conference of choice",
                    image: "🎫",
                },
            ],
        },
    ];

    const recentRedemptions = [
        {
            id: 1,
            item: "VS Code Extensions Pack",
            cost: 300,
            date: "2024-01-10",
            status: "Delivered",
        },
        {
            id: 2,
            item: "Resume Review",
            cost: 500,
            date: "2024-01-05",
            status: "In Progress",
        },
    ];

    const mockAchievements = [
        {
            id: 1,
            name: "First Lesson Completed",
            description: "Completed your first lesson",
            karma: 50,
            unlocked: true,
        },
        {
            id: 2,
            name: "Week Streak",
            description: "7-day learning streak",
            karma: 200,
            unlocked: true,
        },
        {
            id: 3,
            name: "Quiz Master",
            description: "Scored 90%+ on 5 quizzes",
            karma: 300,
            unlocked: true,
        },
        {
            id: 4,
            name: "Course Champion",
            description: "Completed first full course",
            karma: 500,
            unlocked: false,
        },
        {
            id: 5,
            name: "Mentor Session",
            description: "Booked first mentor session",
            karma: 150,
            unlocked: false,
        },
    ];

    return (
        <div className="space-y-5" style={{ color: "var(--dashboard-fg)" }}>
            <TopBar
                title="Rewards Store"
                subtitle="Gamified shop where students redeem Karma Points for digital tools, mentorship sessions, or physical gear"
            />

            {/* Karma Balance */}
            <Card
                className="border"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
            >
                <div className="text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <h2
                        className="text-2xl font-bold mb-2"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        {userKarma.toLocaleString()} Karma Points
                    </h2>
                    <p
                        className="text-sm mb-4"
                        style={{ color: "var(--dashboard-muted)" }}
                    >
                        {karmaToNextLevel - userKarma} points to next level
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                        <div
                            className="h-3 rounded-full"
                            style={{
                                width: `${(userKarma / karmaToNextLevel) * 100}%`,
                                backgroundColor: "var(--dashboard-accent)",
                            }}
                        ></div>
                    </div>
                </div>
            </Card>

            {/* Reward Categories */}
            <div className="space-y-6">
                {rewardCategories.map((category) => (
                    <Card
                        key={category.name}
                        className="border"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            backgroundColor: "var(--dashboard-surface)",
                        }}
                    >
                        <h3
                            className="text-lg font-semibold mb-4"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {category.name}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {category.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-lg border"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                        backgroundColor:
                                            "var(--dashboard-surface)",
                                    }}
                                >
                                    <div className="text-3xl mb-3 text-center">
                                        {item.image}
                                    </div>
                                    <h4
                                        className="font-medium mb-2"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {item.name}
                                    </h4>
                                    <p
                                        className="text-sm mb-3"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {item.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="font-bold"
                                            style={{
                                                color: "var(--dashboard-accent)",
                                            }}
                                        >
                                            {item.cost} pts
                                        </span>
                                        <button
                                            type="button"
                                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                                                userKarma >= item.cost
                                                    ? ""
                                                    : "opacity-50 cursor-not-allowed"
                                            }`}
                                            disabled={userKarma < item.cost}
                                            style={{
                                                backgroundColor:
                                                    userKarma >= item.cost
                                                        ? "var(--dashboard-primary)"
                                                        : "var(--dashboard-muted)",
                                                color:
                                                    userKarma >= item.cost
                                                        ? "var(--dashboard-primary-fg)"
                                                        : "var(--dashboard-surface)",
                                            }}
                                        >
                                            Redeem
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Recent Redemptions and Achievements */}
            <div className="grid gap-5 lg:grid-cols-2">
                {/* Recent Redemptions */}
                <Card
                    className="border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <h3
                        className="text-lg font-semibold mb-4"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        Recent Redemptions
                    </h3>
                    <div className="space-y-3">
                        {recentRedemptions.map((redemption) => (
                            <div
                                key={redemption.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor:
                                        "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-primary) 5%)",
                                }}
                            >
                                <div>
                                    <p
                                        className="font-medium text-sm"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {redemption.item}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {redemption.date} • {redemption.status}
                                    </p>
                                </div>
                                <span
                                    className="font-medium text-sm"
                                    style={{ color: "var(--dashboard-accent)" }}
                                >
                                    -{redemption.cost} pts
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Achievements */}
                <Card
                    className="border"
                    style={{
                        borderColor: "var(--dashboard-border)",
                        backgroundColor: "var(--dashboard-surface)",
                    }}
                >
                    <h3
                        className="text-lg font-semibold mb-4"
                        style={{ color: "var(--dashboard-fg)" }}
                    >
                        Achievements
                    </h3>
                    <div className="space-y-3">
                        {mockAchievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                    achievement.unlocked
                                        ? "opacity-100"
                                        : "opacity-50"
                                }`}
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    backgroundColor: achievement.unlocked
                                        ? "color-mix(in srgb, var(--dashboard-surface) 95%, var(--dashboard-accent) 5%)"
                                        : "var(--dashboard-surface)",
                                }}
                            >
                                <div
                                    className={`text-2xl ${achievement.unlocked ? "" : "grayscale"}`}
                                >
                                    {achievement.unlocked ? "🏆" : "🔒"}
                                </div>
                                <div className="flex-1">
                                    <p
                                        className="font-medium text-sm"
                                        style={{ color: "var(--dashboard-fg)" }}
                                    >
                                        {achievement.name}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--dashboard-muted)",
                                        }}
                                    >
                                        {achievement.description}
                                    </p>
                                </div>
                                <span
                                    className="font-medium text-sm"
                                    style={{ color: "var(--dashboard-accent)" }}
                                >
                                    +{achievement.karma}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* How to Earn Karma */}
            <Card
                className="border"
                style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-surface)",
                }}
            >
                <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: "var(--dashboard-fg)" }}
                >
                    How to Earn Karma Points
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center">
                        <div className="text-2xl mb-2">📚</div>
                        <h4
                            className="font-medium mb-1"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            Complete Lessons
                        </h4>
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            +10-50 points per lesson
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">✅</div>
                        <h4
                            className="font-medium mb-1"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            Pass Quizzes
                        </h4>
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            +25-100 points based on score
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">🔥</div>
                        <h4
                            className="font-medium mb-1"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            Maintain Streaks
                        </h4>
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            +50-200 points for streaks
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">🤝</div>
                        <h4
                            className="font-medium mb-1"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            Help Community
                        </h4>
                        <p
                            className="text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            +20-100 points for contributions
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RewardsPage;
