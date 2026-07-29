/**
 * Metadata key used by the @Idempotent() decorator to store IdempotentOptions
 * on the route handler, and read back by the Guard/Interceptor via Reflector.
 */
export const IDEMPOTENT_KEY = 'idempotency:options';

/** Request header the client must send. Case-insensitive on the wire. */
export const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';

/** Redis key namespace, versioned so we can change the record shape later. */
export const IDEMPOTENCY_KEY_PREFIX = 'idem:v1';

/** Default TTL (seconds) applied when @Idempotent() doesn't override it. */
export const DEFAULT_TTL_SECONDS = 3600;
