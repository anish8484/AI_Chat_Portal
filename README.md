# AI Chat Portal

A full-stack AI chat application with conversation intelligence, powered by LM Studio for local LLM inference.

## Features

### Core Functionality
- **Real-time Chat Interface**: Seamless conversation with AI using LM Studio
- **Conversation Storage**: All messages stored with timestamps in MongoDB
- **Conversation Management**: Create, view, and end conversations
- **AI Summarization**: Automatic summary generation when conversations end
- **Intelligent Query System**: Ask questions about past conversations
- **Conversation Dashboard**: View and search all past conversations

### Key Capabilities
- Single-user mode (no authentication required)
- Professional neutral UI design
- Real-time message streaming
- Conversation context maintenance
- Semantic conversation analysis
- Clean, modern interface

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **AI Integration**: LM Studio (local LLM)
- **HTTP Client**: httpx for LM Studio API calls

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Notifications**: Sonner

## Project Structure

```
/app/
├── backend/
│   ├── server.py              # FastAPI application with all endpoints
│   ├── .env                   # Environment variables
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application component
│   │   ├── App.css           # Global styles
│   │   ├── components/
│   │   │   ├── Layout.jsx    # App layout with sidebar
│   │   │   └── ui/           # Shadcn UI components
│   │   └── pages/
│   │       ├── Dashboard.jsx      # Conversations list
│   │       ├── ChatInterface.jsx  # Real-time chat
│   │       └── Intelligence.jsx   # Query interface
│   ├── package.json          # Node.js dependencies
│   └── .env                  # Frontend environment variables
└── README.md                 # This file
```

## Database Schema

### Collections

#### conversations
```json
{
  "id": "uuid",
  "title": "string",
  "status": "active | ended",
  "summary": "string | null",
  "start_time": "ISO datetime",
  "end_time": "ISO datetime | null"
}
```

#### messages
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "role": "user | assistant",
  "content": "string",
  "timestamp": "ISO datetime"
}
```

## API Documentation

### Base URL
```
http://localhost:8001/api
```

### Endpoints

#### GET /conversations
Retrieve all conversations with basic info

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "string",
    "status": "active | ended",
    "summary": "string | null",
    "start_time": "datetime",
    "end_time": "datetime | null"
  }
]
```

#### GET /conversations/{id}
Get specific conversation with full message history

**Response**: `200 OK`
```json
{
  "conversation": { /* conversation object */ },
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "user | assistant",
      "content": "string",
      "timestamp": "datetime"
    }
  ]
}
```

#### POST /conversations
Create new conversation

**Request Body**:
```json
{
  "title": "string"
}
```

**Response**: `200 OK` - Returns created conversation object

#### POST /conversations/{id}/messages
Send message and get AI response

**Request Body**:
```json
{
  "content": "string"
}
```

**Response**: `200 OK` - Returns AI message object

#### POST /conversations/{id}/end
End conversation and generate AI summary

**Response**: `200 OK` - Returns updated conversation with summary

#### POST /conversations/query
Query AI about past conversations

**Request Body**:
```json
{
  "query": "string"
}
```

**Response**: `200 OK`
```json
{
  "answer": "string",
  "relevant_conversations": [ /* array of conversation objects */ ]
}
```

## Setup Instructions

### Prerequisites

