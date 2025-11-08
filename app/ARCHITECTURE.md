# AI Chat Portal - Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│                      (React Frontend)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   API Routes │  │  AI Module   │  │  DB Handler  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────┬───────────────────┬────────────────┬──────────────┘
         │                   │                 │
         │                   │                 ▼
         │                   │      ┌──────────────────┐
         │                   │      │    MongoDB       │
         │                   │      │  - conversations │
         │                   │      │  - messages      │
         │                   │      └──────────────────┘
         │                   │
         │                   ▼
         │          ┌──────────────────┐
         │          │    LM Studio     │
         │          │  (Local LLM)     │
         │          │  localhost:1234  │
         │          └──────────────────┘
         │
         ▼
    [Returns JSON]
```

## Component Details

### 1. Frontend Layer (React)

#### Components Structure

```
src/
├── App.js                 # Main app with routing
├── App.css                # Global styles
├── components/
│   ├── Layout.jsx         # Sidebar navigation layout
│   └── ui/                # Shadcn UI components
└── pages/
    ├── Dashboard.jsx      # Conversation list view
    ├── ChatInterface.jsx  # Real-time chat UI
    └── Intelligence.jsx   # Query interface
```

#### Key Responsibilities
- **Dashboard**: Display conversations, search, create new
- **Chat Interface**: Message input/display, conversation management
- **Intelligence**: Query past conversations, display insights
- **Layout**: Navigation sidebar, consistent UI structure

#### State Management
- React hooks (useState, useEffect)
- No global state management (simple app)
- Local component state for UI interactions

#### API Communication
```javascript
const API = `${BACKEND_URL}/api`

// All API calls use axios
axios.get(`${API}/conversations`)
axios.post(`${API}/conversations`, data)
axios.post(`${API}/conversations/{id}/messages`, data)
```

### 2. Backend Layer (FastAPI)

#### API Structure

```python
app/
└── backend/
    └── server.py          # Single file with all endpoints

Endpoints:
- GET  /api/
- GET  /api/conversations
- GET  /api/conversations/{id}
- POST /api/conversations
- POST /api/conversations/{id}/messages
- POST /api/conversations/{id}/end
- POST /api/conversations/query
```

#### Core Modules

**1. API Routes**
- Handle HTTP requests
- Validate input with Pydantic
- Return JSON responses

**2. AI Integration Module**
```python
async def call_lm_studio(messages, max_tokens):
    # Calls LM Studio via HTTP
    # Format: OpenAI-compatible API
    # Returns generated text
```

**3. Database Handler**
- Motor (async MongoDB driver)
- Collections: conversations, messages
- CRUD operations

### 3. Database Layer (MongoDB)

#### Schema Design

**conversations Collection**
```json
{
  "_id": ObjectId,           // MongoDB internal ID
  "id": "uuid-string",       // Application ID
  "title": "string",
  "status": "active|ended",
  "summary": "string|null",
  "start_time": "ISO-datetime",
  "end_time": "ISO-datetime|null"
}
```

**messages Collection**
```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "conversation_id": "uuid-string",  // Foreign key
  "role": "user|assistant",
  "content": "string",
  "timestamp": "ISO-datetime"
}
```

#### Indexing Strategy
```javascript
// Recommended indexes for performance
db.conversations.createIndex({ "id": 1 }, { unique: true })
db.conversations.createIndex({ "start_time": -1 })
db.messages.createIndex({ "conversation_id": 1, "timestamp": 1 })
db.messages.createIndex({ "id": 1 }, { unique: true })
```

### 4. AI Layer (LM Studio)

#### Integration Details

**API Format**: OpenAI-compatible
```python
POST http://localhost:1234/v1/chat/completions

Payload:
{
  "model": "local-model",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 500
}

Response:
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI generated response"
      }
    }
  ]
}
```

#### Use Cases

1. **Real-time Chat**
   - Context: Full conversation history
   - Purpose: Generate contextual responses
   
2. **Conversation Summarization**
   - Context: All messages in conversation
   - Purpose: Extract key points and summary
   
3. **Intelligence Queries**
   - Context: Summaries of past conversations
   - Purpose: Answer meta-questions about history

## Data Flow Diagrams

### 1. Send Message Flow

```
User Types Message
       │
       ▼
[ChatInterface Component]
       │
       ▼
POST /api/conversations/{id}/messages
       │
       ▼
[FastAPI Backend]
       │
       ├─► Save user message to MongoDB
       │
       ├─► Fetch conversation history
       │
       ├─► Format messages for LM Studio
       │
       ▼
POST to LM Studio API
       │
       ▼
[LM Studio Generates Response]
       │
       ▼
[Backend receives AI response]
       │
       ├─► Save assistant message to MongoDB
       │
       ▼
Return AI message to frontend
       │
       ▼
