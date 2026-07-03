import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { streamChat, detectLanguage, type ChatTurn, type AttachmentPart } from './gemini-client';
import { buildLiveContext } from './context-builder';
import { buildSystemPrompt, type AIModule } from './prompt-templates';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachmentPart[];
  created_at: string;
}
export interface Conversation {
  id: string;
  title: string;
  module: AIModule;
  language: 'en' | 'sw';
  created_at: string;
}

export function useAIChat(defaultModule: AIModule = 'school') {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [module, setModule] = useState<AIModule>(defaultModule);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const abortRef = useRef<AbortController | null>(null);

  // Load conversation list
  const refreshConversations = useCallback(async () => {
    const { data } = await supabase.from('ai_conversations')
      .select('id, title, module, language, created_at')
      .order('updated_at', { ascending: false })
      .limit(30);
    setConversations((data ?? []) as any);
  }, []);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);

  // Load messages when conversation switches
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    supabase.from('ai_messages').select('*').eq('conversation_id', activeId).order('created_at').then(({ data }) => {
      setMessages(((data ?? []) as any[]).map(m => ({
        id: m.id, role: m.role, content: m.content,
        attachments: m.attachments, created_at: m.created_at,
      })));
    });
  }, [activeId]);

  const newConversation = useCallback(async (title = 'New chat', mod: AIModule = module) => {
    const { data, error } = await supabase.from('ai_conversations').insert({
      title, module: mod, language, user_type: 'admin',
    }).select('*').single();
    if (error) throw error;
    await refreshConversations();
    setActiveId(data.id);
    setMessages([]);
    return data.id as string;
  }, [module, language, refreshConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from('ai_conversations').delete().eq('id', id);
    if (activeId === id) { setActiveId(null); setMessages([]); }
    refreshConversations();
  }, [activeId, refreshConversations]);

  const sendMessage = useCallback(async (userText: string, attachments: AttachmentPart[] = []) => {
    if (!userText.trim() && attachments.length === 0) return;
    setIsStreaming(true);
    setStreamingText('');

    // Auto-detect language for multi-language support
    if (userText) {
      const detected = detectLanguage(userText);
      if (detected !== language) setLanguage(detected);
    }

    // Ensure a conversation exists
    let convId = activeId;
    if (!convId) {
      convId = await newConversation(userText.slice(0, 50) || 'New chat');
    }

    // Optimistic user message
    const userMsg: Message = {
      id: `tmp-u-${Date.now()}`, role: 'user', content: userText,
      attachments, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Persist the user message
    await supabase.from('ai_messages').insert({
      conversation_id: convId, role: 'user', content: userText,
      attachments: attachments as any,
    });

    // Build live context + system prompt
    let ctx;
    try { ctx = await buildLiveContext(); }
    catch { ctx = { totalStudents: 0, activeStudents: 0, totalStaff: 0, activeTeachers: 0, totalClasses: 0, totalInvoiced: 0, totalCollected: 0, outstandingBalance: 0, overdueInvoices: 0, pendingApplications: 0 } as any; }

    const systemPrompt = buildSystemPrompt(module, ctx, language);

    // Full turn history for context
    const history = [...messages, userMsg].map<ChatTurn>(m => ({
      role: m.role, content: m.content, attachments: m.attachments,
    }));

    // Stream response
    abortRef.current = new AbortController();
    const fullText = await streamChat(
      systemPrompt,
      history,
      (delta) => setStreamingText(prev => prev + delta),
      { signal: abortRef.current.signal }
    );

    // Persist assistant message
    const { data: saved } = await supabase.from('ai_messages').insert({
      conversation_id: convId, role: 'assistant', content: fullText,
    }).select('*').single();

    setMessages(prev => [...prev, {
      id: saved?.id ?? `tmp-a-${Date.now()}`,
      role: 'assistant', content: fullText, created_at: new Date().toISOString(),
    }]);
    setStreamingText('');
    setIsStreaming(false);

    // Update convo title based on first user message
    if (messages.length === 0) {
      const title = userText.slice(0, 60) || 'New chat';
      await supabase.from('ai_conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', convId);
      refreshConversations();
    } else {
      await supabase.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    }
  }, [activeId, messages, module, language, newConversation, refreshConversations]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const requestHumanHandoff = useCallback(async (name: string, contact: string, subject: string) => {
    const transcript = messages.map(m => ({ role: m.role, content: m.content }));
    await supabase.from('ai_support_tickets').insert({
      conversation_id: activeId,
      requester_name: name, requester_contact: contact,
      module, subject, transcript: transcript as any,
      summary: messages[messages.length - 1]?.content?.slice(0, 500),
    });
  }, [activeId, messages, module]);

  return {
    conversations, activeId, setActiveId,
    messages, streamingText, isStreaming,
    module, setModule, language, setLanguage,
    sendMessage, stop, newConversation, deleteConversation,
    requestHumanHandoff, refreshConversations,
  };
}