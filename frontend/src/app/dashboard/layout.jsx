import { Fraunces, Inter } from "next/font/google";
import SideBar from "@/features/dashboard/components/ui/layout/Sidebar/SideBar";
import { DashboardThemeProvider } from "@/features/dashboard/context/DashboardThemeContext";
import { RoleThemeProvider } from "@/features/dashboard/context/RoleThemeContext";
import DashboardAuthGate from "./auth/DashboardAuthGate";
import "./dashboard.css";

const fraunces = Fraunces({
    variable: "--font-display",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const inter = Inter({
    variable: "--font-body",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const DashboardLayout = ({ children }) => {
    return (
        <DashboardThemeProvider>
            <RoleThemeProvider>
                <main
                    className={`${fraunces.variable} ${inter.variable} min-h-screen md:flex md:overflow-hidden`}
                    style={{
                        backgroundColor: "var(--dashboard-bg)",
                        color: "var(--dashboard-fg)",
                        fontFamily: "var(--font-body), system-ui, sans-serif",
                    }}
                >
                    <DashboardAuthGate>
                        <SideBar />
                        <section
                            className="flex-1 overflow-y-auto md:ml-64"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
                                {children}
                            </div>
                        </section>
                    </DashboardAuthGate>
                </main>
            </RoleThemeProvider>
        </DashboardThemeProvider>
    );
};

export default DashboardLayout;