[Display in Chat UI]
```

### 2. End Conversation Flow

```
User Clicks "End Conversation"
       │
       ▼
POST /api/conversations/{id}/end
       │
       ▼
[FastAPI Backend]
       │
       ├─► Fetch all messages
       │
       ├─► Format as conversation text
       │
       ▼
LM Studio: "Summarize this conversation"
       │
       ▼
[AI generates summary]
       │
       ▼
[Backend updates conversation]
       │
       ├─► Set status = "ended"
       ├─► Set summary = AI response
       ├─► Set end_time = now
       │
       ▼
Return updated conversation
       │
       ▼
[Redirect to Dashboard]
```

### 3. Intelligence Query Flow

```
User Enters Query
       │
       ▼
POST /api/conversations/query
       │
       ▼
[FastAPI Backend]
       │
       ├─► Fetch all ended conversations
       │
       ├─► Extract summaries
       │
       ├─► Build context document
       │
       ▼
LM Studio: "Answer based on these summaries"
       │
       ▼
[AI analyzes and responds]
       │
       ▼
Return answer + relevant conversations
       │
       ▼
[Display insights in UI]
```

## Security Considerations

### Current Implementation

1. **No Authentication**: Single-user mode
2. **CORS**: Configured for local development
3. **No Encryption**: Local network assumed
4. **No Rate Limiting**: LM Studio is bottleneck

### Production Recommendations

```python
# Add authentication
from fastapi.security import HTTPBearer

# Add rate limiting
from slowapi import Limiter

# Add input validation
from pydantic import validator, constr

# Add HTTPS
# Configure nginx/reverse proxy
```

## Performance Optimization

### Current Bottlenecks

1. **LM Studio**: Slowest component (model inference)
2. **No Caching**: Every query hits LM Studio
3. **Full History**: Large conversations load all messages

### Optimization Strategies

```python
# 1. Implement caching
from functools import lru_cache

# 2. Pagination for messages
@api_router.get("/conversations/{id}/messages")
async def get_messages(skip: int = 0, limit: int = 50):
    messages = await db.messages.find().skip(skip).limit(limit)
    
# 3. Summary-based context
# Instead of full history, use previous summaries

# 4. Background tasks for summarization
from fastapi import BackgroundTasks
```

## Deployment Architecture

### Current Setup (Development)

```
[Supervisor]
    ├── Backend: uvicorn on 0.0.0.0:8001
    ├── Frontend: React dev server on :3000
    └── MongoDB: localhost:27017

[LM Studio]
    └── Runs separately on localhost:1234
```

### Production Recommendations

```
[Nginx Reverse Proxy]
    ├── / → Frontend (static build)
    ├── /api → Backend:8001
    └── SSL/TLS termination

[Backend]
    ├── Gunicorn + Uvicorn workers
    └── Environment variables from secrets

[MongoDB]
    ├── Replica set for high availability
    └── Regular backups

[LM Studio]
    ├── Dedicated server with GPU
    └── Load balancer if multiple instances
```

## Error Handling Strategy

### Backend

```python
try:
    # LM Studio call
except httpx.ConnectError:
    return "Cannot connect to LM Studio"
except httpx.TimeoutError:
    return "LM Studio request timed out"
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500)
```

### Frontend

```javascript
try {
  await axios.post(...);
  toast.success("Message sent");
} catch (error) {
  if (error.response?.status === 404) {
    toast.error("Conversation not found");
  } else {
    toast.error("Failed to send message");
  }
}
```

## Testing Strategy

### Unit Tests

```python
# Backend
import pytest
from fastapi.testclient import TestClient

def test_create_conversation():
    response = client.post("/api/conversations", json={"title": "Test"})
    assert response.status_code == 200
    assert response.json()["title"] == "Test"
```

### Integration Tests

```javascript
// Frontend
import { render, screen, waitFor } from '@testing-library/react';

test('sends message successfully', async () => {
  render(<ChatInterface />);
  // ... test logic
});
```

## Monitoring and Logging

### Current Logging

```python
import logging

logger = logging.getLogger(__name__)
logger.info("Conversation created")
logger.error("LM Studio connection failed")
```

### Production Monitoring

- **Application Logs**: Structured JSON logging
- **Performance Metrics**: Response times, error rates
- **LM Studio Monitoring**: Model load, inference time
- **Database Metrics**: Query performance, connection pool

## Scalability Considerations

### Vertical Scaling
- Better GPU for LM Studio
- More RAM for model loading
- Faster storage for MongoDB

### Horizontal Scaling
- Multiple LM Studio instances with load balancer
- MongoDB sharding for large datasets
- Redis cache for conversation summaries
- CDN for static frontend assets

---

**Last Updated**: 2025-01-05
**Version**: 1.0.0
