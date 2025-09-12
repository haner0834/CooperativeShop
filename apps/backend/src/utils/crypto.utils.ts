import crypto from "crypto";
import bcrypt from "bcrypt";
import { env } from "./env.utils";
import { InternalError } from "../types/error.types";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const KEK_HEX = env("KEK_HEX");

if (!KEK_HEX || Buffer.from(KEK_HEX, "hex").length !== KEY_LENGTH) {
  throw new InternalError(
    "KEY_ENCRYPTION_KEY is not defined in .env or is not a 32-byte hex string."
  );
}

const KEK = Buffer.from(KEK_HEX, "hex");

const encrypt = (plaintext: string | Buffer, key: Buffer): Buffer => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Prepend IV and Auth Tag to the ciphertext for storage.
  return Buffer.concat([iv, authTag, encrypted]);
};

const decrypt = (encryptedBuffer: Buffer, key: Buffer): Buffer | null => {
  try {
    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const authTag = encryptedBuffer.subarray(
      IV_LENGTH,
      IV_LENGTH + AUTH_TAG_LENGTH
    );
    const ciphertext = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

export const generateUek = (): Buffer => {
  return crypto.randomBytes(KEY_LENGTH);
};

export const encryptUek = (uek: Buffer): Buffer => {
  return encrypt(uek, KEK);
};

export const decryptUek = (encryptedUek: Buffer): Buffer | null => {
  return decrypt(encryptedUek, KEK);
};

export const encryptWithUek = (plaintext: string, uek: Buffer): Buffer => {
  return encrypt(plaintext, uek);
};

export const decryptWithUek = (
  encryptedData: Buffer,
  uek: Buffer
): string | null => {
  const decrypted = decrypt(encryptedData, uek);
  return decrypted ? decrypted.toString("utf-8") : null;
};

/**
 * Hashes a refresh token for safe storage in the database.
 * @param token The raw refresh token.
 * @returns A promise that resolves to the hashed token.
 */
export const hashRefreshToken = async (token: string): Promise<string> => {
  // We don't need a high salt round for this, as it's not a user password
  // but hashing prevents direct use if the DB is compromised.
  return bcrypt.hash(token, 8);
};

/**
 * Compares a raw refresh token with its hashed version from the database.
 * @param token The raw refresh token from the client.
 * @param hashedToken The stored hashed token from the database.
 * @returns A promise that resolves to true if they match.
 */
export const compareRefreshToken = async (
  token: string,
  hashedToken: string
): Promise<boolean> => {
  return bcrypt.compare(token, hashedToken);
};
