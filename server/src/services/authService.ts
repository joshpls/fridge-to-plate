// server/src/services/authService.ts
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const registerUser = async (data: any) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error('Email is already in use.');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
        const role = (await tx.user.count()) === 0 ? 'ADMIN' : 'USER';

        // Create the base User with verification tokens
        const user = await tx.user.create({
            data: {
                email: data.email.toLowerCase(),
                password: hashedPassword,
                firstName: data.firstName, 
                lastName: data.lastName, 
                alias: data.alias,
                role: role,
                verifyToken: data.verifyToken,
                verifyTokenExpires: data.verifyTokenExpires
            }
        });

        // Create their default Personal Household
        const householdName = data.firstName ? `${data.firstName}'s Household` : 'Personal Household';
        const household = await tx.household.create({
            data: {
                name: householdName,
            }
        });

        // Link the User to the Household as the OWNER
        await tx.householdMember.create({
            data: {
                userId: user.id,
                householdId: household.id,
                role: 'OWNER',
            }
        });

        // Update the user's activeHouseholdId to this newly created household
        const finalizedUser = await tx.user.update({
            where: { id: user.id },
            data: { activeHouseholdId: household.id }
        });

        return finalizedUser;
    });

    // Strip the password before returning
    const { password, ...userWithoutPassword } = result;
    return userWithoutPassword;
};

export const validateLogin = async (data: any) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
    });

    if (!user) throw new Error('Invalid email or password.');

    // Block login if email is not verified
    if (!user.isEmailVerified) {
        throw new Error('Please verify your email before logging in. Check your inbox.');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new Error('Invalid email or password.');

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// --- NEW METHODS FOR EMAIL VERIFICATION & RESET ---

export const verifyUserEmail = async (hashedToken: string) => {
    const user = await prisma.user.findFirst({
        where: {
            verifyToken: hashedToken,
            verifyTokenExpires: { gt: new Date() }
        }
    });

    if (!user) throw new Error('Token is invalid or has expired.');

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            verifyToken: null,
            verifyTokenExpires: null,
        }
    });

    return true;
};

export const setResetPasswordToken = async (email: string, hashedToken: string, expiresAt: Date) => {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return null; // We return null instead of throwing to prevent email enumeration

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: expiresAt
        }
    });

    return user;
};

export const resetUserPassword = async (hashedToken: string, newPassword: string) => {
    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { gt: new Date() }
        }
    });

    if (!user) throw new Error('Token is invalid or has expired.');

    const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: newHashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        }
    });

    return true;
};

export const updatePassword = async (userId: string, currentPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(currentPass, user.password);
    if (!isValid) throw new Error("Incorrect current password");

    const newHashedPassword = await bcrypt.hash(newPass, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: userId },
        data: { password: newHashedPassword }
    });
    
    return true;
};
