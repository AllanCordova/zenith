import axios from "axios";

type NestErrorBody = {
  message?: string | string[];
};

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as NestErrorBody | undefined)?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message.join(" ");
    }
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}
