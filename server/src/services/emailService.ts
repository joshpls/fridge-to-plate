import { Resend } from 'resend';

// Initialize Resend using your environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Simple Circuit Breaker ---
let monthlyEmailCount = 0;
let currentMonth = new Date().getMonth();

const checkEmailLimit = () => {
    const now = new Date();
    // Reset counter if we are in a new month
    if (now.getMonth() !== currentMonth) {
        monthlyEmailCount = 0; 
        currentMonth = now.getMonth();
    }

    // Stop at 2,950 to give a 50-email safety buffer before Resend cuts us off
    if (monthlyEmailCount >= 2950) {
        throw new Error("Internal limit reached: Halting outbound emails to protect quota.");
    }
};

// --- Email Functions ---

export const sendVerificationEmail = async (email: string, rawToken: string) => {
    checkEmailLimit();
    
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev', // CHANGE THIS to my verified domain later
        to: email, // While testing, this MUST be your verified personal email
        subject: 'Verify your account',
        html: `
            <h2>Welcome!</h2>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #f97316; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        `
    });

    if (error) throw new Error(error.message);
    
    monthlyEmailCount++;
    return data;
};

export const sendPasswordResetEmail = async (email: string, rawToken: string) => {
    checkEmailLimit();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev', // CHANGE THIS to my verified domain later
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h2>Password Reset</h2>
            <p>You requested a password reset. Click the link below to choose a new password. This link is valid for 15 minutes.</p>
            <a href="${resetUrl}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this, you can safely ignore this email.</p>
        `
    });

    if (error) throw new Error(error.message);
    
    monthlyEmailCount++;
    return data;
};
