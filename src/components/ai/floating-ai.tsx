"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User, Maximize2, Minimize2, Loader2, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

/**
 * ENTERPRISE AI COPILOT
 * A floating, contextual AI assistant for the entire platform.
 */

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, actions?: { id: string, label: string, icon: string }[] }[]>([
    { role: 'assistant', content: "Hello! I'm your Fluentive AI Copilot. How can I help you optimize your business workflows today?", actions: [{ id: 'view-dashboard', label: 'AI Dashboard', icon: 'Sparkles' }] }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // API call to the AI streaming endpoint
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage, context: window.location.pathname })
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, actions: data.actions }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error processing your request. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto h-14 w-14 rounded-full bg-gradient-to-tr from-brand to-purple-600 shadow-2xl shadow-brand/40 flex items-center justify-center text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles size={24} />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </motion.button>
        ) : (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto flex flex-col bg-white dark:bg-[#150a24] border border-gray-200 dark:border-brand/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isMinimized ? 'h-14 w-64' : 'h-[500px] w-80 md:w-96'
            }`}
          >
            {/* Header */}
            <div className="p-3 bg-gradient-to-r from-brand/10 to-purple-600/10 border-b border-gray-100 dark:border-brand/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Fluentive AI</h3>
                  <p className="text-[10px] text-brand font-bold uppercase tracking-widest">Enterprise Copilot</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-gray-400 transition"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-gray-400 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {messages.map((msg, i) => (
                    <motion.div
                      initial={{ x: msg.role === 'user' ? 20 : -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          msg.role === 'user' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-brand/10 text-brand'
                        }`}>
                          {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-3 rounded-2xl text-[13px] leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-brand text-white rounded-tr-none shadow-sm' 
                            : 'bg-gray-50 dark:bg-[#0b0614] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5 rounded-tl-none shadow-sm'
                        }`}>
                          {/* Markdown-like bold parsing for strong text */}
                          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>') }} />
                          
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                              {msg.actions.map(action => (
                                <button 
                                  key={action.id}
                                  onClick={() => window.location.href = action.id.includes('dashboard') ? '/ai' : '/ai/advanced'}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1a0b2e] border border-gray-200 dark:border-brand/30 text-[11px] font-bold text-brand hover:bg-brand hover:text-white transition-colors shadow-sm"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                          <Loader2 size={16} className="animate-spin" />
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-[#0b0614] rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0b0614]/50">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask anything..."
                      className="w-full bg-white dark:bg-[#150a24] border border-gray-200 dark:border-brand/20 rounded-xl py-3 pl-4 pr-12 text-[13px] outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none max-h-32"
                      rows={1}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-brand text-white flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400 text-center">
                    Fluentive AI can summarize leads, predict deals, and optimize HR.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
