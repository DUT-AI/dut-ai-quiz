export enum AppRole {
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  EDUCATOR = "EDUCATOR",
  PROJECT_DEVELOPER = "PROJECT_DEVELOPER",
  LEADER = "LEADER",
  TEAMMATE = "TEAMMATE",
  STUDENT = "STUDENT",
  MENTOR = "MENTOR",
  TRAINER = "TRAINER",
  HR = "HR",
}

/**
 * Chuẩn hóa tên role từ backend (hỗ trợ "Sub-Admin", "Project Developer", "admin", "EDUCATOR", v.v.)
 * thành định dạng chuẩn SNAKE_UPPERCASE (e.g. SUB_ADMIN, PROJECT_DEVELOPER, ADMIN).
 */
export function normalizeRole(roleName?: string | null): string {
  if (!roleName) return "";
  return roleName
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Lấy danh sách roles đã được chuẩn hóa từ object user
 */
export function getUserNormalizedRoles(user: any): string[] {
  if (!user) return [];
  const rawRoles: string[] = [
    ...(Array.isArray(user?.role_names) ? user.role_names : []),
    user?.quiz_role || "",
  ];
  return Array.from(
    new Set(
      rawRoles
        .map(normalizeRole)
        .filter((r): r is string => Boolean(r) && r.length > 0)
    )
  );
}

/**
 * Kiểm tra xem user có ít nhất một trong các role được chỉ định không
 */
export function hasAnyRole(user: any, allowedRoles: (AppRole | string)[]): boolean {
  if (!user) return false;
  const userRoles = getUserNormalizedRoles(user);
  if (userRoles.includes(AppRole.ADMIN)) return true; // Admin luôn có toàn quyền

  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return userRoles.some((role) => normalizedAllowed.includes(role));
}

/**
 * Kiểm tra quyền sở hữu (Chỉ Owner hoặc Admin)
 */
export function isOwnerOrAdmin(user: any, ownerId?: number | null): boolean {
  if (!user) return false;
  const userRoles = getUserNormalizedRoles(user);
  if (userRoles.includes(AppRole.ADMIN)) return true;
  if (!ownerId) return false;
  return Number(user.id) === Number(ownerId);
}
