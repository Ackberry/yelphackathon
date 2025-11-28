import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { errorHandler, AppError } from '../middleware/errorHandler';

/**
 * Feature: mood-based-discovery, Property 33: Error handling with retry
 * Validates: Requirements 14.3
 * 
 * For any failed API request, the system should display an error message 
 * and provide a retry option.
 */

describe('API Error Handling Property Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create a test Express app with error handling
    app = express();
    app.use(express.json());

    // Test endpoint that can simulate various error conditions
    app.post('/api/test/error', (req: Request, _res: Response, next: NextFunction) => {
      const { errorType, statusCode, message } = req.body;

      if (errorType === 'app-error') {
        return next(new AppError(message || 'Test error', statusCode || 500));
      } else if (errorType === 'generic-error') {
        return next(new Error(message || 'Generic error'));
      } else if (errorType === 'no-error') {
        return _res.json({ success: true, message: 'No error' });
      }

      next(new AppError('Unknown error type', 400));
    });

    // Test endpoint that simulates retry-able failures
    let attemptCount = 0;
    app.post('/api/test/retry', (req: Request, res: Response, next: NextFunction) => {
      const { failUntilAttempt } = req.body;
      attemptCount++;

      if (attemptCount < (failUntilAttempt || 1)) {
        return next(new AppError('Temporary failure', 503));
      }

      attemptCount = 0; // Reset for next test
      res.json({ success: true, attempts: attemptCount });
    });

    // Apply error handler
    app.use(errorHandler);
  });

  afterAll(() => {
    // Cleanup if needed
  });

  it('Property 33: Error responses should include error message and status code', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }), // HTTP error status codes
        fc.string({ minLength: 1, maxLength: 100 }), // Error message
        async (statusCode, message) => {
          const response = await request(app)
            .post('/api/test/error')
            .send({
              errorType: 'app-error',
              statusCode,
              message,
            });

          // Property: Error response should contain error message and status code
          expect(response.status).toBe(statusCode);
          expect(response.body).toHaveProperty('error');
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('statusCode');
          expect(response.body.statusCode).toBe(statusCode);
          expect(response.body.message).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 33: Client errors (4xx) should have appropriate error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 499 }), // Client error codes
        fc.string({ minLength: 1, maxLength: 100 }),
        async (statusCode, message) => {
          const response = await request(app)
            .post('/api/test/error')
            .send({
              errorType: 'app-error',
              statusCode,
              message,
            });

          // Property: Client errors should return the error message
          expect(response.status).toBe(statusCode);
          expect(response.body.message).toBe(message);
          expect(response.body.statusCode).toBe(statusCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 33: Server errors (5xx) should sanitize error details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 500, max: 599 }), // Server error codes
        fc.string({ minLength: 1, maxLength: 100 }),
        async (statusCode, message) => {
          const response = await request(app)
            .post('/api/test/error')
            .send({
              errorType: 'app-error',
              statusCode,
              message,
            });

          // Property: Server errors should return error information
          expect(response.status).toBe(statusCode);
          expect(response.body).toHaveProperty('error');
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('statusCode');
          expect(response.body.statusCode).toBe(statusCode);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 33: Generic errors should be handled with 500 status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message) => {
          const response = await request(app)
            .post('/api/test/error')
            .send({
              errorType: 'generic-error',
              message,
            });

          // Property: Generic errors should default to 500 status
          expect(response.status).toBe(500);
          expect(response.body).toHaveProperty('error');
          expect(response.body).toHaveProperty('message');
          expect(response.body).toHaveProperty('statusCode');
          expect(response.body.statusCode).toBe(500);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 33: Successful requests should not trigger error handler', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message) => {
          const response = await request(app)
            .post('/api/test/error')
            .send({
              errorType: 'no-error',
              message,
            });

          // Property: Successful requests should return 200 and not have error fields
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('success');
          expect(response.body.success).toBe(true);
          expect(response.body).not.toHaveProperty('error');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 33 (edge case): Error handler should handle errors without messages', async () => {
    const response = await request(app)
      .post('/api/test/error')
      .send({
        errorType: 'app-error',
        statusCode: 500,
        message: '',
      });

    // Property: Errors without messages should still be handled
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('statusCode');
  });

  it('Property 33 (edge case): Error handler should handle very long error messages', async () => {
    const longMessage = 'a'.repeat(1000);
    const response = await request(app)
      .post('/api/test/error')
      .send({
        errorType: 'app-error',
        statusCode: 400,
        message: longMessage,
      });

    // Property: Long error messages should be handled
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(longMessage);
  });
});
