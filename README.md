# Task Management API

A comprehensive RESTful Task Management API with user authentication, real-time notifications, and data analytics endpoints, plus a simple HTML/CSS/JS frontend.

## Features

- **User Authentication**: JWT-based registration and login
- **Task Management**: Full CRUD operations with filtering and sorting
- **Real-time Notifications**: WebSocket integration for live updates
- **Data Analytics**: Task statistics, user activity, and productivity metrics
- **Frontend Interface**: Simple HTML/CSS/JS client
- **Security**: Rate limiting, CORS, and input validation

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Register a new account or login with existing credentials

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Task Management Endpoints

All task endpoints require authentication via Bearer token in Authorization header.

#### GET /api/tasks
Get all tasks for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (pending, in_progress, completed)
- `priority` (optional): Filter by priority (low, medium, high)
- `sort` (optional): Sort field (default: created_at)
- `order` (optional): Sort order (ASC, DESC, default: DESC)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "status": "pending",
    "priority": "high",
    "due_date": "2024-01-15T10:00:00.000Z",
    "user_id": 1,
    "created_at": "2024-01-10T08:00:00.000Z",
    "updated_at": "2024-01-10T08:00:00.000Z"
  }
]
```

#### GET /api/tasks/:id
Get a specific task by ID.

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "priority": "high",
  "due_date": "2024-01-15T10:00:00.000Z"
}
```

#### PUT /api/tasks/:id
Update an existing task.

**Request Body:**
```json
{
  "title": "Updated task title",
  "status": "in_progress",
  "priority": "medium"
}
```

#### DELETE /api/tasks/:id
Delete a task.

### Analytics Endpoints

#### GET /api/analytics/tasks/stats
Get comprehensive task statistics.

**Response:**
```json
{
  "total": 25,
  "pending": 8,
  "in_progress": 5,
  "completed": 12,
  "by_priority": [
    {"priority": "high", "count": 5},
    {"priority": "medium", "count": 15},
    {"priority": "low", "count": 5}
  ],
  "daily_creation": [
    {"date": "2024-01-10", "count": 3},
    {"date": "2024-01-09", "count": 2}
  ]
}
```

#### GET /api/analytics/activity
Get user activity analytics.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 7)

**Response:**
```json
[
  {
    "action": "created",
    "count": 5,
    "date": "2024-01-10"
  },
  {
    "action": "completed",
    "count": 3,
    "date": "2024-01-10"
  }
]
```

#### GET /api/analytics/productivity
Get productivity metrics.

**Response:**
```json
{
  "completion_rate": 75.5,
  "completed_tasks": 15,
  "total_tasks": 20,
  "avg_completion_time_days": 2.5,
  "overdue_tasks": 3
}
```

## Data Models

### User
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Task
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date DATETIME,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Task Analytics
```sql
CREATE TABLE task_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  task_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (task_id) REFERENCES tasks (id)
);
```

## Real-time Features

The application uses WebSocket connections for real-time notifications:

- **Task Created**: Notifies when a new task is created
- **Task Updated**: Notifies when a task is modified
- **Task Deleted**: Notifies when a task is removed

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin requests
- **Helmet**: Security headers for Express
- **Input Validation**: Server-side validation for all inputs

## Sample Requests

### Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Review code changes",
    "description": "Review pull request #123",
    "priority": "high",
    "due_date": "2024-01-15T17:00:00.000Z"
  }'
```

### Get Task Statistics
```bash
curl -X GET http://localhost:3000/api/analytics/tasks/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Task Status
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"status": "completed"}'
```

## Implementation Notes

- **Database**: SQLite for simplicity and portability
- **Authentication**: JWT tokens with configurable secret
- **Real-time**: Socket.IO for WebSocket communication
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Styling**: CSS Grid and Flexbox for responsive design
- **Error Handling**: Comprehensive error responses and logging

## Acceptance Criteria

✅ **Authentication System**
- User registration and login functionality
- JWT token-based authentication
- Secure password hashing

✅ **Task Management**
- Create, read, update, delete tasks
- Task filtering by status and priority
- Task sorting capabilities

✅ **Real-time Notifications**
- WebSocket integration
- Live updates for task operations
- User-specific notification channels

✅ **Data Analytics**
- Task statistics and metrics
- User activity tracking
- Productivity analytics

✅ **Frontend Interface**
- Responsive HTML/CSS design
- JavaScript API integration
- Real-time UI updates

✅ **API Documentation**
- Comprehensive endpoint documentation
- Request/response examples
- Data model specifications

## Development

For development with auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## Environment Variables

Create a `.env` file for production:
```
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```
