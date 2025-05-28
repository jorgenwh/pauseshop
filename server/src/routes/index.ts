/**
 * Route aggregator
 */

import { Router } from 'express';
import { healthCheckHandler } from './health';

const router = Router();

// Health check endpoint
router.get('/health', healthCheckHandler);

export default router;
