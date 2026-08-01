export const DASHBOARD_ACCESS_ROLES = ["admin", "owner"] as const;
export const ADMIN_DASHBOARD_TAB_IDS = [
  "vehicles",
  "holidays",
  "reserves",
  "reservation-history",
  "contracts",
  "tickets",
] as const;

export function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() || "";
}

export function canAccessDashboard(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  return Boolean(
    normalizedRole &&
      (DASHBOARD_ACCESS_ROLES as readonly string[]).includes(normalizedRole),
  );
}

export function hasFullDashboardAccess(role?: string | null) {
  return normalizeRole(role) === "owner";
}

export function getRoleLabel(role?: string | null) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "owner") return "Owner";
  if (normalizedRole === "admin") return "Administrator";
  return "Customer";
}
