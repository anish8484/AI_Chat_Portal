import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock, CheckCircle, Search, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);
  
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversations(response.data);
      setFilteredConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewConversation = async () => {
    try {
      const title = `Conversation ${new Date().toLocaleString()}`;
      const response = await axios.post(`${API}/conversations`, { title });
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleShare = async (convId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.post(`${API}/conversations/${convId}/share`);
      const fullUrl = `${window.location.origin}/shared/${response.data.share_token}`;
      setShareUrl(fullUrl);
      setShareDialogOpen(true);
      toast.success("Share link generated!");
    } catch (error) {
      console.error("Error sharing conversation:", error);
      toast.error("Failed to generate share link");
    }
  };
  
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };
  
  const handleExport = async (convId, format, e) => {
    e.stopPropagation();
    try {
      const response = await axios.post(`${API}/conversations/${convId}/export`, { format });
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${convId}.json`;
        a.click();
      } else if (format === 'markdown') {
        const blob = new Blob([response.data.markdown], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${convId}.md`;
        a.click();
      } else if (format === 'pdf') {
        window.open(`${API}/conversations/${convId}/export?format=pdf`, '_blank');
      }
      
      toast.success(`Conversation exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting conversation:", error);
      toast.error("Failed to export conversation");
    }
  };
  
  return (
    <div className="h-full overflow-auto" data-testid="dashboard-page">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Conversations
          </h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Manage and view your AI chat conversations</p>
        </div>
        
        {/* Actions Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              data-testid="search-conversations"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 h-11"
            />
          </div>
          <Button
            data-testid="new-conversation-btn"
            onClick={handleNewConversation}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 h-11"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            New Conversation
          </Button>
        </div>
        
        {/* Conversations Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-500">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-600 mb-6">Start a new conversation to begin chatting with AI</p>
            <Button
              data-testid="empty-state-new-btn"
              onClick={handleNewConversation}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Start Your First Chat
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                data-testid={`conversation-${conv.id}`}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{conv.title}</h3>
                    {conv.summary && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{conv.summary}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(conv.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {conv.status === "ended" ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Ended</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600">Active</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
