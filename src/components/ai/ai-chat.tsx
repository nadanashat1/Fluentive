"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useUser } from "@/contexts/user-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI assistant. I can help you with lead insights, sales recommendations, and analytics. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Only show AI Chat for admin users
  if (user?.role !== "admin") {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await apiFetch<{ success: true; data: { response: string; context: any } }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage.content })
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (e) {
      if (e instanceof ApiError) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't process your request right now. Please try again.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white shadow-lg hover:bg-brand/90 transition-all hover:scale-105"
        aria-label="Open AI Chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="rounded-soft border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#ececef] dark:border-[#2a2f3a] bg-brand text-white">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                  message.role === "user" ? "bg-brand text-white" : "bg-brand/20 text-brand"
                }`}
              >
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`max-w-[75%] rounded-soft px-3 py-2 ${
                  message.role === "user"
                    ? "bg-brand text-white"
                    : "bg-[#f7f8fb] dark:bg-[#0f0820] text-[#2f3440] dark:text-gray-200"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-[10px] mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand/20 text-brand">
                <Bot size={16} />
              </div>
              <div className="bg-[#f7f8fb] dark:bg-[#0f0820] rounded-soft px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-0" />
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#ececef] dark:border-[#2a2f3a]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about leads, sales, or analytics..."
              className="flex-1 rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              aria-label="Type your message"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex items-center justify-center w-10 h-10 rounded-soft bg-brand text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
