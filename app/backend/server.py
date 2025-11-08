from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import markdown2

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'ai_chat_portal')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Define Models
class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reactions: List[str] = Field(default_factory=list)  # ['👍', '❤️', etc]
    bookmarked: bool = False

class MessageCreate(BaseModel):
    content: str

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    status: str = "active"  # 'active' or 'ended'
    summary: Optional[str] = None
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    share_token: Optional[str] = None

class ConversationCreate(BaseModel):
    title: str

class ConversationWithMessages(BaseModel):
    conversation: Conversation
    messages: List[Message]

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    relevant_conversations: List[Dict[str, Any]]
    suggestions: List[str] = Field(default_factory=list)

class ReactionRequest(BaseModel):
    reaction: str

class ExportRequest(BaseModel):
    format: str  # 'pdf', 'json', 'markdown'

# Helper function to call LLM using emergentintegrations
async def call_llm(messages: List[Dict[str, str]], conversation_id: str, max_tokens: int = 500) -> str:
    """Call LLM via emergentintegrations with conversation context"""
    try:
        # Initialize LlmChat with conversation-specific session
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=conversation_id,
            system_message="You are a helpful, friendly AI assistant. Provide clear and concise responses."
        ).with_model("openai", "gpt-4o-mini")
        
        # Get the last user message
        last_message = messages[-1] if messages else {"content": ""}
        user_message = UserMessage(text=last_message.get('content', ''))
        
        # Send message and get response
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"Error calling LLM: {str(e)}")
        return f"Error generating response: {str(e)}"

# Generate conversation suggestions
async def generate_suggestions(conversation_history: List[Dict[str, str]]) -> List[str]:
    """Generate contextual conversation suggestions"""
    try:
        if not conversation_history:
            return [
                "Tell me about yourself",
                "What can you help me with?",
                "Explain a complex topic simply"
            ]
        
        # Get last few messages for context
        recent = conversation_history[-3:] if len(conversation_history) >= 3 else conversation_history
        context = "\n".join([f"{m['role']}: {m['content']}" for m in recent])
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"suggestions_{uuid.uuid4()}",
            system_message="Generate 3 brief follow-up questions (max 8 words each) based on the conversation. Return only the questions, one per line."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = UserMessage(text=f"Recent conversation:\n{context}\n\nGenerate 3 relevant follow-up questions:")
        response = await chat.send_message(prompt)
        
        # Parse suggestions
        suggestions = [s.strip() for s in response.split('\n') if s.strip() and not s.strip().startswith('#')]
        return suggestions[:3]
    except Exception as e:
        logging.error(f"Error generating suggestions: {str(e)}")
        return []

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AI Chat Portal API"}

# Conversation endpoints
@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations():
    """Get all conversations with basic info"""
    conversations = await db.conversations.find({}, {"_id": 0}).to_list(1000)
    
    for conv in conversations:
        if isinstance(conv.get('start_time'), str):
            conv['start_time'] = datetime.fromisoformat(conv['start_time'])
        if conv.get('end_time') and isinstance(conv['end_time'], str):
            conv['end_time'] = datetime.fromisoformat(conv['end_time'])
    
    conversations.sort(key=lambda x: x['start_time'], reverse=True)
    return conversations

