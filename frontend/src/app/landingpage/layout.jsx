import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { resolveRoleDestination } from "@/lib/roleRouter";
import CustomCursor from "./components/CustomCursor";
import LenisProvider from "./components/LenisProvider";
import Footer from "./components/layout/Footer/Footer";
import Navbar from "./components/layout/Navigation/Navbar";

export const metadata = {
    title: {
        default: "MP's #1 Future Skills Platform",
        template: "%s | Techseekho",
    },
    description:
        "Techseekho empowers school students with AI, Robotics, Drone Technology, IoT, Coding and future skills across Madhya Pradesh. Ages 10-18.",
};

/**
 * Authenticated visitors should not see the public landing pages.
 *
 * Running this guard in the layout (server component) means every route under
 * `/landingpage/*` is covered with one check, before any landing HTML is sent.
 * If the user holds a role we can route to, we send them to their dashboard;
 * otherwise we let them see the marketing pages (covers pending-approval and
 * unauthenticated visitors alike).
 */
async function redirectIfAuthenticated() {
    try {
        const session = await auth();
        const roles = session?.user?.roles ?? [];
        if (roles.length === 0) return;
        const destination = resolveRoleDestination(roles);
        if (destination) redirect(destination);
    } catch (err) {
        // Don't let an auth lookup failure break the public site.
        // `redirect()` throws by design — re-throw so Next can perform the redirect.
        if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
        console.warn(
            "[/landingpage] auth() failed; rendering public page:",
            err?.message,
        );
    }
}

const Layout = async ({ children }) => {
    await redirectIfAuthenticated();

    return (
        <div className="relative isolate min-h-screen flex flex-col bg-transparent">
            <Suspense fallback={null}>
                <Navbar />
            </Suspense>
            <CustomCursor SPLAT_RADIUS={0.075} BLEND_MODE="difference" />
            <main id="landing-scroll-content" className="flex-1">
                <Suspense fallback={<h1>Loading...</h1>}>
                    <LenisProvider>{children}</LenisProvider>
                </Suspense>
            </main>
            {/* <GradualBlur
                target="parent"
                position="bottom"
                height="7rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
            /> */}
            <Footer />
        </div>
    );
};

export default Layout;
