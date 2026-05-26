import { Fraunces, Inter } from "next/font/google";
import { DashboardThemeProvider } from "@/features/dashboard/context/DashboardThemeContext";
import { RoleThemeProvider } from "@/features/dashboard/context/RoleThemeContext";
import DashboardAuthGate from "./auth/DashboardAuthGate";
import DashboardChrome from "./DashboardChrome";
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
                        <DashboardChrome>{children}</DashboardChrome>
                    </DashboardAuthGate>
                </main>
            </RoleThemeProvider>
        </DashboardThemeProvider>
    );
};

export default DashboardLayout;
