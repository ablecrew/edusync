import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Paperclip,
  Mic,
  Volume2,
  Trash2,
  X,
  Sparkles,
  MessageSquare,
  Zap,
} from 'lucide-react';
import {
  useStudents,
  useTeachers,
  useInvoices,
  useClasses,
  useSubjects,
  useAIConversations,
} from '../../hooks/useQueries';
import { aiService } from '../../services/db';
import { callRealAIAPI } from '../../services/aiGateway';
import { AIConversation } from '../../types';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export const FloatingAICheckoutDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // Query live institutional database metrics
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: invoices = [] } = useInvoices();
  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: conversations = [], refetch } = useAIConversations();

  const [activeConvId, setActiveConvId] = useState<string>('conv-free-01');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find((c) => c.id === activeConvId) || {
    id: '',
    title: '',
    messages: [
      {
        id: 'msg_init',
        role: 'assistant' as const,
        content: "👋 Hello! I am EduSync AI. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, currentConv.messages, isStreaming]);

  // Real-time Text-to-Speech synthesis
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/#/g, '').replace(/\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 250));
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Real-time Speech-to-Text listening
  const startVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputMessage((prev) => `${prev} ${transcript}`.trim());
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert('Real-time voice recognition is not supported in this browser environment.');
    }
  };

  const handleCreateNewChat = async () => {
    const newConv: AIConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Global Curriculum Inquiry',
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I am connected to the real AI API. Ask me anything about CBC rubric descriptors, STEM lesson plans, global facts, or your active student enrollment.',
          timestamp: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    };
    await aiService.saveConversation(newConv);
    await refetch();
    setActiveConvId(newConv.id);
  };

  // Build dynamic real-time database context prompt
  const liveSystemPrompt = useMemo(() => {
    const totalTuition = invoices.reduce((acc, i) => acc + i.amount, 0);
    const totalCollected = invoices.reduce((acc, i) => acc + i.paid_amount, 0);
    const activeStudents = students.filter((s) => s.status === 'Active').length;

    return `You are EduSync AI, an enterprise School Management & CBC (Competency Based Curriculum) Autonomous AI Assistant.
Live Institutional Database Context:
- Total Enrolled Students: ${students.length} (${activeStudents} active learners)
- Active Faculty & Teachers: ${teachers.length} teachers
- Academic Classes: ${classes.length} classes (${classes.map((c) => c.name).join(', ') || 'Standard grades'})
- Curriculum Subjects: ${subjects.length} CBC subjects (${subjects.map((s) => s.name).join(', ') || 'Mathematics, Science, Languages'})
- Bursar Financial Ledger: Total Invoiced Tuition is $${totalTuition.toLocaleString()} USD. Total Collected is $${totalCollected.toLocaleString()} USD.

Instructions:
1. Answer the user's question accurately, professionally, and clearly using clean Markdown formatting (bullet points, bold text, headers).
2. If asked about CBC competencies, explain the 4 levels (Exceeding, Meeting, Approaching, Below).
3. If asked to draft a lesson plan or exam question paper, provide structured, high-quality educational content.
4. If asked about database counts or financials, reference the exact Live Institutional Database Context above.`;
  }, [students, teachers, invoices, classes, subjects]);

  const handleSendMessage = async (promptOverride?: string) => {
    const query = promptOverride || inputMessage;
    if (!query && !attachedFile) return;

    const userContent = attachedFile ? `[Uploaded Attachment: ${attachedFile}]\n\n${query}` : query;

    const userMsg = {
      id: `m_user_${Date.now()}`,
      role: 'user' as const,
      content: userContent,
      timestamp: new Date().toISOString(),
    };

    const historyPayload = currentConv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const updatedConv: AIConversation = {
      ...currentConv,
      title: currentConv.messages.length <= 1 ? query.substring(0, 25) + '...' : currentConv.title,
      messages: [...currentConv.messages, userMsg],
    };

    setInputMessage('');
    setAttachedFile(null);
    setIsStreaming(true);

    // Call Real AI LLM API
    const realAPIAnswer = await callRealAIAPI(liveSystemPrompt, historyPayload, userContent);

    const assistantMsg = {
      id: `m_ai_${Date.now()}`,
      role: 'assistant' as const,
      content: realAPIAnswer,
      timestamp: new Date().toISOString(),
    };

    const finalized: AIConversation = {
      ...updatedConv,
      messages: [...updatedConv.messages, assistantMsg],
    };

    await aiService.saveConversation(finalized);
    await refetch();
    setIsStreaming(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
    }
  };

  const PROMPT_SUGGESTIONS = [
    { label: '📊 Query Student Count', prompt: 'How many enrolled students do we have in our live database?' },
    { label: '💰 Check Fee Revenue', prompt: 'Reconcile total invoiced tuition vs collected fee revenue.' },
    { label: '🎓 CBC Grading Rubrics', prompt: 'Explain the 4 global CBC evaluation rubric benchmarks.' },
    { label: '📝 Generate Lesson Plan', prompt: 'Generate a Grade 10 Science lesson plan with classroom inquiry activities.' },
  ];

  return (
    <>
      {/* FLOATING BOTTOM-LEFT RING TRIGGER WITH GOLD-NAVY BLUE GRADIENT */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 font-sans">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative p-1 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#eab308] to-[#08428C] shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
          title=""
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-950 text-white group-hover:bg-[#08428C] transition-colors">
            <Bot className="w-7 h-7 text-amber-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </button>

        {!isOpen && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border border-amber-500/30 text-xs animate-fade-in pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200"></span>
          </div>
        )}
      </div>

      {/* SIDE COMMUNICATION PANEL / SLIDE-OVER DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-screen sm:w-[440px] md:w-[480px] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-slide-in-left z-10">

              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-[#08428C] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-[#08428C] p-[2px] flex items-center justify-center shadow-lg shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base tracking-tight">EduSync AI</h3>
                      <Badge variant="warning" size="sm" className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider"></Badge>
                    </div>
                    <p className="text-[11px] text-blue-200 truncate">Global & Curriculum Real-Time API Engine</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => alert("🎉 You can upgrade to the Subscribed Plan anytime in Settings for unlimited predictive risk models & custom integrations!")}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 text-[10px] font-bold transition-colors border border-white/10 cursor-pointer"
                    title="View Paid Subscription Benefits"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Upgrade</span>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat History / Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold truncate">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">Real AI API Active • Querying live Supabase data</span>
                  </div>
                  <button
                    onClick={() => alert("Subscription portal will launch here.")}
                    className="text-[10px] font-bold text-[#08428C] dark:text-blue-400 underline shrink-0 ml-2"
                  >
                    Upgrade Later
                  </button>
                </div>

                {/* Conversation Messages */}
                {currentConv.messages.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                        msg.role === 'user' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'bg-gradient-to-br from-amber-400 to-[#08428C] text-white'
                      }`}
                    >
                      {msg.role === 'user' ? 'You' : <Bot className="w-4 h-4 text-white" />}
                    </div>

                    <div
                      className={`flex-1 rounded-2xl p-4 shadow-sm text-xs sm:text-sm ${
                        msg.role === 'user'
                          ? 'bg-[#08428C] text-white rounded-tr-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs space-y-3 font-sans'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>

                      {msg.role === 'assistant' && (
                        <div className="pt-1.5 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => speakResponse(msg.content)}
                            className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#08428C] dark:hover:text-blue-400 font-semibold cursor-pointer"
                            title="Listen via Text-to-Speech"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Speak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator during real API call */}
                {isStreaming && (
                  <div className="flex items-start gap-3 max-w-[90%] animate-fade-in">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-[#08428C] text-white flex items-center justify-center shrink-0 animate-spin">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-xs p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                        <span>Calling Real LLM API...</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#08428C] animate-ping" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Drawer Bottom Controls */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* Prompt suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {PROMPT_SUGGESTIONS.map((ps, idx) => (
                    <button
                      key={idx}
                      disabled={isStreaming}
                      onClick={() => handleSendMessage(ps.prompt)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#e8f1fc] dark:hover:bg-blue-950 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#08428C] transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-700/60 cursor-pointer shrink-0"
                    >
                      {ps.label}
                    </button>
                  ))}
                </div>

                {attachedFile && (
                  <div className="p-2 rounded-xl bg-[#e8f1fc] dark:bg-blue-950 text-[#08428C] dark:text-blue-300 text-xs font-semibold flex items-center justify-between">
                    <span>📎 File Attached: {attachedFile}</span>
                    <button onClick={() => setAttachedFile(null)}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {/* Input Controls */}
                <div className="relative flex items-center gap-1">
                  <label className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors" title="Attach Document / Image (.PDF, .CSV, .JPG, .PNG)">
                    <Paperclip className="w-4 h-4" />
                    <input type="file" accept=".pdf,.csv,.txt,.png,.jpg" onChange={handleFileChange} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={startVoiceCommand}
                    className={`p-2.5 transition-colors cursor-pointer ${isListening ? 'text-rose-500 animate-pulse font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Real-Time Voice Command Input (Speech-to-Text)"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    placeholder="Ask me about CBC rubrics, lesson plans, DB count... (Enter)"
                    value={inputMessage}
                    disabled={isStreaming}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 py-2.5 px-3.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08428C]/40 placeholder-slate-400"
                  />

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSendMessage()}
                    disabled={(!inputMessage && !attachedFile) || isStreaming}
                    className="px-3.5 py-2.5 rounded-xl shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <button onClick={handleCreateNewChat} className="hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer">
                    <MessageSquare className="w-3 h-3" /> New Chat
                  </button>
                  <span>Your Intelligent partner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
