import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatInterface from "@/pages/ChatInterface";
import Dashboard from "@/pages/Dashboard";
import Intelligence from "@/pages/Intelligence";
import Layout from "@/components/Layout";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat/:conversationId?" element={<ChatInterface />} />
            <Route path="/intelligence" element={<Intelligence />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
