export type UserRole = "CLIENT" | "TRAINER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
