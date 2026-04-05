import type { Response } from 'express';
import * as householdService from '../services/householdService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';


export const getHousehold = async (req: AuthRequest, res: Response) => {
    try {
        const householdId = req.user!.activeHouseholdId;
        const data = await householdService.getHouseholdDetails(householdId);
        return sendSuccess(res, data, "Household retrieved successfully");
    } catch (error) {
        return sendError(res, "Failed to retrieve household", 500, error);
    }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
    try {
        const { email } = req.body; 
        const householdId = req.user!.activeHouseholdId;

        // Block empty requests
        if (!email || email.trim() === '') {
            return sendError(res, "Recipient email is required.", 400);
        }

        const invite = await householdService.createInvite(householdId, email);
        const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${invite.token}`;
        
        return sendSuccess(res, { inviteLink }, "Invite link generated successfully.");
    } catch (error: any) {
        return sendError(res, error.message || "Failed to generate invite", 500);
    }
};

export const joinHousehold = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { token } = req.body;

        if (!req.body) {
            return sendError(res, "Request body is missing. Ensure Content-Type is application/json", 400);
        }

        if (!token) return sendError(res, "Invite token is required", 400);

        const result = await householdService.acceptInvite(userId, token);
        return sendSuccess(res, result, "Successfully joined household!");
    } catch (error: any) {
        return sendError(res, error.message || "Failed to join household", 400, error);
    }
};

export const updateName = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return sendError(res, "Name is required", 400);
        
        const updated = await householdService.updateHouseholdName(req.user!.activeHouseholdId, req.user!.id, name);
        return sendSuccess(res, updated, "Household name updated");
    } catch (err: any) { return sendError(res, err.message, 400); }
};

export const leaveHousehold = async (req: AuthRequest, res: Response) => {
    try {
        const result = await householdService.leaveHousehold(req.user!.id, req.user!.activeHouseholdId);
        return sendSuccess(res, result, "Successfully left household");
    } catch (err: any) { return sendError(res, err.message, 400); }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    try {
        const { targetUserId } = req.body;
        await householdService.removeMember(req.user!.id, req.user!.activeHouseholdId, targetUserId);
        return sendSuccess(res, null, "Member removed");
    } catch (err: any) { return sendError(res, err.message, 400); }
};

export const getMyInvites = async (req: AuthRequest, res: Response) => {
    try {
        // Assume req.user.email is populated by auth middleware
        const invites = await householdService.getUserInboundInvites(req.user!.email!);
        return sendSuccess(res, invites, "Invites retrieved");
    } catch (err: any) { return sendError(res, err.message, 400); }
};

export const rejectInvite = async (req: AuthRequest, res: Response) => {
    try {
        const { inviteId } = req.body;
        await householdService.rejectInvite(inviteId, req.user!.email!);
        return sendSuccess(res, null, "Invite rejected");
    } catch (err: any) { return sendError(res, err.message, 400); }
};

export const revokeInvite = async (req: AuthRequest, res: Response) => {
    try {
        const { inviteId } = req.body;
        await householdService.revokeInvite(req.user!.id, req.user!.activeHouseholdId, inviteId);
        return sendSuccess(res, null, "Invite revoked successfully");
    } catch (err: any) { 
        return sendError(res, err.message, 400); 
    }
};
