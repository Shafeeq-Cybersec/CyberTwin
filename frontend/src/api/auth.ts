import apiClient from "./client";
import type { AuthTokens, User } from "../types";

/** Exchange credentials for a JWT (OAuth2 password flow). */
export async function login(email: string, password: string): Promise<AuthTokens> {
  const form = new URLSearchParams({ username: email, password });
  const { data } = await apiClient.post<AuthTokens>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

/** Fetch the currently authenticated user's profile. */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}
