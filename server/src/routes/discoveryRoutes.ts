import express from 'express';
import { getDiscoveryBootstrap } from '../controllers/discoveryController.js';

const router = express.Router();

router.get('/bootstrap', getDiscoveryBootstrap);

export default router;
