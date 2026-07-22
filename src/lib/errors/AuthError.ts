export class AuthError extends Error {
  public readonly code: 'SESSION_EXPIRED' | 'UNAUTHORIZED' | 'TOKEN_REUSE' | 'NETWORK_ERROR';
  public readonly context?: Record<string, any>;

  constructor(code: AuthError['code'], message?: string, context?: Record<string, any>) {
    super(message || code);
    this.name = 'AuthError';
    this.code = code;
    this.context = context;
  }

  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }

  static sessionExpired(context?: Record<string, any>): AuthError {
    return new AuthError('SESSION_EXPIRED', 'Session has expired', context);
  }

  static unauthorized(context?: Record<string, any>): AuthError {
    return new AuthError('UNAUTHORIZED', 'Unauthorized access', context);
  }

  static tokenReuse(context?: Record<string, any>): AuthError {
    return new AuthError('TOKEN_REUSE', 'Token reuse detected', context);
  }

  static networkError(context?: Record<string, any>): AuthError {
    return new AuthError('NETWORK_ERROR', 'Network error occurred', context);
  }
}
