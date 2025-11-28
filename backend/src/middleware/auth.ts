import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Extend Express Request to include user info
export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
}

/**
 * Authentication middleware that validates Clerk JWT tokens
 * Extracts the token from the Authorization header and verifies it
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(token, token);
    
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
        statusCode: 401,
      });
    }

    // Attach user info to request
    req.auth = {
      userId: session.userId,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
      statusCode: 401,
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await clerkClient.sessions.verifySession(token, token);
      
      if (session) {
        req.auth = {
          userId: session.userId,
          sessionId: session.id,
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth if verification fails
    next();
  }
}
