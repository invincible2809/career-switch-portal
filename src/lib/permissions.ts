// One permission map for every role (PLAN A10). New roles (e.g. CONTENT_EDITOR, ASSESSOR)
// are added here without changing each route.
export type Role = "LEARNER" | "ADMIN";

export type Action =
  | "admin:access"
  | "content:edit"
  | "content:publish"
  | "assessment:configure"
  | "users:manage"
  | "audit:read"
  | "reports:read";

const PERMISSIONS: Record<Role, readonly Action[]> = {
  LEARNER: [],
  ADMIN: ["admin:access", "content:edit", "content:publish", "assessment:configure", "users:manage", "audit:read", "reports:read"],
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false;
}
