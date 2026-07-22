/**
 * Reality-First UI Architecture
 * 
 * Core principle: Frontend must NEVER assume data exists.
 * Only four possible states: loading | success | empty | error
 */

export type APIState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty"; data: T | null | [] }
  | { status: "error"; error: string };

export type LoadingState = { status: "loading" };
export type SuccessState<T> = { status: "success"; data: T };
export type EmptyState<T> = { status: "empty"; data: T | null | [] };
export type ErrorState = { status: "error"; error: string };

// Helper functions to create states
export const createLoadingState = (): LoadingState => ({ status: "loading" });
export const createSuccessState = <T>(data: T): SuccessState<T> => ({ status: "success", data });
export const createEmptyState = <T>(data: T | null | [] = null): EmptyState<T> => ({ status: "empty", data });
export const createErrorState = (error: string): ErrorState => ({ status: "error", error });

// Type guards
export const isLoading = <T>(state: APIState<T>): state is LoadingState => state.status === "loading";
export const isSuccess = <T>(state: APIState<T>): state is SuccessState<T> => state.status === "success";
export const isEmpty = <T>(state: APIState<T>): state is EmptyState<T> => state.status === "empty";
export const isError = <T>(state: APIState<T>): state is ErrorState => state.status === "error";
