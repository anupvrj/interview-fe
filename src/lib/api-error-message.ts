import axios, { AxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  error?: string;
};

/**
 * Human-readable message from axios/API errors (Fastify often sends `{ message }`).
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<unknown>;
    const data = ax.response?.data as ApiErrorBody | string | undefined;

    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    }

    const status = ax.response?.status;
    if (status === 401) {
      return "Please sign in again and try uploading your resume.";
    }
    if (status === 413) {
      return "File is too large. Maximum size is 5 MB.";
    }
    if (status === 400 && data && typeof data === "object") {
      const msg = (data as ApiErrorBody).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }

    if (!ax.response) {
      if (ax.code === "ECONNABORTED") {
        return "Request timed out. Check your connection and try again.";
      }
      if (ax.message === "Network Error") {
        return "Network error — could not reach the server. Check your connection and that the app URL is correct.";
      }
      return "Could not reach the server. Please try again in a moment.";
    }

    const rawBody = ax.response?.data;
    if (typeof rawBody === "string" && rawBody.trim()) {
      return rawBody;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