1. **LM Studio Setup**
   - Download LM Studio from [https://lmstudio.ai/](https://lmstudio.ai/)
   - Download a model (recommended: Llama 3 8B, Mistral 7B, or similar)
   - Start the local server in LM Studio
   - Default URL: `http://localhost:1234/v1`
   - Ensure the server is running before using the chat portal

2. **System Requirements**
   - Python 3.11+
   - Node.js 18+
   - MongoDB running on localhost:27017

### Backend Setup

```bash
cd /app/backend

# Install dependencies
pip install -r requirements.txt

# Environment variables are already configured in .env:
# MONGO_URL="mongodb://localhost:27017"
# DB_NAME="ai_chat_portal"
# LM_STUDIO_URL="http://localhost:1234/v1"

# Backend runs automatically via supervisor
sudo supervisorctl restart backend
```

### Frontend Setup

```bash
cd /app/frontend

# Install dependencies
yarn install

# Frontend runs automatically via supervisor
sudo supervisorctl restart frontend
```

### Access the Application

- Frontend: `http://localhost:3000` or your deployed URL
- Backend API: `http://localhost:8001/api`

## Usage Guide

### Starting a Conversation

1. Navigate to the Dashboard
2. Click "New Conversation" or "Start Your First Chat"
3. You'll be redirected to the chat interface
4. Type your message and press Enter or click Send
5. Wait for AI response (powered by LM Studio)

### Ending a Conversation

1. In an active chat, click "End Conversation" button
2. The system will automatically generate a summary using AI
3. You'll be redirected to the dashboard
4. The conversation will be marked as "Ended"

### Querying Past Conversations

1. Navigate to "Intelligence" page
2. Enter your question (e.g., "What topics have I discussed?")
3. Click "Search Conversations"
4. View AI-generated insights and related conversations

### Searching Conversations

1. On the Dashboard, use the search bar
2. Filter conversations by title
3. Click any conversation to view its details

## LM Studio Configuration

### Recommended Models

- **Llama 3 8B Instruct**: Balanced performance and quality
- **Mistral 7B Instruct**: Fast and efficient
- **Phi-3 Medium**: Good for constrained resources

### Server Configuration

1. Open LM Studio
2. Go to "Local Server" tab
3. Load your chosen model
4. Start the server (default port: 1234)
5. Ensure "CORS enabled" for web access

### Troubleshooting LM Studio

**Issue**: "Cannot connect to LM Studio"
- **Solution**: Ensure LM Studio server is running on port 1234
- Check if a model is loaded in LM Studio
- Verify `LM_STUDIO_URL` in `/app/backend/.env`

**Issue**: Slow responses
- **Solution**: Use a smaller model or enable GPU acceleration in LM Studio

**Issue**: Error responses
- **Solution**: Check LM Studio logs for model loading errors

## Testing

### Manual Testing

1. **Create Conversation**: Click "New Conversation" on dashboard
2. **Send Message**: Type "Hello" and send
3. **Verify AI Response**: Check that AI responds
4. **End Conversation**: Click "End Conversation" and verify summary
5. **Query Intelligence**: Go to Intelligence page, ask "What did I discuss?"
6. **Search**: Use dashboard search to filter conversations

### API Testing with curl

```bash
# Get all conversations

# Create new conversation


# Send message (replace {id} with conversation ID)

```

## Architecture

### System Flow

```
User → React Frontend → FastAPI Backend → MongoDB
                              ↓
                         LM Studio (Local)
```

### Conversation Flow

1. User creates conversation → Stored in MongoDB
2. User sends message → Saved as 'user' message
3. Backend retrieves conversation history
4. Backend sends context to LM Studio
5. LM Studio generates response
6. AI response saved as 'assistant' message
7. Both messages returned to frontend

### Intelligence Query Flow

1. User enters query
2. Backend retrieves all ended conversations
3. Conversation summaries compiled as context
4. Context + query sent to LM Studio
5. AI analyzes and generates answer
6. Answer returned with relevant conversations

## Design Choices

### Why LM Studio?
- **Privacy**: All data stays local
- **Cost**: No API fees
- **Flexibility**: Use any compatible model
- **Speed**: Direct local inference

### Why MongoDB?
- Flexible schema for conversations and messages
- Fast document retrieval
- Natural fit for nested conversation data

### Why FastAPI?
- Modern async Python framework
- Automatic API documentation
- Type safety with Pydantic
- Excellent performance

## Known Limitations

1. **LM Studio Required**: Application won't work without LM Studio running
2. **Single User**: No authentication or multi-user support
3. **Local Only**: LM Studio must be on same machine or network
4. **No Streaming**: Responses come as complete messages, not streamed
5. **Basic Search**: Search only filters by title, not content

## Future Enhancements

- [ ] Streaming responses
- [ ] Voice input/output
- [ ] Conversation export (PDF, JSON, Markdown)
- [ ] Advanced semantic search across message content
- [ ] Conversation analytics dashboard
- [ ] Message reactions and bookmarking
- [ ] Dark mode toggle
- [ ] Multi-user support with authentication
- [ ] Conversation sharing with unique links
- [ ] Conversation branching/threading

## Troubleshooting

### Backend Issues

**Issue**: Backend won't start
```bash
# Check logs
tail -n 100 /var/log/supervisor/backend.*.log

# Restart backend
sudo supervisorctl restart backend
```

**Issue**: MongoDB connection errors
```bash
# Verify MongoDB is running
sudo systemctl status mongodb

# Check connection string in .env
cat /app/backend/.env
```

### Frontend Issues

**Issue**: Frontend shows blank page
```bash
# Check logs
tail -n 100 /var/log/supervisor/frontend.*.log

# Restart frontend
sudo supervisorctl restart frontend
```

**Issue**: API calls failing
- Verify `REACT_APP_BACKEND_URL` in `/app/frontend/.env`
- Check browser console for CORS errors

## License

MIT License - Feel free to use for educational purposes

## Contact

For issues or questions, please refer to the project documentation.

---

**Built with ❤️ using FastAPI, React, MongoDB, and LM Studio**
