"use client";

import Link from "next/link";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { resolveRoleDestination } from "@/lib/roleRouter";

export default function Forbidden() {
	const { data: session } = useSession();
	const roles = session?.user?.roles ?? [];
	const dashboardHref = resolveRoleDestination(roles) ?? "/dashboard";

	return (
		<section className="flex min-h-screen items-center justify-center bg-[#05050f] px-4 py-10 text-center text-white">
			<div className="w-full max-w-lg">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5">
					<ShieldAlert aria-hidden="true" className="h-7 w-7 text-[#a78bfa]" />
				</div>

				<p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#a78bfa]">
					Error 403
				</p>

				<h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
					Access denied.
				</h1>

				<p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/50 md:text-base">
					Your account doesn&apos;t have permission to view this page. If you
					think this is a mistake, contact your platform administrator.
				</p>

				<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<Link
						href={dashboardHref}
						className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#4f46e5] px-5 text-sm font-semibold text-white transition hover:opacity-90"
					>
						<Home aria-hidden="true" className="h-4 w-4" />
						Go to dashboard
					</Link>

					<button
						type="button"
						onClick={() => window.history.back()}
						className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
					>
						<ArrowLeft aria-hidden="true" className="h-4 w-4" />
						Go back
					</button>
				</div>
			</div>
		</section>
	);
}