@api_router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get specific conversation with full message history"""
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if isinstance(conv.get('start_time'), str):
        conv['start_time'] = datetime.fromisoformat(conv['start_time'])
    if conv.get('end_time') and isinstance(conv['end_time'], str):
        conv['end_time'] = datetime.fromisoformat(conv['end_time'])
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id}, 
        {"_id": 0}
    ).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    messages.sort(key=lambda x: x['timestamp'])
    
    # Generate suggestions if active
    suggestions = []
    if conv['status'] == 'active' and messages:
        msg_history = [{"role": m['role'], "content": m['content']} for m in messages]
        suggestions = await generate_suggestions(msg_history)
    
    return {
        "conversation": conv,
        "messages": messages,
        "suggestions": suggestions
    }

@api_router.post("/conversations", response_model=Conversation)
async def create_conversation(input: ConversationCreate):
    """Create new conversation"""
    conv = Conversation(title=input.title)
    doc = conv.model_dump()
    doc['start_time'] = doc['start_time'].isoformat()
    
    await db.conversations.insert_one(doc)
    return conv

@api_router.post("/conversations/{conversation_id}/messages", response_model=Message)
async def send_message(conversation_id: str, input: MessageCreate):
    """Send message and get AI response"""
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conv['status'] != 'active':
        raise HTTPException(status_code=400, detail="Conversation has ended")
    
    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=input.content
    )
    user_doc = user_msg.model_dump()
    user_doc['timestamp'] = user_doc['timestamp'].isoformat()
    await db.messages.insert_one(user_doc)
    
    # Get conversation history for context
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).to_list(1000)
    
    lm_messages = [
        {"role": msg['role'], "content": msg['content']}
        for msg in sorted(messages, key=lambda x: x['timestamp'])
    ]
    
    # Get AI response
    ai_response = await call_llm(lm_messages, conversation_id)
    
    # Save AI message
    ai_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_response
    )
    ai_doc = ai_msg.model_dump()
    ai_doc['timestamp'] = ai_doc['timestamp'].isoformat()
    await db.messages.insert_one(ai_doc)
    
    return ai_msg

@api_router.post("/conversations/{conversation_id}/end", response_model=Conversation)
async def end_conversation(conversation_id: str):
    """End conversation and generate AI summary"""
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conv['status'] == 'ended':
        raise HTTPException(status_code=400, detail="Conversation already ended")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).to_list(1000)
    
    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}"
        for msg in sorted(messages, key=lambda x: x['timestamp'])
    ])
    
    # Generate summary
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summary_{conversation_id}",
            system_message="You summarize conversations concisely, highlighting key points and topics discussed."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = UserMessage(text=f"Summarize this conversation in 2-3 sentences:\n\n{conversation_text}")
        summary = await chat.send_message(prompt)
    except Exception as e:
        summary = f"Error generating summary: {str(e)}"
    
    end_time = datetime.now(timezone.utc)
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {
            "status": "ended",
            "summary": summary,
            "end_time": end_time.isoformat()
        }}
    )
    
    conv['status'] = 'ended'
    conv['summary'] = summary
    conv['end_time'] = end_time
    if isinstance(conv.get('start_time'), str):
        conv['start_time'] = datetime.fromisoformat(conv['start_time'])
    
    return Conversation(**conv)

@api_router.post("/conversations/query", response_model=QueryResponse)
async def query_conversations(input: QueryRequest):
    """Query AI about past conversations"""
    conversations = await db.conversations.find(
        {"status": "ended"},
        {"_id": 0}
    ).to_list(1000)
    
    if not conversations:
        return QueryResponse(
            answer="No past conversations found to analyze.",
            relevant_conversations=[],
            suggestions=[]
        )
    
    context_parts = []
    for i, conv in enumerate(conversations, 1):
        summary = conv.get('summary', 'No summary available')
        context_parts.append(f"Conversation {i} (Title: {conv['title']}):\n{summary}")
    
    context = "\n\n".join(context_parts)
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"query_{uuid.uuid4()}",
            system_message="You analyze past conversations and provide insights based on their summaries."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = UserMessage(text=f"Past conversations:\n\n{context}\n\nUser question: {input.query}\n\nProvide a clear answer:")
        answer = await chat.send_message(prompt)
    except Exception as e:
        answer = f"Error processing query: {str(e)}"
    
    return QueryResponse(
        answer=answer,
        relevant_conversations=conversations[:5],
        suggestions=[]
    )

# Message reactions and bookmarks
@api_router.post("/messages/{message_id}/react")
async def react_to_message(message_id: str, input: ReactionRequest):
    """Add reaction to a message"""
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    reactions = msg.get('reactions', [])
    if input.reaction in reactions:
        reactions.remove(input.reaction)
    else:
        reactions.append(input.reaction)
    
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"reactions": reactions}}
    )
    
    return {"success": True, "reactions": reactions}

@api_router.post("/messages/{message_id}/bookmark")
async def bookmark_message(message_id: str):
    """Toggle bookmark on a message"""
    msg = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    bookmarked = not msg.get('bookmarked', False)
    
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"bookmarked": bookmarked}}
    )
    
    return {"success": True, "bookmarked": bookmarked}

# Conversation sharing
@api_router.post("/conversations/{conversation_id}/share")
async def share_conversation(conversation_id: str):
    """Generate share token for conversation"""
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    share_token = str(uuid.uuid4())
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"share_token": share_token}}
    )
    
    return {"share_token": share_token, "share_url": f"/shared/{share_token}"}

@api_router.get("/shared/{share_token}")
async def get_shared_conversation(share_token: str):
    """Get conversation by share token"""
    conv = await db.conversations.find_one({"share_token": share_token}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Shared conversation not found")
    
    messages = await db.messages.find(
        {"conversation_id": conv['id']},
        {"_id": 0}
    ).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    messages.sort(key=lambda x: x['timestamp'])
    
    if isinstance(conv.get('start_time'), str):
        conv['start_time'] = datetime.fromisoformat(conv['start_time'])
    if conv.get('end_time') and isinstance(conv['end_time'], str):
        conv['end_time'] = datetime.fromisoformat(conv['end_time'])
    
    return {
        "conversation": conv,
        "messages": messages
    }

# Export functionality
@api_router.post("/conversations/{conversation_id}/export")
async def export_conversation(conversation_id: str, input: ExportRequest):
    """Export conversation in requested format"""
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).to_list(1000)
    messages.sort(key=lambda x: x['timestamp'])
    
    if input.format == 'json':
        data = {
            "conversation": conv,
            "messages": messages
        }
        return JSONResponse(content=data)
    
    elif input.format == 'markdown':
        md_content = f"# {conv['title']}\n\n"
        md_content += f"**Started:** {conv['start_time']}\n"
        if conv.get('end_time'):
            md_content += f"**Ended:** {conv['end_time']}\n"
        if conv.get('summary'):
            md_content += f"\n**Summary:** {conv['summary']}\n"
        md_content += "\n---\n\n"
        
        for msg in messages:
            role_icon = "👤" if msg['role'] == 'user' else "🤖"
            md_content += f"### {role_icon} {msg['role'].capitalize()}\n\n"
            md_content += f"{msg['content']}\n\n"
            if msg.get('bookmarked'):
                md_content += "🔖 *Bookmarked*\n\n"
            if msg.get('reactions'):
                md_content += f"Reactions: {' '.join(msg['reactions'])}\n\n"
        
        return JSONResponse(content={"markdown": md_content})
    
    elif input.format == 'pdf':
        pdf_path = f"/tmp/conversation_{conversation_id}.pdf"
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=12
        )
        story.append(Paragraph(conv['title'], title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Summary
        if conv.get('summary'):
            story.append(Paragraph(f"<b>Summary:</b> {conv['summary']}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
        
        # Messages
        for msg in messages:
            role_text = f"<b>{msg['role'].capitalize()}:</b>"
            story.append(Paragraph(role_text, styles['Heading3']))
            story.append(Paragraph(msg['content'], styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        doc.build(story)
        return FileResponse(pdf_path, media_type='application/pdf', filename=f"{conv['title']}.pdf")
    
    else:
        raise HTTPException(status_code=400, detail="Invalid export format")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
