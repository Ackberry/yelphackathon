import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/verify
 * Verify the current session token and return user info
 */
router.post('/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.auth) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication information found',
        statusCode: 401,
      });
    }

    res.json({
      userId: req.auth.userId,
      sessionId: req.auth.sessionId,
      verified: true,
    });
  } catch (error) {
    console.error('Verify endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify session',
      statusCode: 500,
    });
  }
});

export default router;
