import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getHousehold, inviteMember, joinHousehold, updateName,leaveHousehold, removeMember, getMyInvites, rejectInvite, revokeInvite, getStaples, toggleStaple } from '../controllers/householdController.js';
const router = express.Router();

router.use(requireAuth);

// Core
router.get('/', getHousehold);
router.patch('/name', updateName);
router.post('/leave', leaveHousehold);
router.post('/remove-member', removeMember);

// Invites
router.post('/invite', inviteMember);
router.post('/join', joinHousehold);
router.get('/invites/me', getMyInvites);
router.post('/invites/reject', rejectInvite);
router.post('/invites/revoke', revokeInvite);

// Staples
router.get('/staples', getStaples);
router.post('/staples/toggle', toggleStaple);

export default router;
