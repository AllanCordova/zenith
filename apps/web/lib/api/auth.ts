import type { LoginInput, RegisterInput } from "@/lib/validations/auth";
import { api } from "./client";
import type { User } from "./types";

export async function login(payload: LoginInput): Promise<User> {
  const { data } = await api.post<User>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterInput): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
