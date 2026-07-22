// API response type definitions
// Explicit JSON contracts for production-grade APIs

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
};
