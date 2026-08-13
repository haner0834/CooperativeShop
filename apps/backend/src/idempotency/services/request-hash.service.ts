import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Computes a stable SHA-256 hash of the business-relevant parts of a
 * request (method + normalized path + canonical body + whitelisted
 * headers). Used to detect whether an Idempotency-Key is being reused
 * for a genuinely different request (spec section 9).
 *
 * Intentionally has no Redis / Nest-request-object dependency so it can
 * be unit tested in isolation.
 */
@Injectable()
export class RequestHashService {
  hash(
    method: string,
    path: string,
    body: unknown,
    extraHeaders: Record<string, string> = {},
  ): string {
    const normalizedPath = this.normalizePath(path);
    const canonicalBody = this.canonicalJson(body ?? null);
    const canonicalHeaders = this.canonicalJson(extraHeaders);

    const raw = [
      method.toUpperCase(),
      normalizedPath,
      canonicalBody,
      canonicalHeaders,
    ].join('\u0000');

    return createHash('sha256').update(raw).digest('hex');
  }

  /** Strips query string and trailing slash so retries with cache-busting
   * query params or trailing-slash variations still hash the same. */
  private normalizePath(path: string): string {
    const [pathname] = path.split('?');
    if (pathname.length > 1 && pathname.endsWith('/')) {
      return pathname.slice(0, -1);
    }
    return pathname || '/';
  }

  private canonicalJson(value: unknown): string {
    return JSON.stringify(this.sortKeysDeep(value));
  }

  /** Recursively sorts object keys so key order never affects the hash. */
  private sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortKeysDeep(item));
    }

    if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(
        ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
      );

      return entries.reduce<Record<string, unknown>>((acc, [key, val]) => {
        acc[key] = this.sortKeysDeep(val);
        return acc;
      }, {});
    }

    return value;
  }
}
