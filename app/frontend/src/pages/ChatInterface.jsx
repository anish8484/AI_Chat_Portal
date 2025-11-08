import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Send, StopCircle, Loader2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChatInterface() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    } else {
      createNewConversation();
    }
  }, [conversationId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const createNewConversation = async () => {
    try {
      const title = `Conversation ${new Date().toLocaleString()}`;
      const response = await axios.post(`${API}/conversations`, { title });
      setConversation(response.data);
      setMessages([]);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    } finally {
      setLoadingConversation(false);
    }
  };
  
  const loadConversation = async () => {
    try {
      const response = await axios.get(`${API}/conversations/${conversationId}`);
      setConversation(response.data.conversation);
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
      navigate("/");
    } finally {
      setLoadingConversation(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || !conversation) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API}/conversations/${conversation.id}/messages`,
        { content: userMessage }
      );
      
      // Reload conversation to get both user message and AI response
      await loadConversation();
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Ensure LM Studio is running.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndConversation = async () => {
    if (!conversation || conversation.status === "ended") return;
    
    try {
      await axios.post(`${API}/conversations/${conversation.id}/end`);
      toast.success("Conversation ended and summarized");
      navigate("/");
    } catch (error) {
      console.error("Error ending conversation:", error);
      toast.error("Failed to end conversation");
    }
  };
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loadingConversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col" data-testid="chat-interface">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900" data-testid="conversation-title">
            {conversation?.title}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation?.status === "ended" ? "Conversation Ended" : "Active Conversation"}
          </p>
        </div>
        {conversation?.status === "active" && (
          <Button
            data-testid="end-conversation-btn"
            onClick={handleEndConversation}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            End Conversation
          </Button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6" data-testid="messages-container">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-600">Send a message to begin chatting with AI</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                data-testid={`message-${message.role}`}
                className={`flex gap-4 message-enter ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl px-5 py-3 ${
                    message.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user" ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-4 justify-start" data-testid="loading-indicator">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      {conversation?.status === "active" && (
        <div className="bg-white border-t border-gray-200 p-6">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <Textarea
                data-testid="message-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 min-h-[60px] max-h-[200px] resize-none border-gray-300"
                disabled={loading}
              />
              <Button
                data-testid="send-message-btn"
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white h-[60px] px-8"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
