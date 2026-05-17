import SideBar from "@/features/dashboard/components/ui/layout/Sidebar/SideBar";
import { DashboardThemeProvider } from "@/features/dashboard/context/DashboardThemeContext";
import DashboardAuthGate from "./auth/DashboardAuthGate";

const DasboardLayout = ({ children }) => {
	return (
		<DashboardThemeProvider>
			<main
				className="min-h-screen md:flex md:overflow-hidden"
				style={{
					backgroundColor: "var(--dashboard-bg)",
					color: "var(--dashboard-fg)",
				}}
			>
				<DashboardAuthGate>
					<SideBar />
					<section className="flex-1 overflow-y-auto p-4 md:p-6 md:ml-64" style={{ color: "var(--dashboard-fg)" }}>
						{children}
					</section>
				</DashboardAuthGate>
			</main>
		</DashboardThemeProvider>
	);
};

export default DasboardLayout;
