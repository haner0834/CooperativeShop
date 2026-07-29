import { ConflictException } from '@nestjs/common';

/** Case B: another in-flight request holds the lock for this key. */
export class IdempotencyProcessingException extends ConflictException {
  constructor() {
    super('Request is already being processed.');
  }
}

/** Case D: key reused with a different method/path/body (or whitelisted header). */
export class IdempotencyKeyReusedException extends ConflictException {
  constructor() {
    super('Idempotency-Key has already been used for another request.');
  }
}
