"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
	isRoleAuthorized,
	resolveAllowedRolesForPath,
} from "../resolveDashboardAuthz";

export default function DashboardAuthGate({
	children,
}) {
	const router = useRouter();
	const pathname = usePathname();

	const { data: session, status } =
		useSession();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.replace(
				`/login?next=${encodeURIComponent(
					pathname || "/dashboard"
				)}`
			);

			return;
		}

		if (status !== "authenticated") {
			return;
		}

		const roles =
			session?.user?.roles || [];

		const allowedRoles =
			resolveAllowedRolesForPath(
				pathname
			);

		// Fail closed
		if (!allowedRoles.length) {
			router.replace("/403");
			return;
		}

		const authorized =
			isRoleAuthorized({
				roles,
				allowedRoles,
			});

		if (!authorized) {
			router.replace("/403");
		}
	}, [
		router,
		pathname,
		status,
		session?.user?.roles,
	]);

	// Prevent protected UI flash
	if (
		status === "loading" ||
		status === "unauthenticated"
	) {
		return null;
	}

	const roles =
		session?.user?.roles || [];

	const allowedRoles =
		resolveAllowedRolesForPath(
			pathname
		);

	const authorized =
		isRoleAuthorized({
			roles,
			allowedRoles,
		});

	return authorized ? children : null;
}
