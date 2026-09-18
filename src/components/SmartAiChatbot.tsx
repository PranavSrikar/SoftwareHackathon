import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Sparkles,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  GripHorizontal,
  RotateCcw,
  HelpCircle,
  Copy,
  Check,
  Zap,
  BookOpen,
  ArrowRight,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  'What is SoC?',
  'Explain Priority Score (P1/P2/P3)',
  'How does 5-Port Queueing work?',
  'Guide me through Flat Lookup',
  'What is Grid Limit & Solar Surplus?',
  'How to plug/unplug cable?',
];

export const SmartAiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `👋 Hello! I am **Voltra AI Assistant**, your smart guide for the Voltra EV Charging Command Center.

I can help you:
- **Guide you through the website** (Finding your flat, checking queue status, viewing solar forecasts)
- **Explain terms & definitions** (SoC, Priority Scores, 5-Port Allocation, Grid Capacity)
- **Answer any questions** about EV charging and smart power distribution!

Click one of the quick topics below or ask me anything!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnread(false);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || data.error || 'Sorry, I could not complete your request.';

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Connection Note**: Unable to reach backend API. Here is a quick guide:\n- **SoC**: Battery percentage.\n- **Priority**: Score calculated using battery deficit and departure urgency.\n- **5-Port Queue**: Dynamic rotation guaranteeing <1h wait times.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: `Conversation reset! What terms or website features can I help explain for you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render basic markdown-like bold/list formatting nicely
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Parse bold text **word**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-extrabold text-cyan-300">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc my-0.5 text-slate-200">
            {formattedParts.slice(0)}
          </li>
        );
      }
      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-1 text-slate-200 leading-relaxed'}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* FLOATING POPUP TOGGLE BUTTON (When Chat Window is Closed) */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
        >
          <button
            id="btn-open-ai-chatbot"
            type="button"
            onClick={handleOpen}
            className="relative group p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-extrabold shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-400/60 hover:scale-105 transition-all duration-300 flex items-center gap-2.5 border border-cyan-300/50 cursor-pointer"
            title="Click to open Voltra AI Assistant & Guide (Draggable)"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-slate-950 animate-bounce" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-slate-950 animate-ping" />
              )}
            </div>
            <div className="flex flex-col text-left pr-1">
              <span className="text-xs font-black tracking-wide uppercase leading-tight">
                Voltra AI Assistant
              </span>
              <span className="text-[10px] text-slate-900 font-bold opacity-90 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-900" /> Ask anything or guide
              </span>
            </div>
          </button>
        </motion.div>
      )}

      {/* DRAGGABLE POPUP CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="voltra-ai-chatbot-window"
            drag
            dragMomentum={false}
            dragElastic={0.05}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : isExpanded ? '620px' : '520px',
              width: isExpanded ? '520px' : '380px',
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-950/95 border-2 border-cyan-500/60 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-xs max-w-[95vw] max-h-[85vh] ${
              isMinimized ? 'h-auto' : ''
            }`}
          >
            {/* DRAGGABLE HEADER BAR */}
            <div
              className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-move select-none shrink-0"
              title="Click and drag to move chatbot anywhere on screen"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-inner">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-white text-xs tracking-wide">
                      Voltra AI Assistant
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <GripHorizontal className="w-3 h-3 text-cyan-400 inline" /> Drag header to reposition
                  </p>
                </div>
              </div>

              {/* WINDOW CONTROLS */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset Conversation"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Shrink Window' : 'Expand Window'}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Restore Window' : 'Minimize Window'}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Chatbot"
                  className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CHAT BODY & MESSAGES (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono">
                        {msg.role === 'assistant' ? (
                          <>
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span className="font-bold text-cyan-400">Voltra Guide</span>
                          </>
                        ) : (
                          <span className="font-bold text-slate-400">You</span>
                        )}
                        <span>&bull; {msg.timestamp}</span>
                      </div>

                      <div
                        className={`relative group max-w-[90%] p-3 rounded-2xl shadow-md text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {renderFormattedText(msg.text)}

                        {/* Copy button for assistant messages */}
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white transition-all text-[10px]"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* LOADING TYPING INDICATOR */}
                  {isLoading && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono">
                        <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                        <span className="font-bold text-cyan-400">Voltra Guide</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* QUICK TOPIC CHIPS */}
                <div className="px-3 py-2 bg-slate-950 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-amber-400" /> Topics:
                  </span>
                  {QUICK_SUGGESTIONS.map((topic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(topic)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-cyan-300 font-medium whitespace-nowrap transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                {/* INPUT FORM */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about website, SoC, queueing..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-cyan-400/20 active:scale-95"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
