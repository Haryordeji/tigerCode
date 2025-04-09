# TigerCode Backend

Backend server for the TigerCode application, which helps students bridge the gap between algorithms knowledge and interview-style coding questions.

## Features

- RESTful API for patterns and quiz data
- User authentication with JWT and Google OAuth
- User progress tracking
- MongoDB database integration

## Prerequisites

- Node.js (>= 14.x)
- MongoDB (local or Atlas)
- Google OAuth credentials (for Google Sign-In)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tigercode-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/tigercode
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```

   Replace the placeholder values with your actual configuration.

## Database Setup

1. Start MongoDB (if using a local instance):
   ```bash
   mongod
   ```

2. Seed the database with initial data:
   ```bash
   npm run seed
   ```

3. Create an admin user (optional):
   ```bash
   npm run seed admin
   ```

## Running the Server

### Development Mode

```bash
npm run dev
```

This will start the server with hot reloading enabled.

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user's profile
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/logout` - Logout user

### Patterns

- `GET /api/patterns` - Get all patterns
- `GET /api/patterns/:id` - Get specific pattern by ID
- `PUT /api/patterns/:id/complete` - Mark pattern as completed
- `GET /api/patterns/user/progress` - Get user's pattern progress

### Quiz

- `GET /api/quiz` - Get all quiz questions
- `GET /api/quiz/:id` - Get specific quiz question by ID
- `POST /api/quiz/:id/answer` - Submit answer to quiz question
- `GET /api/quiz/user/progress` - Get user's quiz progress

### User

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get user dashboard statistics

## Integration with Frontend

This backend is designed to work with the TigerCode frontend. The frontend should be configured to make requests to this backend at the specified port (default: 5001).

Update the frontend's proxy configuration in `vite.config.ts`:

```typescript
export default defineConfig({
  // ...other config
  server: {
    proxy: {
        '/api': 'http://localhost:5001',
    },
  },
})
```

## Authentication Flow

### JWT Authentication

1. User registers or logs in
2. Backend issues a JWT token
3. Frontend stores this token (e.g., in localStorage)
4. Frontend includes this token in the Authorization header for protected routes

### Google OAuth Authentication

1. User clicks "Sign in with Google" button on frontend
2. Frontend redirects to `/api/auth/google`
3. User authenticates with Google
4. Google redirects to `/api/auth/google/callback`
5. Backend creates/updates user and issues JWT token
6. Backend redirects to frontend with token as a URL parameter
7. Frontend stores this token for subsequent requests

## Development

- Use `npm run lint` to check for linting issues
- Use `npm test` to run tests (when implemented)

## License

[MIT](LICENSE)