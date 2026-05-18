const ALL_DASHBOARD_USERS = [
	"SUPER_ADMIN",
	"ADMIN",
	"INSTITUTION_COORDINATOR",
	"TRAINER",
	"STUDENT",
];

const dashboardRoutePermissions = {
	// Shared dashboard pages
	"/dashboard": ALL_DASHBOARD_USERS,
	"/dashboard/profile": ALL_DASHBOARD_USERS,
	"/dashboard/settings": ALL_DASHBOARD_USERS,

	// Student
	"/dashboard/student": ["STUDENT"],

	// Trainer
	"/dashboard/trainer": ["TRAINER"],

	// Coordinator
	"/dashboard/coordinator": ["INSTITUTION_COORDINATOR"],

	// Admin
	"/dashboard/admin": ["ADMIN"],

	// Super Admin
	"/dashboard/super-admin": ["SUPER_ADMIN"],
};

export default dashboardRoutePermissions;

