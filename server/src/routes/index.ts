/**
 * Route aggregator
 */

import { Router } from 'express';
import { healthCheckHandler } from './health';
import { analyzeImageHandler, analyzeImageStreamingHandler } from './analyze';

const router = Router();

// Health check endpoint
router.get('/health', healthCheckHandler);

// Image analysis endpoint
router.post('/analyze', analyzeImageHandler);
router.post('/analyze/stream', analyzeImageStreamingHandler);

export default router;
