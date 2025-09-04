# Automatizations Server

Backend server for the Automatizations project, built with Node.js, Express, TypeScript, and MongoDB.

## Features

- Authentication and user management
- Business management
- Brandscript management
- Content generation
- Onboarding process
- StoryBrand account management

## StoryBrand Integration

The application integrates with StoryBrand API for account management. By default, it connects to `http://localhost:8101`, but this can be configured using the `VITE_URL_STORYBRAND` environment variable.

### StoryBrand API Endpoints

- `POST /api/storybrand-account`: Create a new StoryBrand account
- `GET /api/storybrand-account/client/:clientId`: Get a StoryBrand account by client ID
- `GET /api/storybrand-account/:accountId`: Get a StoryBrand account by account ID

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- pnpm
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Copy `.env.example` to `.env` and configure the environment variables
4. Start the development server:
   ```
   pnpm dev
   ```

## Project Structure

The project follows a Model-Route-Controller-Service architecture:

- `models/`: Database models
- `routes/`: API routes
- `controllers/`: Request handlers
- `services/`: Business logic and external API integrations
- `errors/`: Custom error classes