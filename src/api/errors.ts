import axios from "axios";

/**
 * Turns anything thrown into text that is safe to show a student.
 *
 * The backend guarantees `{ success: false, message, code?, errors? }` on
 * every error and that `message` is already written for users, so it is read
 * first. Mirrors the website's `lib/utils/errorHandler.ts`.
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: Record<string, string>;
  data?: unknown;
  isNetworkError: boolean;
  isTimeout: boolean;
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: "That request wasn't valid. Please check your input and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "This conflicts with something that already exists.",
  413: "That's too large to upload.",
  429: "You're doing that too much — please slow down and try again shortly.",
};

const GENERIC = "Something went wrong. Please try again.";
const SERVER = "Something went wrong on our end. Please try again shortly.";
const OFFLINE =
  "You appear to be offline. Please check your internet connection and try again.";
const TIMEOUT =
  "That took too long to respond. Please check your connection and try again.";

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as
        | {
            message?: string;
            code?: string;
            errors?: Record<string, string>;
            data?: unknown;
          }
        | undefined;
      return {
        message:
          (typeof body?.message === "string" && body.message) ||
          STATUS_FALLBACKS[status] ||
          (status >= 500 ? SERVER : GENERIC),
        status,
        code: body?.code,
        fieldErrors: body?.errors,
        data: body?.data,
        isNetworkError: false,
        isTimeout: false,
      };
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return { message: TIMEOUT, isNetworkError: false, isTimeout: true };
    }
    return { message: OFFLINE, isNetworkError: true, isTimeout: false };
  }
  if (error instanceof Error) {
    return { message: error.message, isNetworkError: false, isTimeout: false };
  }
  if (typeof error === "string") {
    return { message: error, isNetworkError: false, isTimeout: false };
  }
  return { message: GENERIC, isNetworkError: false, isTimeout: false };
}

export const getErrorMessage = (error: unknown) => getApiError(error).message;
