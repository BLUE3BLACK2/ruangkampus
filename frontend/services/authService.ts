import api from "./api";
import type { ApiResponse, User } from "@/types";

const TOKEN_KEY = "auth_token";

interface LoginPayload {
  email: string;
  password: string;
  turnstile_token: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "mahasiswa" | "dosen";
  nim?: string;
  nip?: string;
  turnstile_token: string;
}

interface AuthData {
  user: User;
  token: string;
  token_type: string;
}

function saveToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    const response = await api.post<ApiResponse<AuthData>>(
      "/login",
      payload
    );

    const { user, token } = response.data.data;

    saveToken(token);

    return user;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const response = await api.post<ApiResponse<AuthData>>(
      "/register",
      payload
    );

    const { user, token } = response.data.data;

    saveToken(token);

    return user;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>("/me");

    return response.data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;

    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  async updateProfile(payload: {
    name: string;
    email: string;
  }): Promise<User> {
    const response = await api.put<ApiResponse<{ user: User }>>(
      "/me",
      payload
    );

    return response.data.data.user;
  },

  async updatePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await api.put("/me/password", payload);
  },
};