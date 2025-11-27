# Setup Instructions

## Prerequisites

1. Node.js 18+ installed
2. A Clerk account (sign up at https://clerk.com)
3. MongoDB Atlas account (or local MongoDB)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Clerk

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy your Publishable Key and Secret Key

## Step 3: Configure Environment Variables

### Frontend (.env in frontend/ directory)

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:3000
```

### Backend (.env in backend/ directory)

Create `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mood-based-discovery

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# External APIs (to be configured later)
YELP_API_KEY=your_yelp_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# CORS
FRONTEND_URL=http://localhost:5173
```

## Step 4: Run the Application

### Development Mode (Both servers)

```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3000

### Or run separately:

```bash
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
npm run dev:backend
```

## Step 5: Test Authentication

1. Open http://localhost:5173 in your browser
2. You should be redirected to the sign-in page
3. Click "Sign up" to create a new account
4. After signing up, you'll be redirected to the home page
5. You should see your name and a user button in the header

## Current Implementation Status

✅ Task 1: Project structure and development environment
✅ Task 2: Authentication with Clerk
  - Frontend: Clerk React SDK configured
  - Sign-in and sign-up pages created
  - Protected route wrapper implemented
  - Backend: Clerk authentication middleware
  - JWT validation endpoint

## Next Steps

- Task 3: Set up database and user models
- Task 4: Integrate Google Maps
- Task 5: Build backend API foundation
- And more...

## Troubleshooting

### "Missing Clerk Publishable Key" Error

Make sure you've created the `.env` files in both `frontend/` and `backend/` directories with your Clerk keys.

### CORS Errors

Ensure the `FRONTEND_URL` in `backend/.env` matches your frontend URL (default: http://localhost:5173).

### Port Already in Use

If port 3000 or 5173 is already in use, you can change them:
- Frontend: Edit `frontend/vite.config.ts` and change the `server.port`
- Backend: Change `PORT` in `backend/.env`
