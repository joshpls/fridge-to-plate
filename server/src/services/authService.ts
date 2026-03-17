// server/src/services/authService.ts
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const registerUser = async (data: any) => {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error('Email is already in use.');
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 3. Create the user
    const user = await prisma.user.create({
        data: {
            email: data.email.toLowerCase(),
            password: hashedPassword,
            // First user created gets to be ADMIN, everyone else is a USER
            // Adjust this logic later
            role: (await prisma.user.count()) === 0 ? 'ADMIN' : 'USER',
        }
    });

    // 4. Strip the password before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const validateLogin = async (data: any) => {
    // 1. Find the user
    const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
    });

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    // 2. Compare the plain-text password with the stored hash
    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
        throw new Error('Invalid email or password.');
    }

    // 3. Strip the password before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
