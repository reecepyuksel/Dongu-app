const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function allowMissingOrigin(): boolean {
  const configured = process.env.ALLOW_MISSING_ORIGIN;
  if (configured === 'true') return true;
  if (configured === 'false') return false;

  // Safer default: strict in production, permissive in non-production.
  return (process.env.NODE_ENV || 'development') !== 'production';
}

export function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.ALLOWED_ORIGINS;
  if (!configuredOrigins) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const parsed = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return allowMissingOrigin();
  }

  return getAllowedOrigins().includes(origin);
}
