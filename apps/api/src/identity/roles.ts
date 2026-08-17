export const STAFF_ROLES = [
  "ADMIN",
  "DEPARTMENT_HEAD",
  "FRONT_DESK",
  "COORDINATOR",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type Principal = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  departmentId: string | null;
  active: boolean;
};
