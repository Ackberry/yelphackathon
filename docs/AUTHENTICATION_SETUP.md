# Authentication Setup Guide

This document describes the authentication implementation using Clerk.

## Overview

The application uses Clerk for authentication, providing:
- User sign-up and sign-in
- JWT-based session management
- Protected routes in the frontend
- JWT validation middleware in the backend
- Cross-device persistence of user data

## Setup Instructions

### 1. Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Get your API keys from the dashboard

### 2. Configure Environment Variables

#### Frontend (.env)
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

#### Backend (.env)
```bash
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

### 3. Install Dependencies

Dependencies are already included in package.json:
- Frontend: `@clerk/clerk-react`
- Backend: `@clerk/clerk-sdk-node`

## Implementation Details

### Frontend Components

1. **ClerkProvider** (`frontend/src/main.tsx`)
   - Wraps the entire application
   - Provides authentication context

2. **ProtectedRoute** (`frontend/src/components/auth/ProtectedRoute.tsx`)
   - Wrapper component for protected routes
   - Redirects unauthenticated users to sign-in

3. **Sign-In/Sign-Up Pages** (`frontend/src/App.tsx`)
   - Uses Clerk's pre-built components
   - Routes: `/sign-in` and `/sign-up`

4. **HomePage** (`frontend/src/pages/HomePage.tsx`)
   - Protected page example
   - Shows user information and sign-out button

### Backend Middleware

1. **requireAuth** (`backend/src/middleware/auth.ts`)
   - Validates JWT tokens from Authorization header
   - Attaches user info to request object
   - Returns 401 for invalid/missing tokens

2. **optionalAuth** (`backend/src/middleware/auth.ts`)
   - Validates tokens if present
   - Continues without auth if token is missing
   - Useful for endpoints that work with or without auth

### API Endpoints

- `POST /api/auth/verify` - Verify current session token

## Property-Based Testing

The authentication implementation includes property-based tests that verify:

**Property 11: Cross-device persistence**
- Saved places are identical across different devices
- Empty saved places persist correctly
- Different users have isolated data

Test file: `frontend/src/test/auth.property.test.ts`

Run tests: `npm test` (in frontend directory)

## Usage Example

### Frontend - Accessing User Info
```typescript
import { useUser, useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const callAPI = async () => {
    const token = await getToken();
    const response = await fetch('/api/protected', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };
}
```

### Backend - Protected Endpoint
```typescript
import { requireAuth, AuthRequest } from './middleware/auth';

router.get('/protected', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.auth?.userId;
  // Use userId to fetch user-specific data
});
```

## Requirements Validated

This implementation satisfies the following requirements:

- **1.2**: User account creation and authentication
- **1.4**: Authentication and access to main interface
- **1.5**: Login with existing credentials
- **5.7**: Cross-device persistence (validated by property tests)

## Next Steps

To use authentication in your application:

1. Set up environment variables with your Clerk keys
2. Wrap protected routes with `<ProtectedRoute>`
3. Use `requireAuth` middleware on backend endpoints
4. Access user info with `useUser()` hook in frontend
5. Get JWT tokens with `getToken()` for API calls
