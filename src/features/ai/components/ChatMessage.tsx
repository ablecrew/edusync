import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { Volume2, ThumbsUp, ThumbsDown, Copy, CheckCircle2, ImageIcon, FileText } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import type { Message } from '../use-ai-chat';

interface Props {
  message: Message;
  onSpeak?: (text: string) => void;
  onFeedback?: (rating: 'up' | 'down') => void;
}

export const ChatMessage: React.FC<Props> = ({ message, onSpeak, onFeedback }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`flex items-start gap-3 max-w-[92%] animate-fade-in ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm">You</div>
      ) : (
        <AIAvatar size={36} animated={false} />
      )}

      <div className={`flex-1 rounded-2xl p-4 shadow-sm text-sm ${
        isUser
          ? 'bg-gradient-to-br from-[#08428C] to-[#0a4fa8] text-white rounded-tr-sm'
          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-sm'
      }`}>
        {/* Attachments preview */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((a, i) => (
              <div key={i} className={`text-[11px] px-2 py-1 rounded-lg flex items-center gap-1.5 ${
                isUser ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}>
                {a.kind === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                <span className="truncate max-w-[160px]">{a.name ?? 'attachment'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1.5 prose-pre:my-2 prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-code:text-fuchsia-600 dark:prose-code:text-fuchsia-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Actions (assistant only) */}
        {!isUser && (
          <div className="flex items-center gap-1 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button onClick={copy} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc] dark:hover:bg-blue-950/40" title="Copy">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onSpeak && (
              <button onClick={() => onSpeak(message.content)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#08428C] hover:bg-[#e8f1fc] dark:hover:bg-blue-950/40" title="Read aloud">
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onFeedback && (
              <>
                <button onClick={() => onFeedback('up')} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Helpful">
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onFeedback('down')} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Not helpful">
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};