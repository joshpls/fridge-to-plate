import crypto from 'crypto';

export const generateSecureToken = () => {
    // Generates a 64-character hex string for the email link
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Hashes the token to store securely in your database
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    return { rawToken, hashedToken };
};
