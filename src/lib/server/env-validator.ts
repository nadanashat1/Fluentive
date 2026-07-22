/**
 * Environment Validator — Fail-Fast Boot Guard
 *
 * Call validateEnv() at process startup, before any database or provider
 * connections are initialized.
 *
 * Design principles:
 * - Missing required secrets throw IMMEDIATELY and halt the process.
 * - Malformed URLs are caught before the first DB connection attempt.
 * - Partial initialization is not acceptable. Boot fully or fail deterministically.
 * - In development, warnings are emitted rather than hard failures for optional vars.
 */
import 'server-only';
import { logger } from '@/lib/observability/logger';

// ── Variable definitions ───────────────────────────────────────────────────────

interface EnvSpec {
  key: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
  validationMessage?: string;
}

const ENV_SPECS: EnvSpec[] = [
  // Core — hard required. App cannot boot without these.
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validate: (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'),
    validationMessage: 'Must be a valid postgresql:// URL',
  },
  {
    key: 'JWT_SECRET',
    required: true,
    description: 'JWT signing secret',
    validate: (v) => v.length >= 32,
    validationMessage: 'Must be at least 32 characters',
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public application URL',
    validate: (v) => v.startsWith('http://') || v.startsWith('https://'),
    validationMessage: 'Must be a valid URL',
  },
  {
    key: 'FRONTEND_URL',
    required: true,
    description: 'Frontend origin URL for CORS',
    validate: (v) => v.startsWith('http://') || v.startsWith('https://'),
    validationMessage: 'Must be a valid URL',
  },

  // Important — emit warnings when absent but do not block boot.
  {
    key: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
  },
  {
    key: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
  },
  {
    key: 'REDIS_URL',
    required: false,
    description: 'Redis URL for AI overview cache',
  },
];

// ── Validator ─────────────────────────────────────────────────────────────────

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const spec of ENV_SPECS) {
    const value = process.env[spec.key];

    if (!value || value.trim() === '') {
      if (spec.required) {
        errors.push(`MISSING [${spec.key}]: ${spec.description}`);
      } else if (isProduction) {
        warnings.push(`ABSENT [${spec.key}]: ${spec.description} — some features may be unavailable`);
      }
      continue;
    }

    // Run format validation if provided.
    if (spec.validate && !spec.validate(value)) {
      errors.push(`INVALID [${spec.key}]: ${spec.validationMessage ?? 'Failed validation'}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Fail-fast variant. Call during process startup.
 * Emits a structured FATAL log entry and throws synchronously on any error.
 * Warnings are emitted but do not block startup.
 */
export function assertEnv(): void {
  const { valid, errors, warnings } = validateEnv();

  for (const warning of warnings) {
    logger.warn('env-validator', warning);
  }

  if (!valid) {
    const message = `Environment validation failed. Boot aborted.\n${errors.map(e => `  • ${e}`).join('\n')}`;

    logger.fatal('env-validator', message);

    // Hard exit — do not allow partial initialization in production, unless it is build time.
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildTime) {
      logger.warn('env-validator', 'Validation failed during build time. Skipping hard exit.');
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // In dev, throw so the error surfaces in the terminal without killing nodemon.
      throw new Error(message);
    }
  }

  logger.info('env-validator', 'Environment validation passed', {
    variables: ENV_SPECS.filter(s => process.env[s.key]).map(s => s.key),
  });
}
