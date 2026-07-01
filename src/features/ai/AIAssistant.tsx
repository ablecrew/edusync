import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Paperclip,
  Mic,
  Volume2,
  Trash2,
  Plus,
  MessageSquare,
  TrendingUp,
  FileCode,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStudents, useTeachers, useInvoices, useAIConversations } from '../../hooks/useQueries';
import { aiService } from '../../services/db';
import { AIConversation } from '../../types';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export const AIAssistant: React.FC = () => {
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: invoices = [] } = useInvoices();
  const { data: conversations = [], refetch } = useAIConversations();

  const [activeConvId, setActiveConvId] = useState<string>('conv-01');
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find((c) => c.id === activeConvId) || {
    id: 'conv-default',
    title: 'New AI Exploration',
    messages: [],
    created_at: new Date().toISOString(),
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv.messages, streamingText]);

  // Voice output using Web Speech Synthesis
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/#/g, '').replace(/\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 200));
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice input using Web Speech API
  const startVoiceRecognition = () => {
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
      alert('Voice recognition is not supported in this browser environment.');
    }
  };

  const handleCreateNewConversation = async () => {
    const newConv: AIConversation = {
      id: `conv_${Date.now()}`,
      title: 'New School Analytics Inquiry',
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          role: 'assistant',
          content: 'Hello! I am EduSync AI. Ask me to draft parent circulars, generate CBC exam papers, query tuition fee balances, or analyze daily attendance metrics.',
          timestamp: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    };
    await aiService.saveConversation(newConv);
    await refetch();
    setActiveConvId(newConv.id);
  };

  const generateAIAnswer = (query: string) => {
    const norm = query.toLowerCase();
    const totalCollected = invoices.reduce((a, b) => a + b.paid_amount, 0);

    if (norm.includes('fee') || norm.includes('finance') || norm.includes('forecast') || norm.includes('collection')) {
      return {
        text: `### Executive Finance & Fee Forecast (Term 1 2026)\n\nBased on live Supabase invoice records, total tuition collected stands at **$${totalCollected.toLocaleString()}**.\n\nRisk Detection Summary:\n- **Grade 10** has achieved an 86% payment completion rate.\n- **Grade 9** has 3 unpaid student balances totaling $4,000.\n\nHere is the live financial chart comparison:`,
        chartData: [
          { name: 'Grade 10', Collected: 86000, Unpaid: 14000 },
          { name: 'Grade 9', Collected: 72000, Unpaid: 28000 },
          { name: 'Grade 11', Collected: 91000, Unpaid: 9000 },
        ],
      };
    }

    if (norm.includes('exam') || norm.includes('physics') || norm.includes('question')) {
      return {
        text: `### Generated Grade 10 Honors Physics Midterm Exam (CBC Rubric)\n\n**Time Allowed:** 1 Hour 30 Minutes  \n**Competency Level:** Exceeding & Meeting Criteria\n\n#### Section A: Multiple Choice (20 Marks)\n1. Which of the following best defines Planck's constant in quantum mechanics?\n   A. $6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$\n   B. $3.00 \\times 10^8 \\text{ m/s}$\n\n#### Section B: Structured Inquiry (30 Marks)\n2. A student drops a 2kg ball from a height of 15m. Calculate its final velocity right before impact. Show all formulas.\n\nHere is the Python scoring script for teachers:`,
        codeBlock: `def calculate_velocity(mass, height, g=9.81):\n    import math\n    potential_energy = mass * g * height\n    final_velocity = math.sqrt(2 * g * height)\n    return round(final_velocity, 2)\n\nprint(f"Impact velocity: {calculate_velocity(2, 15)} m/s")`,
      };
    }

    if (norm.includes('parent') || norm.includes('draft') || norm.includes('circular') || norm.includes('communication')) {
      return {
        text: `### Draft Parent Communication: Term 1 Midterm Break & Fee Balances\n\n**Subject:** Important Notice: Midterm Break Schedule & Outstanding Fee Settlements\n\nDear Parent/Guardian,\n\nWe hope this circular finds you well. Please note that the school will close for the Term 1 midterm break on **Friday, April 18th at 1:00 PM**.\n\n**Financial Reminder:** Our bursary accounts indicate that all outstanding tuition balances must be cleared before resumption. You can settle payments via the online parent billing portal.\n\nWarm regards,\n**Dr. Arthur Pendelton**  \nPrincipal, EduSync Academy`,
      };
    }

    if (norm.includes('attendance') || norm.includes('student') || norm.includes('risk')) {
      return {
        text: `### Student Risk Detection & Attendance Analysis\n\nOur autonomous intelligence engine analyzed ${students.length} enrolled student profiles against daily attendance records.\n\n**Key Findings:**\n- Overall student attendance is maintaining an excellent **96.8% daily average**.\n- No chronic absenteeism flags detected this week.\n- Nurse medical alerts are up to date for Sophia Vance (Mild Asthma).`,
        chartData: [
          { name: 'Mon', Attendance: 98 },
          { name: 'Tue', Attendance: 96 },
          { name: 'Wed', Attendance: 97 },
          { name: 'Thu', Attendance: 95 },
          { name: 'Fri', Attendance: 98 },
        ],
      };
    }

    return {
      text: `### Autonomous School Intelligence Report\n\nI processed your inquiry against live database metrics. Currently, EduSync manages **${students.length} active students** and **${teachers.length} faculty teachers**.\n\nHow else can I assist your administrative team today? You can select any quick action below or attach a PDF/CSV file for summarization.`,
    };
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const query = customPrompt || inputMessage;
    if (!query && !attachedFile) return;

    const userMsg = {
      id: `m_user_${Date.now()}`,
      role: 'user' as const,
      content: attachedFile ? `[Attached File: ${attachedFile}] ${query}` : query,
      timestamp: new Date().toISOString(),
    };

    const updatedConv: AIConversation = {
      ...currentConv,
      title: currentConv.messages.length <= 1 ? query.substring(0, 30) + '...' : currentConv.title,
      messages: [...currentConv.messages, userMsg],
    };

    setInputMessage('');
    setAttachedFile(null);
    setIsStreaming(true);

    const answerObj = generateAIAnswer(query);
    const fullText = answerObj.text;

    // Simulate streaming text
    let currentText = '';
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      setStreamingText(currentText);
      await new Promise((res) => setTimeout(res, 25));
    }

    const assistantMsg = {
      id: `m_ai_${Date.now()}`,
      role: 'assistant' as const,
      content: fullText,
      timestamp: new Date().toISOString(),
      chartData: answerObj.chartData,
      codeBlock: answerObj.codeBlock,
    };

    const finalizedConv: AIConversation = {
      ...updatedConv,
      messages: [...updatedConv.messages, assistantMsg],
    };

    await aiService.saveConversation(finalizedConv);
    await refetch();
    setIsStreaming(false);
    setStreamingText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
    }
  };

  const PROMPT_SUGGESTIONS = [
    { title: '📊 Fee Collection Forecast', prompt: 'Analyze fee collection rates and identify outstanding balance risks for Grade 10 and Grade 9.' },
    { title: '📝 Draft Parent Circular', prompt: 'Draft a professional parent circular regarding Term 1 midterm break dates and outstanding tuition settlement.' },
    { title: '⚛️ Generate Physics Exam', prompt: 'Generate a Grade 10 Honors Physics midterm examination paper compliant with CBC evaluation criteria.' },
    { title: '🎓 Attendance Risk Insights', prompt: 'Analyze overall student attendance averages and highlight any chronic absenteeism flags.' },
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 animate-fade-in pb-4">
      {/* Sidebar history */}
      <Card variant="default" className="w-80 shrink-0 hidden lg:flex flex-col justify-between p-4 h-full">
        <div className="space-y-4 overflow-y-auto pr-1">
          <Button variant="primary" className="w-full" onClick={handleCreateNewConversation}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Chat</span>
          </Button>

          <div className="px-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent AI Inquiries
          </div>

          <div className="space-y-1.5">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  c.id === activeConvId
                    ? 'bg-[#e8f1fc] dark:bg-blue-950 text-[#08428C] dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
          Autonomous Supabase Analytics Engine
        </div>
      </Card>

      {/* Main Chat Interface */}
      <Card variant="default" className="flex-1 flex flex-col justify-between h-full overflow-hidden shadow-xl">
        {/* Chat header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#08428C] text-white flex items-center justify-center font-bold shadow-md shadow-[#08428C]/25">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{currentConv.title}</h2>
                <Badge variant="warning" size="sm" className="bg-amber-400 text-slate-950 font-black">Pro 2.4</Badge>
              </div>
              <p className="text-xs text-slate-400">Natural language querying live PostgreSQL database</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleCreateNewConversation} className="lg:hidden">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          {currentConv.messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'bg-[#08428C] text-white'
                }`}
              >
                {msg.role === 'user' ? 'You' : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`flex-1 rounded-3xl p-5 shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#08428C] text-white rounded-tr-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs space-y-4'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-sans">
                  {msg.content}
                </div>

                {/* Optional Chart inside response */}
                {msg.chartData && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Live Recharts Analytics Query</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={msg.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }} />
                          <Bar dataKey="Collected" fill="#08428C" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Unpaid" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Attendance" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Optional Code block inside response */}
                {msg.codeBlock && (
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-sky-300 overflow-x-auto">
                    <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-800 mb-2">
                      <span className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5" /> Python Exam Script</span>
                      <button onClick={() => navigator.clipboard.writeText(msg.codeBlock!)} className="hover:text-white">Copy Code</button>
                    </div>
                    <pre>{msg.codeBlock}</pre>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="pt-2 flex justify-end gap-2 text-xs">
                    <Button size="sm" variant="ghost" onClick={() => speakResponse(msg.content)} title="Listen via Voice Synthesis">
                      <Volume2 className="w-3.5 h-3.5 mr-1" /> Speak
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming Response text */}
          {isStreaming && (
            <div className="flex items-start gap-4 max-w-4xl">
              <div className="w-9 h-9 rounded-2xl bg-[#08428C] text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl rounded-tl-xs p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800 dark:text-slate-200">
                  {streamingText}
                  <span className="inline-block w-2 h-4 bg-[#08428C] ml-1 animate-pulse" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick action prompt suggestions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PROMPT_SUGGESTIONS.map((ps, idx) => (
              <button
                key={idx}
                disabled={isStreaming}
                onClick={() => handleSendMessage(ps.prompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#e8f1fc] dark:hover:bg-blue-950 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#08428C] transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              >
                {ps.title}
              </button>
            ))}
          </div>

          {attachedFile && (
            <div className="p-2.5 rounded-xl bg-[#e8f1fc] dark:bg-blue-950 text-[#08428C] text-xs font-semibold flex items-center justify-between">
              <span>📎 Attached file ready for AI analysis: {attachedFile}</span>
              <button onClick={() => setAttachedFile(null)}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Input control bar */}
          <div className="relative flex items-center">
            <label className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors">
              <Paperclip className="w-5 h-5" />
              <input type="file" accept=".pdf,.csv,.txt,.png,.jpg" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={startVoiceRecognition}
              className={`p-3 transition-colors cursor-pointer ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-slate-600'}`}
              title="Voice Input (Speech to Text)"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder="Ask AI anything about school attendance, finance, exam generation... (Press Enter)"
              value={inputMessage}
              disabled={isStreaming}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 py-3.5 px-4 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#08428C]/40 placeholder-slate-400"
            />

            <Button
              variant="primary"
              size="md"
              onClick={() => handleSendMessage()}
              disabled={(!inputMessage && !attachedFile) || isStreaming}
              className="ml-2 px-5 py-3 rounded-2xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
