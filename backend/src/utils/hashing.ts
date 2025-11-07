// backend/src/utils/hashing.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function doHash(plain: string, saltRounds = 12): Promise<string> {
    return bcrypt.hash(plain, saltRounds);
}

export async function doHashValidation(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

/**
 * HMAC for verification codes
 * - secret must be set in process.env.HMAC_VERIFICATION_CODE_SECRET
 */
export function hmacProcess(value: string, secret?: string): string {
    const key = secret || process.env.HMAC_VERIFICATION_CODE_SECRET || 'dev-hmac-secret';
    return crypto.createHmac('sha256', key).update(String(value)).digest('hex');
}
export default { doHash, doHashValidation, hmacProcess };
