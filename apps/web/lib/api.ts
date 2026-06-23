export type ApiResponse<T> = T;

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:4000";

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

