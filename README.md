# Mood-Based Discovery

A full-stack web application that combines conversational AI with interactive mapping to help users discover local businesses based on their preferences, moods, and context.

## Project Structure

This is a monorepo containing three workspaces:

```
mood-based-discovery/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript
├── shared/            # Shared TypeScript types
└── package.json       # Root workspace configuration
```

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local or MongoDB Atlas)

## Getting Started

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your API keys and configuration
```

### 3. Run Development Servers

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run them separately:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3000
```

## Available Scripts

### Root Level

- `npm run dev` - Run both frontend and backend in development mode
- `npm run build` - Build all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check all workspaces

### Frontend

- `npm run dev --workspace=frontend` - Start Vite dev server
- `npm run build --workspace=frontend` - Build for production
- `npm run preview --workspace=frontend` - Preview production build

### Backend

- `npm run dev --workspace=backend` - Start Express server with hot reload
- `npm run build --workspace=backend` - Compile TypeScript
- `npm run start --workspace=backend` - Run compiled JavaScript

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Zustand (state management)
- React Query (data fetching)
- Clerk (authentication)

### Backend

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Clerk SDK
- Axios

### External APIs

- Yelp AI Chat API
- Google Maps JavaScript API
- OpenWeatherMap API

## Development

The project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Shared types** for consistency between frontend and backend

## License

Private - All rights reserved
