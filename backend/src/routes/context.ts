import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/context/current
 * Get current context (time, weather, location)
 */
router.get('/current', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    // TODO: Implement context retrieval
    res.json({
      message: 'Context endpoint - to be implemented',
      query: req.query,
      userId: req.auth?.userId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
