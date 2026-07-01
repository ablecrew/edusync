import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { COMPLETE_SQL_SCHEMA } from '../../lib/supabase/sql_schema';

export const SQLModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(COMPLETE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase PostgreSQL End-to-End Schema"
      description="Copy & paste this complete script into your Supabase SQL Editor to provision all production tables, RLS policies, and enterprise seed data."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#e8f1fc] dark:bg-blue-950/40 border border-[#08428C]/20 text-[#08428C] dark:text-blue-300">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">100% Production Ready PostgreSQL Script</h4>
              <p className="text-xs opacity-90">Includes UUID extensions, profiles, students, teachers, academic classes, invoices, library books, transport, HR, and RLS policies.</p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#08428C] text-white hover:bg-[#073877] transition-colors shrink-0"
          >
            Open SQL Editor <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[450px]">
          <div className="sticky top-0 right-0 flex justify-end pb-2 border-b border-slate-800 mb-2">
            <Button size="sm" variant="glass" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Complete SQL
                </>
              )}
            </Button>
          </div>
          <pre className="whitespace-pre overflow-x-auto text-slate-300 leading-relaxed font-mono">
            {COMPLETE_SQL_SCHEMA}
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-[#08428C]" /> Seamless fallback persistence enabled locally if live Supabase is offline.
          </span>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
