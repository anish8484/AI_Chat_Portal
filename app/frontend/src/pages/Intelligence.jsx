import React, { useState } from "react";
import axios from "axios";
import { Search, Brain, Loader2, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Intelligence() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/conversations/query`, {
        query: query.trim()
      });
      setResult(response.data);
      toast.success("Query processed");
    } catch (error) {
      console.error("Error querying conversations:", error);
      toast.error("Failed to process query. Ensure LM Studio is running.");
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="h-full overflow-auto" data-testid="intelligence-page">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-10 h-10 text-gray-900" />
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Conversation Intelligence
            </h1>
          </div>
          <p className="text-gray-600">Ask questions about your past conversations and get intelligent insights</p>
        </div>
        
        {/* Query Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <form onSubmit={handleQuery}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What would you like to know?
            </label>
            <Textarea
              data-testid="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What topics have I discussed most? What were the main points from my last conversation?"
              className="min-h-[100px] mb-4 border-gray-300"
              disabled={loading}
            />
            <Button
              data-testid="query-submit-btn"
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white w-full h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search Conversations
                </>
              )}
            </Button>
          </form>
        </div>
        
        {/* Results */}
        {result && (
          <div className="space-y-6" data-testid="query-results">
            {/* AI Answer */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insight</h3>
                  <p className="text-gray-700 whitespace-pre-wrap" data-testid="ai-answer">{result.answer}</p>
                </div>
              </div>
            </div>
            
            {/* Relevant Conversations */}
            {result.relevant_conversations && result.relevant_conversations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Related Conversations ({result.relevant_conversations.length})
                </h3>
                <div className="space-y-3">
                  {result.relevant_conversations.map((conv) => (
                    <div
                      key={conv.id}
                      data-testid={`related-conversation-${conv.id}`}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{conv.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(conv.start_time)}
                        </div>
                      </div>
                      {conv.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">{conv.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Empty State */}
        {!result && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No query yet</h3>
            <p className="text-gray-600">Enter a question above to search through your conversations</p>
          </div>
        )}
      </div>
    </div>
  );
}
