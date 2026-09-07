import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const getEncryptionKey = () => {
  const secret = process.env.SMTP_ENCRYPTION_KEY;
  if (!secret || secret.trim() === '') {
    throw new Error('CRITICAL SECURITY ERROR: SMTP_ENCRYPTION_KEY environment variable is missing.');
  }
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypts a plain text string using AES-256-GCM
 * Returns a base64 string containing: iv:authTag:encryptedText
 */
export const encryptPassword = (text: string): string => {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return Buffer.from(`${iv.toString('hex')}:${authTag}:${encrypted}`).toString('base64');
};

/**
 * Decrypts a base64 payload created by encryptPassword
 */
export const decryptPassword = (payload: string): string => {
  if (!payload || !payload.includes('=')) {
    // If it's not base64 or doesn't look like our payload, return it as-is 
    // to support migration of existing unencrypted passwords.
    return payload;
  }
  
  try {
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const [ivHex, authTagHex, encryptedHex] = decoded.split(':');
    
    if (!ivHex || !authTagHex || !encryptedHex) {
      return payload; // Not our format
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[ENCRYPTION ERROR] Failed to decrypt password. The SMTP_ENCRYPTION_KEY may have changed.', error);
    return '';
  }
};
