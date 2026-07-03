import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, MessageSquare, Trash2, Send, Paperclip, Mic, MicOff, StopCircle, Globe, ChevronDown,
} from 'lucide-react';
import { AIAvatar } from './components/AIAvatar';
import { ChatMessage } from './components/ChatMessage';
import { QuickActions } from './components/QuickActions';
import { useAIChat } from './use-ai-chat';
import { fileToAttachment } from './file-utils';
import type { AttachmentPart } from './gemini-client';
import type { AIModule } from './prompt-templates';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const MODULES: Array<{ id: AIModule; label: string; emoji: string; desc: string }> = [
  { id: 'school',     label: 'School',     emoji: '🏫', desc: 'General school questions, FAQs, and routing' },
  { id: 'admissions', label: 'Admissions', emoji: '🎓', desc: 'Applications, documents, entry requirements' },
  { id: 'finance',    label: 'Finance',    emoji: '💰', desc: 'Fees, invoices, payment reminders' },
  { id: 'academics',  label: 'Academics',  emoji: '📚', desc: 'CBC lesson plans, quizzes, report remarks' },
  { id: 'teacher',    label: 'Teacher',    emoji: '👩‍🏫', desc: 'Homework, tests, differentiated questions' },
  { id: 'library',    label: 'Library',    emoji: '📖', desc: 'Books, availability, borrowing rules' },
  { id: 'staff',      label: 'Staff',      emoji: '👥', desc: 'Notices, leave, payslips, HR' },
];

export const AIAssistant: React.FC = () => {
  const ai = useAIChat('school');
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPart[]>([]);
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ai.messages, ai.streamingText]);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert('Voice not supported.');
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
    const u = new SpeechSynthesisUtterance(text.replace(/[#*`_>]/g, '').slice(0, 400));
    u.lang = ai.language === 'sw' ? 'sw-KE' : 'en-KE';
    window.speechSynthesis.speak(u);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) return alert('File under 10 MB please.');
    const att = await fileToAttachment(f);
    if (!att) return alert('Unsupported file type.');
    setAttachments(a => [...a, att]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const send = async (prompt?: string) => {
    const text = prompt ?? input;
    if (!text.trim() && attachments.length === 0) return;
    setInput('');
    const atts = attachments; setAttachments([]);
    await ai.sendMessage(text, atts);
  };

  const currentModule = MODULES.find(m => m.id === ai.module)!;

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 animate-fade-in pb-4">
      {/* Left rail: history + module picker */}
      <Card variant="default" className="w-72 shrink-0 hidden lg:flex flex-col p-3 gap-3">
        <Button variant="primary" onClick={() => ai.newConversation()} className="w-full">
          <Plus className="w-4 h-4" /> New chat
        </Button>

        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Module</p>
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => ai.setModule(m.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                ai.module === m.id
                  ? 'bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950/40 dark:to-fuchsia-950/40 text-violet-700 dark:text-violet-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex-1 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5">Recent</p>
          {ai.conversations.length === 0 ? (
            <p className="text-[11px] text-slate-400 px-2">No chats yet</p>
          ) : (
            <ul className="space-y-0.5">
              {ai.conversations.map(c => (
                <li key={c.id} className={`group flex items-center gap-1 rounded-lg text-xs ${
                  c.id === ai.activeId ? 'bg-slate-100 dark:bg-slate-800' : ''
                }`}>
                  <button
                    onClick={() => ai.setActiveId(c.id)}
                    className="flex-1 min-w-0 flex items-center gap-2 px-2 py-2 text-left"
                  >
                    <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                  <button
                    onClick={() => ai.deleteConversation(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Main chat */}
      <Card variant="default" className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
          <AIAvatar size={42} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {currentModule.emoji} {currentModule.label} AI
              </h2>
              <Badge variant="primary" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">Gemini</Badge>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{currentModule.desc}</p>
          </div>
          <button
            onClick={() => ai.setLanguage(ai.language === 'sw' ? 'en' : 'sw')}
            className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            title={`Switch to ${ai.language === 'sw' ? 'English' : 'Kiswahili'}`}
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
          {ai.messages.length === 0 && !ai.isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <AIAvatar size={96} />
              <h3 className="mt-6 text-xl font-black text-slate-900 dark:text-white">
                {ai.language === 'sw' ? 'Habari! Mimi ni EduSync AI' : "Hi! I'm EduSync AI"}
              </h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                {ai.language === 'sw'
                  ? 'Uliza chochote au chagua kidokezo hapa chini. Nina ufikiaji wa data ya shule kwa wakati halisi.'
                  : 'Ask me anything or pick a prompt below. I have real-time access to your school data.'}
              </p>
            </div>
          )}
          {ai.messages.map(m => (
            <ChatMessage key={m.id} message={m} onSpeak={speak} />
          ))}
          {ai.isStreaming && (
            <div className="flex items-start gap-3 max-w-[92%]">
              <AIAvatar size={36} />
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm p-4 border border-slate-200 dark:border-slate-800">
                {ai.streamingText ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {ai.streamingText}
                    <span className="inline-block w-2 h-4 bg-violet-500 ml-1 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Composer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <QuickActions module={ai.module} language={ai.language} disabled={ai.isStreaming} onPick={send} />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                  <span className="truncate max-w-[160px]">📎 {a.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1">
            <label className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
              <Paperclip className="w-5 h-5" />
              <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.csv,.md" onChange={handleFile} className="hidden" />
            </label>
            <button onClick={startListening} disabled={listening} className={`p-3 ${listening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-slate-700'}`}>
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={ai.isStreaming}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={ai.language === 'sw' ? 'Uliza chochote…' : 'Ask me anything…'}
              rows={1}
              className="flex-1 py-3 px-4 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 placeholder-slate-400 max-h-40"
            />
            {ai.isStreaming ? (
              <Button variant="danger" onClick={ai.stop}><StopCircle className="w-4 h-4" /></Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => send()}
                disabled={!input.trim() && attachments.length === 0}
                className="bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistant;