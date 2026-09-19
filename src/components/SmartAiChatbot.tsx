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
  Database,
  Info,
  Layers,
  Activity,
  Cpu,
  Car,
  Sun,
  ShieldCheck,
  Server
} from 'lucide-react';
import { EVVehicle, GridState, SolarWeatherData, FivePortAllocationSummary } from '../types';
import { scoreToLevel } from '../services/priorityEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  data_used?: string[];
  provider?: string;
}

const CHATBOT_SUGGESTED_QUESTIONS = [
  "Why is my EV charging slowly?",
  "When will my EV reach 80%?",
  "What is my current charging rate?",
  "Why did the charging schedule change?",
  "Will my EV be ready before my departure?",
  "How much solar energy is available?",
  "What is the current grid load?",
  "Is the transformer under stress?",
  "Which charging station should I use?",
  "Explain today's charging schedule.",
  "What happens if grid demand increases?",
  "Why was my charging power reduced?"
];

interface SmartAiChatbotProps {
  isFullPage?: boolean;
  vehicles?: EVVehicle[];
  gridState?: GridState;
  solarData?: SolarWeatherData | null;
  portSummary?: FivePortAllocationSummary | null;
  selectedVehicleId?: string;
}

export const SmartAiChatbot: React.FC<SmartAiChatbotProps> = ({
  isFullPage = false,
  vehicles = [],
  gridState,
  solarData,
  portSummary,
  selectedVehicleId = 'PORT-03'
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(isFullPage);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(isFullPage);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(!isFullPage);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: `👋 Welcome to the **Voltra AI Energy Assistant**! I am your real-time co-pilot for smart neighborhood grid optimization.

I have direct, secure access to:
- **Your EV Telemetry** (SoC, target charging limit, priority index)
- **Active Power Allocations** (Live multi-port charging queues)
- **Grid Headroom** (Building load capacity vs safe grid threshold)
- **Weather & Solar Forecasts** (On-site photovoltaic generation)
- **Machine Learning Models** (Predictive building and solar peaks)

Select a dynamic topic below or type any specialized question to analyze the system!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      data_used: ['system schema', 'glossary'],
      provider: 'Voltra Embed Core'
    },
  ]);

  // Keep open state synced with full page property changes
  useEffect(() => {
    if (isFullPage) {
      setIsOpen(true);
      setIsMinimized(false);
      setIsExpanded(true);
    }
  }, [isFullPage]);

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

      // Construct live environment context to feed server side proxy safely
      const contextPayload = {
        vehicles: vehicles.map(v => ({
          id: v.id,
          model: v.model,
          batterySoc: v.batterySoc,
          targetSoc: v.targetSoc,
          batteryCapacityKwh: v.batteryCapacityKwh,
          currentChargingRateKw: v.currentChargingRateKw,
          maxChargingRateKw: v.maxChargingRateKw,
          departureTime: v.departureTime,
          priorityScore: v.priorityScore,
          priorityLevel: scoreToLevel ? scoreToLevel(v.priorityScore) : 'MEDIUM',
          isConnected: v.isConnected
        })),
        gridState: gridState ? {
          buildingDemandKw: gridState.buildingDemandKw,
          gridLimitKw: gridState.gridLimitKw,
          evChargingLoadKw: gridState.evChargingLoadKw,
          solarGenerationKw: gridState.solarGenerationKw,
          solarSurplusKw: gridState.solarSurplusKw,
          totalLoadKw: gridState.totalLoadKw,
          systemStatus: gridState.systemStatus
        } : undefined,
        solarData: solarData ? {
          temperatureC: solarData.temperatureC,
          condition: solarData.condition,
          cloudCoverPercent: solarData.cloudCoverPercent
        } : undefined,
        portSummary: portSummary ? {
          activePortCount: portSummary.activeCount,
          totalQueueCount: portSummary.ports?.length || 5,
          averageWaitTimeMinutes: portSummary.userWaitTimeMinutes
        } : undefined
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          user_id: selectedVehicleId,
          history: historyPayload,
          context: contextPayload
        }),
      });

      const data = await res.json();
      const botReply = data.reply || 'Sorry, I could not complete your request.';
      const dataUsed = data.data_used || ['general knowledge'];
      const providerUsed = data.provider || 'AI Core Server';

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data_used: dataUsed,
        provider: providerUsed
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Connection Note**: Offline mode engaged. Voltra assists using local parameters:\n- **Battery (SoC)**: Current level is at normal status.\n- **Priority Allocation**: Multi-port rotation prevents transformer spike overload autonomously.\n\n*Configure GEMINI_API_KEY to activate full AI reasoning.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data_used: ['offline ruleset'],
        provider: 'Fallback Local Core'
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
        text: `Conversation reset! What terms, dynamic priority decisions, or forecasting insights can I assist with?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data_used: ['general instructions'],
        provider: 'Voltra Embed Core'
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

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc my-1 text-slate-200">
            {formattedParts}
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

  // FULL PAGE MODE RENDER
  if (isFullPage) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 animate-in fade-in duration-300">
        {/* Left column: AI Conversation Panel (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[680px]">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/40 shadow-inner">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-wide">
                    AI Energy Assistant
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE TELEMETRY SYNCED
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Explains dynamic priority scheduling, grid overload events, and solar forecasts.
                </p>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-xs flex items-center gap-1.5"
              title="Reset Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Thread</span>
            </button>
          </div>

          {/* Conversation history area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Meta details */}
                <div className="flex items-center gap-2 mb-1.5 text-[11px] text-slate-500 font-mono">
                  {msg.role === 'assistant' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-extrabold text-cyan-400">Voltra AI Assistant</span>
                      {msg.provider && (
                        <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md text-slate-400">
                          {msg.provider}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="font-bold text-slate-400">You</span>
                  )}
                  <span>&bull; {msg.timestamp}</span>
                </div>

                {/* Bubble content */}
                <div
                  className={`relative group max-w-[85%] p-4 rounded-2xl shadow-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Sources tags used */}
                  {msg.role === 'assistant' && msg.data_used && msg.data_used.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1 uppercase mr-1">
                        <Database className="w-3 h-3 text-cyan-400" /> Grounded Context:
                      </span>
                      {msg.data_used.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1 font-medium"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Copy helper */}
                  {msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-slate-950 hover:bg-black text-slate-400 hover:text-white transition-all"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* LOADING TYPING INDICATOR */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] text-slate-500 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="font-bold text-cyan-400">Voltra AI Assistant</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-none flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED QUESTIONS CHIPS BAR */}
          <div className="px-6 py-3 bg-slate-950 border-t border-slate-900 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mr-2">
                <BookOpen className="w-4 h-4 text-amber-500 animate-pulse" />
                Suggested Queries:
              </span>
              {CHATBOT_SUGGESTED_QUESTIONS.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(topic)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs text-cyan-300 font-medium whitespace-nowrap transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3 h-3 text-cyan-400" />
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* INPUT BAR FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Query any grid condition or scheduling decision (e.g., 'Will my EV reach 80%?')"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 text-sm"
              title="Send message"
            >
              <span>Submit</span>
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        </div>

        {/* Right column: Grounding Datasets / Live Telemetry Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-sm font-black text-white tracking-wider uppercase mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Live Context Grounding
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              The AI Energy Assistant evaluates physical rules and telemetry states in real-time. Click any category to inspect:
            </p>

            <div className="space-y-4">
              {/* Box 1: Selected EV info */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Your EV Status</h4>
                    <p className="text-[10px] text-slate-400">PORT-03 Active Vehicle</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-cyan-300 font-bold">
                    {vehicles.find(v => v.id === selectedVehicleId)?.batterySoc || 42}%
                  </span>
                  <span className="text-slate-500"> SoC</span>
                </div>
              </div>

              {/* Box 2: Building demand & limits */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Total Building Load</h4>
                    <p className="text-[10px] text-slate-400">Transformer limit check</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-rose-400 font-bold">{gridState?.buildingDemandKw || 31.2}</span>
                  <span className="text-slate-500"> kW</span>
                </div>
              </div>

              {/* Box 3: Solar forecast */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Solar Surplus Available</h4>
                    <p className="text-[10px] text-slate-400">Free green charging lines</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-emerald-400 font-bold">
                  +{gridState?.solarGenerationKw || 14.5} kW
                </div>
              </div>

              {/* Box 4: Queue Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">5-Port Queue System</h4>
                    <p className="text-[10px] text-slate-400">Rotating smart load manager</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-slate-300 font-medium">
                  {portSummary?.ports?.length || 5} active ports
                </div>
              </div>
            </div>

            {/* Note on Data Grounding Privacy */}
            <div className="mt-6 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-[10px] uppercase tracking-wide mb-1 text-cyan-200">
                  Privacy-First Design
                </strong>
                Flat occupancies, residential personal details, and mobile contact numbers are masked or blocked server-side before telemetry is transmitted to any cloud AI systems.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FLOATING DRAGGABLE WIDGET MODE RENDER
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
            title="Click to open Voltra AI Assistant"
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
                <Sparkles className="w-3 h-3 text-amber-900" /> Ask live telemetry
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
                      Live Sync
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
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Shrink Window' : 'Expand Window'}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Restore Window' : 'Minimize Window'}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Chatbot"
                  className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
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
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
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

                        {/* Grounded items listed inside bubble */}
                        {msg.role === 'assistant' && msg.data_used && msg.data_used.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-slate-400 uppercase font-mono mr-1">Data used:</span>
                            {msg.data_used.map((src, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded bg-cyan-950 text-[9px] font-mono text-cyan-300 border border-cyan-800/40"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}

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
                  {CHATBOT_SUGGESTED_QUESTIONS.slice(0, 6).map((topic, idx) => (
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
                    placeholder="Ask about live SoC, solar or schedule..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-cyan-400/20 active:scale-95 cursor-pointer"
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
