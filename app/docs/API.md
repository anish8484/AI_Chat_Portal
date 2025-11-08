# AI Chat Portal - API Documentation

## Base URL

```
http://localhost:8001/api
```

## Authentication

Currently no authentication required (single-user mode).

## Endpoints

### Root

#### GET /

Health check endpoint

**Response**
```json
{
  "message": "AI Chat Portal API"
}
```

---

## Conversations

### GET /conversations

Retrieve all conversations

**Response: 200 OK**
```json
[
  {
    "id": "uuid-string",
    "title": "My Conversation",
    "status": "active",
    "summary": null,
    "start_time": "2025-01-05T10:30:00Z",
    "end_time": null,
    "share_token": null
  }
]
```

### GET /conversations/{conversation_id}

Get specific conversation with messages and suggestions

**Parameters**
- `conversation_id` (path) - UUID of the conversation

**Response: 200 OK**
```json
{
  "conversation": {
    "id": "uuid",
    "title": "My Conversation",
    "status": "active",
    "start_time": "2025-01-05T10:30:00Z"
  },
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user",
      "content": "Hello!",
      "timestamp": "2025-01-05T10:31:00Z",
      "reactions": [],
      "bookmarked": false
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "timestamp": "2025-01-05T10:31:05Z",
      "reactions": ["👍"],
      "bookmarked": false
    }
  ],
  "suggestions": [
    "Tell me about yourself",
    "What can you help with?",
    "Explain something complex"
  ]
}
```

**Error: 404 Not Found**
```json
{
  "detail": "Conversation not found"
}
```

### POST /conversations

Create a new conversation

**Request Body**
```json
{
  "title": "My New Conversation"
}
```

**Response: 200 OK**
```json
{
  "id": "new-uuid",
  "title": "My New Conversation",
  "status": "active",
  "summary": null,
  "start_time": "2025-01-05T10:30:00Z",
  "end_time": null,
  "share_token": null
}
```

### POST /conversations/{conversation_id}/messages

Send a message and get AI response

**Parameters**
- `conversation_id` (path) - UUID of the conversation

**Request Body**
```json
{
  "content": "What is machine learning?"
}
```

**Response: 200 OK**
```json
{
  "id": "message-uuid",
  "conversation_id": "conv-uuid",
  "role": "assistant",
  "content": "Machine learning is a subset of AI...",
  "timestamp": "2025-01-05T10:32:00Z",
  "reactions": [],
  "bookmarked": false
}
```

**Error: 400 Bad Request**
```json
{
  "detail": "Conversation has ended"
}
```

### POST /conversations/{conversation_id}/end

End conversation and generate summary

**Parameters**
- `conversation_id` (path) - UUID of the conversation

**Response: 200 OK**
```json
{
  "id": "uuid",
  "title": "My Conversation",
  "status": "ended",
  "summary": "Discussion about machine learning basics covering supervised learning, neural networks, and practical applications.",
  "start_time": "2025-01-05T10:30:00Z",
  "end_time": "2025-01-05T10:45:00Z",
  "share_token": null
}
```

---

## Intelligence

### POST /conversations/query

Query AI about past conversations

**Request Body**
```json
{
  "query": "What topics have I discussed most?"
}
```

**Response: 200 OK**
```json
{
  "answer": "Based on your past conversations, you've primarily discussed technical topics including machine learning, web development, and Python programming...",
  "relevant_conversations": [
    {
      "id": "uuid",
      "title": "ML Discussion",
      "summary": "...",
      "start_time": "2025-01-05T10:00:00Z"
    }
  ],
  "suggestions": []
}
```

---

## Messages

### POST /messages/{message_id}/react

Add or remove reaction from message

**Parameters**
- `message_id` (path) - UUID of the message

**Request Body**
```json
{
  "reaction": "👍"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "reactions": ["👍", "❤️"]
}
```

**Error: 404 Not Found**
```json
{
  "detail": "Message not found"
}
```

### POST /messages/{message_id}/bookmark

Toggle bookmark status

**Parameters**
- `message_id` (path) - UUID of the message

**Response: 200 OK**
```json
{
  "success": true,
  "bookmarked": true
}
```

---

## Sharing

### POST /conversations/{conversation_id}/share

Generate shareable link

**Parameters**
- `conversation_id` (path) - UUID of the conversation

**Response: 200 OK**
```json
{
  "share_token": "unique-token-uuid",
  "share_url": "/shared/unique-token-uuid"
}
```

### GET /shared/{share_token}

View shared conversation (read-only)

**Parameters**
- `share_token` (path) - Share token

**Response: 200 OK**
```json
{
  "conversation": { /* conversation object */ },
  "messages": [ /* array of messages */ ]
}
```

---

## Export

### POST /conversations/{conversation_id}/export

Export conversation in specified format

**Parameters**
- `conversation_id` (path) - UUID of the conversation

**Request Body**
```json
{
  "format": "json"  // Options: "json", "markdown", "pdf"
}
```

**Response (JSON format): 200 OK**
```json
{
  "conversation": { /* full conversation object */ },
  "messages": [ /* all messages */ ]
}
```

**Response (Markdown format): 200 OK**
```json
{
  "markdown": "# Conversation Title\n\n### 👤 User\n\nHello..." 
}
```

**Response (PDF format): 200 OK**
- Content-Type: application/pdf
- File download

---

## Error Responses

All endpoints may return these errors:

### 400 Bad Request
```json
{
  "detail": "Invalid input or operation not allowed"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting. For production deployment, consider:
- 100 requests per minute per IP
- 10 conversation creations per hour
- 50 messages per conversation per hour

## Pagination

Currently returns all results. For production:
- Add `?skip=0&limit=50` query parameters
- Include pagination metadata in responses

## Versioning

Current version: v1 (implicit)
Future versions will use `/api/v2/` prefix
