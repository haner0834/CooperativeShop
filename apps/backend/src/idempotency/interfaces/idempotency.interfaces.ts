/** Options accepted by the @Idempotent() decorator. */
export interface IdempotentOptions {
  /** Redis TTL in seconds for this endpoint's idempotency record. */
  ttl?: number;
  /**
   * If true, failed (thrown) responses are cached and replayed on retry.
   * If false (default), a failed request clears the lock so the client
   * can safely retry with the same key.
   */
  replayErrors?: boolean;
  /**
   * Header names (case-insensitive) that affect business logic and should
   * therefore be included in the request hash alongside method/path/body.
   * e.g. ['X-Shop-Id']
   */
  headerWhitelist?: string[];
}

/** Shape of the value stored in Redis at idem:v1:{userId}:{key}. */
export interface IdempotencyRecord {
  status: 'processing' | 'completed';
  requestHash: string;
  statusCode?: number;
  response?: unknown;
  createdAt: number;
}

/** Context the Guard attaches to the request; consumed by the Interceptor. */
export interface IdempotencyContext {
  replay: boolean;
  key: string;
  requestHash: string;
  ttl: number;
  record?: IdempotencyRecord;
}

// Augment Express's Request so req.idempotency is typed everywhere
// (Guard, Interceptor, and any custom code) without casting to `any`.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      idempotency?: IdempotencyContext;
    }
  }
}
