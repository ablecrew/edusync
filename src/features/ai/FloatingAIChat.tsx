import React, { useEffect, useRef, useState } from 'react';
import {
  X, Send, Paperclip, Mic, MicOff, Plus, MessageSquare, Trash2, Sparkles,
  Globe, HeadphonesIcon, StopCircle, ChevronDown,
} from 'lucide-react';
import { AIAvatar } from './components/AIAvatar';
import { ChatMessage } from './components/ChatMessage';
import { QuickActions } from './components/QuickActions';
import { useAIChat } from './use-ai-chat';
import { fileToAttachment } from './file-utils';
import type { AttachmentPart } from './gemini-client';
import type { AIModule } from './prompt-templates';
import { isGeminiConfigured } from './gemini-client';

const MODULES: Array<{ id: AIModule; label: string; emoji: string }> = [
  { id: 'school',     label: 'School Assistant', emoji: '🏫' },
  { id: 'admissions', label: 'Admissions',       emoji: '🎓' },
  { id: 'finance',    label: 'Finance',          emoji: '💰' },
  { id: 'academics',  label: 'Academics & CBC',  emoji: '📚' },
  { id: 'teacher',    label: 'Teacher',          emoji: '👩‍🏫' },
  { id: 'library',    label: 'Library',          emoji: '📖' },
  { id: 'staff',      label: 'Staff',            emoji: '👥' },
];

