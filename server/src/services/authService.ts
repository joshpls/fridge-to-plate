// server/src/services/authService.ts
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const registerUser = async (data: any) => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existingUser) {
        throw new Error('Email is already in use.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create the user
    const user = await prisma.user.create({
        data: {
            email: data.email.toLowerCase(),
            password: hashedPassword,
            firstName: data.firstName, 
            lastName: data.lastName, 
            alias: data.alias,
            // First user created gets to be ADMIN, everyone else is a USER
            // Adjust this logic later
            role: (await prisma.user.count()) === 0 ? 'ADMIN' : 'USER',
        }
    });

    // Strip the password before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const validateLogin = async (data: any) => {
    // Find the user
    const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
    });

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    // Compare the plain-text password with the stored hash
    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
        throw new Error('Invalid email or password.');
    }

    // Strip the password before returning
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
