import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  MessageCircle, X, Send, Bot, User, Sparkles, Loader2, 
  PlusCircle, History as HistoryIcon, ChevronLeft, Clock 
} from 'lucide-react';
import { sendMessageToAI, ChatMessage } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AIChatPopupProps {
  userName: string;
  currentPage: string;
  currentLesson?: string;
  courses: any[];
}

const AIChatPopup: React.FC<AIChatPopupProps> = ({ userName, currentPage, currentLesson, courses }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'bot'; text: string; timestamp?: number }[]>([]);
  const [pastSessions, setPastSessions] = useState<{ id: string; date: string; messages: any[] }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Load chat history and education level from Supabase
  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('education_level, ai_chat_history, ai_past_sessions')
          .eq('id', user.id)
          .single();

        if (data) {
          setEducationLevel(data.education_level);
          
          let dbHistory = data.ai_chat_history || [];
          let dbPast = data.ai_past_sessions || [];
          
          // Logic: If it's a fresh visit (not a refresh/navigation in same tab),
          // archive the previous active chat if it's not empty.
          const isFreshVisit = !sessionStorage.getItem(`chat_session_active_${user.id}`);
          
          if (isFreshVisit && dbHistory.length > 0) {
            const archivedSession = {
              id: Date.now().toString(),
              date: new Date().toLocaleString(),
              messages: [...dbHistory]
            };
            dbPast = [archivedSession, ...dbPast];
            dbHistory = [];
            
            // Sync immediately to DB
            await supabase.from('profiles').update({ 
              ai_chat_history: [],
              ai_past_sessions: dbPast 
            }).eq('id', user.id);
          }
          
          // Mark this tab as having an active session now
          sessionStorage.setItem(`chat_session_active_${user.id}`, 'true');

          // Ensure all messages have IDs (retroactive fix)
          const ensureIds = (msgs: any[]) => msgs.map((m, i) => ({
            id: m.id || `msg_${Date.now()}_legacy_${i}`,
            role: m.role,
            text: m.text,
            timestamp: m.timestamp || Date.now()
          }));

          setMessages(ensureIds(dbHistory));
          setPastSessions(dbPast.map((s: any) => ({
            ...s,
            messages: ensureIds(s.messages)
          })));
          
          // Only auto-start chatting if we are in the middle of a session (dbHistory not empty)
          setIsChatStarted(dbHistory.length > 0);
        }
      };
      loadProfile();
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current && !isHistoryView) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isChatStarted, isHistoryView]);

  const startChat = async () => {
    // If there's an existing chat history, archive it before starting fresh
    if (messages.length > 0) {
      await startNewChat();
    }
    
    setIsChatStarted(true);
    setIsHistoryView(false);
    
    const welcomeMsg = !educationLevel 
      ? `Merhaba ${userName}! Ben EduExam AI asistanıyım. Sana daha iyi yardımcı olabilmem için eğitim seviyeni (İlkokul, Ortaokul veya Lise) ve sınıfını söyler misin?`
      : `Tekrar merhaba ${userName}! Bugün sana nasıl yardımcı olabilirim?`;
    
    const initialMessages = [{ 
      id: `msg_${Date.now()}_bot`,
      role: 'bot' as const, 
      text: welcomeMsg,
      timestamp: Date.now()
    }];
    setMessages(initialMessages);
    
    // Save the new session start to DB
    if (user) {
      await supabase.from('profiles').update({ 
        ai_chat_history: initialMessages 
      }).eq('id', user.id);
    }
  };

  const startNewChat = async () => {
    if (messages.length > 0) {
      // Save current chat to history before clearing
      const newSession = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(),
        messages: [...messages]
      };
      const updatedSessions = [newSession, ...pastSessions]; // Removed .slice(0, 10)
      
      setPastSessions(updatedSessions);
      setMessages([]);
      setIsChatStarted(false);
      
      if (user) {
        await supabase.from('profiles').update({ 
          ai_chat_history: [],
          ai_past_sessions: updatedSessions 
        }).eq('id', user.id);
      }
    } else {
      setIsChatStarted(false);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideMsg?: string) => {
    e?.preventDefault();
    const userMsg = overrideMsg || inputText.trim();
    if (!userMsg || isLoading) return;

    if (!isChatStarted) setIsChatStarted(true);
    
    const userMsgObj = { 
      id: `msg_${Date.now()}_user`,
      role: 'user' as const, 
      text: userMsg,
      timestamp: Date.now()
    };
    
    setInputText('');
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    try {
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const context = {
        userName,
        educationLevel: educationLevel || undefined,
        currentPage,
        currentLesson,
        courses
      };

      const aiResponse = await sendMessageToAI(userMsg, history, context);

      // Handle custom actions
      if (aiResponse.action === 'save_education_level' || (aiResponse.message.toLowerCase().includes('saved') && !educationLevel)) {
        const detectedLevel = aiResponse.data?.level || userMsg;
        setEducationLevel(detectedLevel);
        await supabase.from('profiles').update({ education_level: detectedLevel }).eq('id', user.id);
      }

      const botMsgObj = { 
        id: `msg_${Date.now()}_bot`,
        role: 'bot' as const, 
        text: aiResponse.message,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsgObj]);

      // Persist chat history
      const newHistory = [...messages, userMsgObj, botMsgObj];
      await supabase.from('profiles').update({ ai_chat_history: newHistory }).eq('id', user.id);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsgObj = { 
        id: `msg_${Date.now()}_err`,
        role: 'bot' as const, 
        text: 'Sorry, an error occurred. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsgObj]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end touch-none"
    >
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] h-[550px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col shadow-brand-500/10"
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="p-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsHistoryView(!isHistoryView); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`w-10 h-10 ${isHistoryView ? 'bg-white text-brand-600' : 'bg-white/20 text-white'} rounded-xl flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95`}
                  title="History"
                >
                  {isHistoryView ? <ChevronLeft className="w-5 h-5" /> : <HistoryIcon className="w-5 h-5" />}
                </button>
                <div>
                  <h3 className="font-bold text-sm">{isHistoryView ? 'Chat History' : 'EduExam AI'}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[10px] text-white/70 font-medium">{isHistoryView ? `${pastSessions.length} Sessions` : 'Online & Ready'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area / History Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50"
            >
              {isHistoryView ? (
                <div className="space-y-3">
                  {pastSessions.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <Clock className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">No past sessions found.</p>
                      <p className="text-[10px] mt-1">Start a new chat to begin your history.</p>
                    </div>
                  ) : (
                    pastSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setMessages(session.messages);
                          setIsChatStarted(true);
                          setIsHistoryView(false);
                        }}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-brand-500 hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Session</span>
                          <span className="text-[10px] text-slate-400">{session.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                          "{session.messages.find(m => m.role === 'user')?.text || 'Empty message'}"
                        </p>
                      </button>
                    ))
                  )}
                </div>
              ) : !isChatStarted && !educationLevel ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-brand-100 rounded-3xl flex items-center justify-center text-brand-600 animate-pulse">
                      <Bot className="w-10 h-10" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">Hoş geldin {userName}!</h4>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      I'm your AI personal assistant. Let's get started by setting up your profile.
                    </p>
                  </div>
                  <button
                    onClick={startChat}
                    className="w-full py-3.5 bg-brand-600 text-white rounded-2xl font-bold text-xs shadow-xl shadow-brand-500/20 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    Start Chatting
                    <MessageCircle className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <p className="text-[10px] text-slate-400">Usually responds in less than a second.</p>
                </div>
              ) : (
                <>
                  {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
                        <Bot className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Merhaba {userName}!</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          How can I help you with your studies today?
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                        <span className="text-[11px] text-slate-400 font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className={`p-4 bg-white border-t border-slate-100 ${((!isChatStarted && !educationLevel) || isHistoryView) ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="w-11 h-11 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 hover:text-brand-600 transition-all active:scale-95"
                  title="New Chat"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask something..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="absolute right-1.5 top-1.5 w-8 h-8 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-3 uppercase tracking-wider font-bold">
                Powered by Gemini 3.1 Flash
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onPointerDown={(e) => dragControls.start(e)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onTap={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center shadow-brand-500/40 relative group overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="relative"
            >
              <MessageCircle className="w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
};

export default AIChatPopup;
