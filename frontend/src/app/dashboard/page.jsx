"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import { resolveRoleDestination } from "@/lib/roleRouter";

/**
 * Entry point for /dashboard.
 *
 * Immediately redirects to the correct role dashboard.
 * Never renders role-specific content here — each sub-dashboard owns its UI.
 */
const DashboardRouter = () => {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "loading") return;

		if (status === "unauthenticated") {
			router.replace("/login");
			return;
		}

		const roles = session?.user?.roles ?? [];
		const destination = resolveRoleDestination(roles);

		if (destination) {
			router.replace(destination);
			return;
		}

		// Roles present but no matching route — account exists but not yet assigned.
		if (roles.length > 0) {
			console.warn(
				"[DashboardRouter] No route for roles:",
				roles,
				"— redirecting to pending-approval",
			);
			router.replace("/pending-approval");
			return;
		}

		// Empty roles — possible session timing edge case; redirect to pending.
		console.warn("[DashboardRouter] Session has no roles — redirecting to pending-approval");
		router.replace("/pending-approval");
	}, [status, session?.user?.roles, router]);

	// Show a spinner while we determine the destination.
	// Never render role-specific content at this route.
	return (
		<div className="flex items-center justify-center min-h-screen">
			<LoadingSpinner />
		</div>
	);
};

export default DashboardRouter;
