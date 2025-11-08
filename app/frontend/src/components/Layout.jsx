import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, LayoutDashboard, Brain, Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

export default function Layout({ children }) {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className={`flex h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`w-64 border-r flex flex-col ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            AI Chat Portal
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Powered by OpenAI</p>
        </div>
        
        <nav className="flex-1 p-4">
          <Link
            to="/"
            data-testid="nav-dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive("/") && !location.pathname.includes("/chat") && !location.pathname.includes("/intelligence")
                ? darkMode ? "bg-blue-600 text-white" : "bg-gray-900 text-white"
                : darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          
          <Link
            to="/chat"
            data-testid="nav-chat"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive("/chat")
                ? darkMode ? "bg-blue-600 text-white" : "bg-gray-900 text-white"
                : darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </Link>
          
          <Link
            to="/intelligence"
            data-testid="nav-intelligence"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive("/intelligence")
                ? darkMode ? "bg-blue-600 text-white" : "bg-gray-900 text-white"
                : darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Brain className="w-5 h-5" />
            <span className="font-medium">Intelligence</span>
          </Link>
        </nav>
        
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <Button
            data-testid="theme-toggle"
            onClick={toggleDarkMode}
            variant="outline"
            className={`w-full flex items-center justify-center gap-2 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>
          
          <div className={`mt-4 rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>API Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Connected</span>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className={`flex-1 overflow-hidden ${darkMode ? 'bg-gray-950' : ''}`}>
        {children}
      </main>
    </div>
  );
}
