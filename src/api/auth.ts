import client from "./client";
import { LoginResponse } from "../types/auth";

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await client.post<LoginResponse>("/api/auth/login", {
    email,
    password,
  });
  return response.data;
}
