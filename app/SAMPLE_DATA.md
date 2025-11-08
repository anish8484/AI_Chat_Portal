# Sample Data for Testing

## Sample Conversations for Demo

You can use these sample conversations to test the AI Chat Portal features:

### Conversation 1: Technical Discussion
**Title**: "Understanding Machine Learning"
**Messages**:
- User: "What is machine learning?"
- AI: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed..."

### Conversation 2: Project Planning
**Title**: "Website Redesign Project"
**Messages**:
- User: "I need help planning a website redesign"
- AI: "Let's break down the website redesign project into key phases..."

### Conversation 3: Code Review
**Title**: "Python Code Optimization"
**Messages**:
- User: "How can I optimize this Python code?"
- AI: "There are several optimization techniques we can apply..."

## Intelligence Query Examples

Once you have conversations, try these queries:

1. "What topics have I discussed most?"
2. "Summarize my last conversation about machine learning"
3. "What were the main action items from my project planning discussion?"
4. "Tell me about technical topics I've explored"
5. "What programming languages have I asked about?"

## Testing LM Studio Integration

### Step 1: Install LM Studio
1. Download from https://lmstudio.ai/
2. Install on your system

### Step 2: Download a Model
Recommended models:
- **Llama 3 8B Instruct** (4.7GB) - Best balance
- **Mistral 7B Instruct** (4.1GB) - Fast and efficient
- **Phi-3 Medium** (7.6GB) - High quality
- **TinyLlama 1.1B** (600MB) - For testing/low resources

### Step 3: Start Local Server
1. Open LM Studio
2. Go to "Local Server" tab
3. Select your downloaded model
4. Click "Start Server"
5. Verify it's running on `http://localhost:1234`

### Step 4: Test with Chat Portal
1. Create a new conversation in the portal
2. Send a message: "Hello, can you help me?"
3. Wait for AI response
4. If you see an error: "Cannot connect to LM Studio", check steps above

## Manual Testing Checklist

### Dashboard Tests
- [ ] Dashboard loads without errors
- [ ] Empty state shows when no conversations exist
- [ ] "New Conversation" button works
- [ ] Search bar filters conversations
- [ ] Clicking a conversation opens chat interface
- [ ] Active conversations show green indicator
- [ ] Ended conversations show summary

### Chat Interface Tests
- [ ] Chat loads with correct conversation title
- [ ] Message input field is available (active conversations)
- [ ] Typing message works
- [ ] Send button is enabled when text exists
- [ ] User message appears immediately after sending
- [ ] AI response appears after processing
- [ ] Timestamps display correctly
- [ ] "End Conversation" button works
- [ ] Ended conversations show no input field
- [ ] Scroll works for long conversations

### Intelligence Tests
- [ ] Intelligence page loads
- [ ] Query input field works
- [ ] Submit button is enabled when text exists
- [ ] AI generates answer based on past conversations
- [ ] Related conversations are shown
- [ ] Clicking related conversation opens it
- [ ] Empty state when no query submitted

### Navigation Tests
- [ ] Sidebar navigation works
- [ ] Active page is highlighted
- [ ] All three pages accessible
- [ ] Browser back/forward works
- [ ] Direct URL access works

### Error Handling Tests
- [ ] LM Studio offline shows appropriate message
- [ ] Invalid conversation ID shows error
- [ ] Network errors handled gracefully
- [ ] Loading states display correctly

## API Testing with curl

### 1. Check API Status
```bash
/api/
```
Expected: `{"message": "AI Chat Portal API"}`

### 2. Create Conversation
```bash
/api/conversations
  -H "Content-Type: application/json" \
  -d '{"title": "Test Conversation"}'
```
Save the returned `id` for next steps.

### 3. List Conversations
```bash
/api/conversations
```

### 4. Get Specific Conversation
```bash
# Replace {id} with actual conversation ID
/api/conversations/{id}
```

### 5. Send Message (Requires LM Studio)
```bash
# Replace {id} with actual conversation ID
/api/conversations/{id}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello AI, how are you?"}'
```

### 6. End Conversation
```bash
# Replace {id} with actual conversation ID
/api/conversations/{id}/end
```

### 7. Query Intelligence
```bash
/api/conversations/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What topics have I discussed?"}'
```

## Expected Behavior Without LM Studio

When LM Studio is not running, the application still works but shows graceful error messages:

### Sending Messages
- User message saves successfully
- AI response: "Cannot connect to LM Studio. Please ensure LM Studio is running and accessible at the configured URL."

### Ending Conversations
- Conversation marked as ended
- Summary: "Cannot connect to LM Studio. Please ensure LM Studio is running..."

### Intelligence Queries
- Query accepted
- Answer: Error message about LM Studio connection

**This is expected behavior** - the application gracefully handles the absence of LM Studio.

## Performance Benchmarks

With LM Studio running locally:

### Response Times
- **Message send**: ~2-5 seconds (depends on model and hardware)
- **Conversation summary**: ~3-7 seconds
- **Intelligence query**: ~4-8 seconds
- **Dashboard load**: <500ms
- **Chat interface load**: <500ms

### Model Performance
| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| TinyLlama 1.1B | 600MB | Very Fast | Basic |
| Mistral 7B | 4.1GB | Fast | Good |
| Llama 3 8B | 4.7GB | Medium | Excellent |
| Phi-3 Medium | 7.6GB | Medium | Excellent |

## MongoDB Queries for Debugging

### Check Database
```bash
mongosh
use ai_chat_portal

# Count conversations
db.conversations.countDocuments()

# View recent conversations
db.conversations.find().sort({start_time: -1}).limit(5)

# Count messages
db.messages.countDocuments()

# View messages for a conversation
db.messages.find({conversation_id: "your-conversation-id"}).sort({timestamp: 1})

# Find ended conversations with summaries
db.conversations.find({status: "ended", summary: {$exists: true}})
```

## Troubleshooting Common Issues

### Issue: "Cannot connect to LM Studio"
**Cause**: LM Studio not running or on different port
**Fix**: 
1. Open LM Studio
2. Load a model
3. Start local server on port 1234
4. Verify in LM Studio UI that server is running

### Issue: Slow responses
**Cause**: Model too large for hardware
**Fix**: Use a smaller model like Mistral 7B or TinyLlama

### Issue: Conversations not loading
**Cause**: MongoDB connection issue
**Fix**: 
```bash
sudo systemctl status mongodb
sudo systemctl restart mongodb
```

### Issue: Frontend blank page
**Cause**: Build or runtime error
**Fix**:
```bash
sudo supervisorctl restart frontend
tail -f /var/log/supervisor/frontend.*.log
```

### Issue: API 404 errors
**Cause**: Backend not running
**Fix**:
```bash
sudo supervisorctl restart backend
tail -f /var/log/supervisor/backend.*.log
```

## Screenshots

The following screenshots show the application in action:

1. **Dashboard**: Shows list of conversations with status
2. **Chat Interface**: Real-time messaging with AI
3. **Intelligence**: Query interface for past conversations

All screenshots available in the test report.
