import { prisma } from '../config/db.js';
import crypto from 'crypto';

// --- Safe Removal & Ownership Transfer ---
const safelyRemoveUserFromHousehold = async (tx: any, userId: string, householdId: string) => {
    const memberRecord = await tx.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } }
    });

    if (!memberRecord) return;

    if (memberRecord.role === 'OWNER') {
        const nextMember = await tx.householdMember.findFirst({
            where: { householdId, userId: { not: userId } },
            orderBy: { joinedAt: 'asc' } // [FIX] Changed from createdAt to joinedAt
        });

        if (nextMember) {
            await tx.householdMember.update({
                where: { userId_householdId: { userId: nextMember.userId, householdId } },
                data: { role: 'OWNER' }
            });
        } else {
            await tx.household.delete({ where: { id: householdId } });
            return; 
        }
    }
    
    await tx.householdMember.delete({
        where: { userId_householdId: { userId, householdId } }
    });
};

const assignFallbackHousehold = async (tx: any, user: any) => {
    const newHousehold = await tx.household.create({
        data: { name: `${user.firstName || 'Personal'} Household` }
    });
    await tx.householdMember.create({
        data: { userId: user.id, householdId: newHousehold.id, role: 'OWNER' }
    });
    await tx.user.update({
        where: { id: user.id },
        data: { activeHouseholdId: newHousehold.id }
    });
    return newHousehold;
};

// --- EXISTING ENDPOINTS UPDATED ---

export const getHouseholdDetails = async (householdId: string) => {
    return await prisma.household.findUnique({
        where: { id: householdId },
        include: {
            members: {
                include: { user: { select: { id: true, firstName: true, lastName: true, alias: true, email: true } } }
            },
            invites: { where: { status: 'PENDING' } }
        }
    });
};

export const createInvite = async (householdId: string, email: string) => {
    if (!email) throw new Error("An email address is required to send an invitation.");

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        const isMember = await prisma.householdMember.findUnique({
            where: { userId_householdId: { userId: existingUser.id, householdId } }
        });
        if (isMember) throw new Error("User is already in this household.");
    }

    // Deduplication check
    const existingInvite = await prisma.householdInvite.findFirst({
        where: { householdId, email, status: 'PENDING', expiresAt: { gt: new Date() } }
    });
    if (existingInvite) return existingInvite; 

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save with the mandatory email
    const invite = await prisma.householdInvite.create({
        data: { householdId, email, token, expiresAt, status: 'PENDING' }
    });

    return invite;
};

export const acceptInvite = async (userId: string, token: string) => {
    return await prisma.$transaction(async (tx) => {
        const invite = await tx.householdInvite.findUnique({ where: { token } });
        
        if (!invite) throw new Error("Invalid invitation token.");
        if (invite.status !== 'PENDING') throw new Error("Invitation has already been used or revoked.");
        if (invite.expiresAt < new Date()) throw new Error("Invitation has expired.");

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found.");

        // Verify the logged-in user matches the invited email
        if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
            throw new Error(`This invitation was sent to ${invite.email}. Please log in with that account.`);
        }

        if (user.activeHouseholdId) {
            await safelyRemoveUserFromHousehold(tx, userId, user.activeHouseholdId);
        }

        await tx.householdMember.create({
            data: { userId, householdId: invite.householdId, role: 'MEMBER' }
        });

        await tx.householdInvite.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED' }
        });

        await tx.user.update({
            where: { id: userId },
            data: { activeHouseholdId: invite.householdId }
        });

        return { householdId: invite.householdId };
    });
};

export const revokeInvite = async (adminId: string, householdId: string, inviteId: string) => {
    const admin = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId: adminId, householdId } }
    });

    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
        throw new Error("Only Admins and Owners can revoke invites.");
    }

    return await prisma.householdInvite.delete({
        where: { id: inviteId }
    });
};

export const updateHouseholdName = async (householdId: string, userId: string, newName: string) => {
    const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } }
    });

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new Error("Only an Owner or Admin can change the household name.");
    }

    return await prisma.household.update({
        where: { id: householdId },
        data: { name: newName }
    });
};

export const leaveHousehold = async (userId: string, householdId: string) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        const memberCount = await tx.householdMember.count({ where: { householdId } });
        if (memberCount <= 1) {
            throw new Error("You cannot leave a household if you are the only member. (Invite someone else, or join a new household).");
        }

        await safelyRemoveUserFromHousehold(tx, userId, householdId);
        const fallback = await assignFallbackHousehold(tx, user);
        
        return { newHouseholdId: fallback.id };
    });
};

export const removeMember = async (adminId: string, householdId: string, targetUserId: string) => {
    return await prisma.$transaction(async (tx) => {
        const admin = await tx.householdMember.findUnique({
            where: { userId_householdId: { userId: adminId, householdId } }
        });

        if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
            throw new Error("Unauthorized.");
        }

        const targetUser = await tx.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new Error("Target user not found");

        await safelyRemoveUserFromHousehold(tx, targetUserId, householdId);
        await assignFallbackHousehold(tx, targetUser);

        return true;
    });
};

export const getUserInboundInvites = async (email: string) => {
    return await prisma.householdInvite.findMany({
        where: { email, status: 'PENDING', expiresAt: { gt: new Date() } },
        include: { household: { select: { name: true } } }
    });
};

export const rejectInvite = async (inviteId: string, email: string) => {
    const invite = await prisma.householdInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.email !== email) throw new Error("Unauthorized");

    return await prisma.householdInvite.update({
        where: { id: inviteId },
        data: { status: 'REJECTED' }
    });
};