export const FloatingAIChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPart[]>([]);
  const [listening, setListening] = useState(false);
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffForm, setHandoffForm] = useState({ name: '', contact: '', subject: '' });
  const [handoffSuccess, setHandoffSuccess] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ai = useAIChat('school');

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, ai.messages, ai.streamingText]);

  // Voice input
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice recognition not supported in this browser.'); return; }
    const r = new SR();
    r.lang = ai.language === 'sw' ? 'sw-KE' : 'en-KE';
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => setInput(prev => `${prev} ${e.results[0][0].transcript}`.trim());
    r.onend = () => setListening(false);
    r.start();
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_>]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    const u = new SpeechSynthesisUtterance(clean.slice(0, 400));
    u.lang = ai.language === 'sw' ? 'sw-KE' : 'en-KE';
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB.'); return; }
    const att = await fileToAttachment(file);
    if (!att) { alert('Unsupported file type. Try images, PDFs, or text files.'); return; }
    setAttachments(prev => [...prev, att]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const send = async (prompt?: string) => {
    const text = prompt ?? input;
    if (!text.trim() && attachments.length === 0) return;
    setInput('');
    const atts = attachments; setAttachments([]);
    await ai.sendMessage(text, atts);
  };

  const submitHandoff = async () => {
    if (!handoffForm.name || !handoffForm.contact) return;
    await ai.requestHumanHandoff(handoffForm.name, handoffForm.contact, handoffForm.subject || 'AI conversation needs staff attention');
    setHandoffSuccess(true);
    setTimeout(() => { setHandoffOpen(false); setHandoffSuccess(false); setHandoffForm({ name: '', contact: '', subject: '' }); }, 2000);
  };

  const activeModule = MODULES.find(m => m.id === ai.module)!;

  return (
    <>
      {/* Modern floating orb — bottom RIGHT (opposite sidebar) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {!open && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-violet-500/20 pointer-events-none animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ask EduSync AI</span>
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          className="relative group hover:scale-110 active:scale-95 transition-transform duration-200"
          aria-label="Open AI assistant"
          title="EduSync AI Assistant"
        >
          <AIAvatar size={60} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
      </div>

      {/* Slide-in panel from RIGHT */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-screen sm:w-[440px] md:w-[500px] bg-white dark:bg-slate-950 shadow-2xl flex flex-col ml-auto animate-slide-in-right">

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 text-white flex items-center gap-3">
              <AIAvatar size={38} animated={false} />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setShowModulePicker(o => !o)}
                  className="flex items-center gap-1 text-sm font-black tracking-tight hover:text-violet-200 transition-colors"
                >
                  <span>{activeModule.emoji} {activeModule.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModulePicker ? 'rotate-180' : ''}`} />
                </button>
                <p className="text-[10px] text-violet-200/80 truncate">
                  Powered by Gemini · Live database context · {ai.language === 'sw' ? 'Kiswahili' : 'English'}
                </p>
              </div>
              <button
                onClick={() => ai.setLanguage(ai.language === 'sw' ? 'en' : 'sw')}
                className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
                title={`Switch to ${ai.language === 'sw' ? 'English' : 'Kiswahili'}`}
              >
                <Globe className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Module picker dropdown */}
            {showModulePicker && (
              <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 gap-1 p-2">
                {MODULES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { ai.setModule(m.id); setShowModulePicker(false); }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-2 transition-colors ${
                      ai.module === m.id ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{m.emoji}</span> {m.label}
                  </button>
                ))}
              </div>
            )}

            {/* API not configured banner */}
            {!isGeminiConfigured && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                ⚠️ <b>Gemini API key not set.</b> Add <code className="font-mono">VITE_GEMINI_API_KEY</code> to your <code>.env</code> file to enable real AI.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/60">
              {ai.messages.length === 0 && !ai.isStreaming && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <AIAvatar size={72} />
                  <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Hi! I'm EduSync AI</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    Ask me anything about {activeModule.label.toLowerCase()}. I have access to your school's live data.
                  </p>
                </div>
              )}

              {ai.messages.map(m => (
                <ChatMessage key={m.id} message={m} onSpeak={speak} />
              ))}

              {ai.isStreaming && (
                <div className="flex items-start gap-3 max-w-[92%] animate-fade-in">
                  <AIAvatar size={36} />
                  <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm p-4 border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
                    {ai.streamingText ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {ai.streamingText}
                        <span className="inline-block w-2 h-4 bg-violet-500 ml-1 animate-pulse" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '100ms' }} />
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                        <span className="ml-1">Thinking…</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Fallback / handoff CTA (shows after 3+ assistant messages) */}
            {ai.messages.filter(m => m.role === 'assistant').length >= 2 && !handoffOpen && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setHandoffOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                >
                  <HeadphonesIcon className="w-3.5 h-3.5" />
                  Not what you needed? Contact staff
                </button>
              </div>
            )}

            {/* Bottom composer */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <QuickActions
                module={ai.module}
                language={ai.language}
                disabled={ai.isStreaming}
                onPick={p => send(p)}
              />

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-[11px] text-violet-700 dark:text-violet-300 font-semibold">
                      <span className="truncate max-w-[140px]">📎 {a.name ?? a.kind}</span>
                      <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-1">
                <label className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                  <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.md" onChange={handleFile} className="hidden" />
                </label>
                <button
                  onClick={startListening}
                  disabled={listening}
                  className={`p-2.5 rounded-xl transition-colors ${listening ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 animate-pulse' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title="Voice input"
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={ai.isStreaming}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={ai.language === 'sw' ? 'Uliza chochote…' : 'Ask me anything…'}
                  rows={1}
                  className="flex-1 py-2.5 px-3 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 placeholder-slate-400 max-h-32"
                  style={{ minHeight: '40px' }}
                />
                {ai.isStreaming ? (
                  <button onClick={ai.stop} className="p-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600" title="Stop">
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() && attachments.length === 0}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <button onClick={() => ai.newConversation()} className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <Plus className="w-3 h-3" /> New chat
                </button>
                <span>Enter to send · Shift+Enter for line break</span>
              </div>
            </div>
          </div>

          {/* Human handoff modal */}
          {handoffOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-900/60" onClick={() => setHandoffOpen(false)} />
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="font-black text-lg mb-1">Contact school staff</h3>
                <p className="text-xs text-slate-500 mb-4">A staff member will get back to you. Your chat history will be shared.</p>
                {handoffSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-3">
                      <span className="text-3xl">✅</span>
                    </div>
                    <p className="font-bold text-emerald-700">Ticket created!</p>
                    <p className="text-xs text-slate-500 mt-1">Staff will contact you soon.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input value={handoffForm.name} onChange={e => setHandoffForm({ ...handoffForm, name: e.target.value })} placeholder="Your name" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    <input value={handoffForm.contact} onChange={e => setHandoffForm({ ...handoffForm, contact: e.target.value })} placeholder="Phone or email" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    <input value={handoffForm.subject} onChange={e => setHandoffForm({ ...handoffForm, subject: e.target.value })} placeholder="What do you need help with?" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setHandoffOpen(false)} className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                      <button onClick={submitHandoff} disabled={!handoffForm.name || !handoffForm.contact} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-violet-600 to-fuchsia-600 disabled:opacity-50">Submit</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;