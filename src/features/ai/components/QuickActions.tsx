import React from 'react';
import type { AIModule } from '../prompt-templates';

interface Props {
  module: AIModule;
  language: 'en' | 'sw';
  disabled?: boolean;
  onPick: (prompt: string) => void;
}

const PROMPTS: Record<AIModule, Array<{ en: string; sw: string; prompt_en: string; prompt_sw: string }>> = {
  school: [
    { en: '💰 Fee balance', sw: '💰 Salio la ada', prompt_en: 'How can I check my child\'s fee balance?', prompt_sw: 'Nawezaje kuangalia salio la ada la mtoto wangu?' },
    { en: '📅 Term dates', sw: '📅 Tarehe za muhula', prompt_en: 'When does the current term end and the next one start?', prompt_sw: 'Muhula wa sasa unaisha lini na unaoanza ni lini?' },
    { en: '📝 How to apply', sw: '📝 Jinsi ya kutuma maombi', prompt_en: 'How do I apply for admission for my child?', prompt_sw: 'Nawezaje kutuma maombi ya udahili wa mtoto wangu?' },
    { en: '🚌 Transport', sw: '🚌 Usafiri', prompt_en: 'Which transport routes are available?', prompt_sw: 'Ni njia gani za usafiri zinapatikana?' },
    { en: '📚 Library', sw: '📚 Maktaba', prompt_en: 'How do I borrow a book from the library?', prompt_sw: 'Nawezaje kukopa kitabu kutoka maktaba?' },
    { en: '📞 Contact us', sw: '📞 Wasiliana nasi', prompt_en: 'How do I contact the school administration?', prompt_sw: 'Nawezaje kuwasiliana na uongozi wa shule?' },
  ],
  admissions: [
    { en: '📋 Required documents', sw: '📋 Nyaraka zinazohitajika', prompt_en: 'What documents do I need to apply for admission?', prompt_sw: 'Ninahitaji nyaraka gani kutuma maombi ya udahili?' },
    { en: '🎯 Entry requirements', sw: '🎯 Sifa za kujiunga', prompt_en: 'What are the entry requirements for Grade 10?', prompt_sw: 'Sifa za kujiunga na Darasa la 10 ni zipi?' },
    { en: '📊 Check application status', sw: '📊 Angalia hali ya maombi', prompt_en: 'How do I check the status of my application?', prompt_sw: 'Nawezaje kuangalia hali ya maombi yangu?' },
  ],
  finance: [
    { en: '💳 Payment methods', sw: '💳 Njia za malipo', prompt_en: 'What are the accepted payment methods for school fees?', prompt_sw: 'Njia zipi za malipo ya ada zinakubalika?' },
    { en: '📄 Get invoice', sw: '📄 Pata ankara', prompt_en: 'How do I get a copy of my invoice?', prompt_sw: 'Nawezaje kupata nakala ya ankara yangu?' },
    { en: '⏰ Payment deadlines', sw: '⏰ Tarehe za mwisho', prompt_en: 'When are the fee payment deadlines for this term?', prompt_sw: 'Tarehe za mwisho za malipo ya ada za muhula huu ni lini?' },
  ],
  academics: [
    { en: '📖 Draft lesson plan', sw: '📖 Andaa mpango wa somo', prompt_en: 'Draft a Grade 8 Mathematics lesson plan on fractions.', prompt_sw: 'Andaa mpango wa somo la Hisabati Darasa la 8 kuhusu sehemu.' },
    { en: '📝 Generate quiz', sw: '📝 Tengeneza mtihani', prompt_en: 'Generate a 10-question quiz on Grade 7 Science — living things.', prompt_sw: 'Tengeneza mtihani wa maswali 10 kuhusu Sayansi Darasa la 7 — viumbe hai.' },
    { en: '🎓 CBC descriptors', sw: '🎓 Vigezo vya CBC', prompt_en: 'Explain the 4 CBC descriptors with examples.', prompt_sw: 'Fafanua vigezo 4 vya CBC pamoja na mifano.' },
    { en: '💬 Rubric comment', sw: '💬 Maoni ya alama', prompt_en: 'Write a positive rubric comment for a Meeting Expectations student in English.', prompt_sw: 'Andika maoni chanya ya alama kwa mwanafunzi wa Kufikia Matarajio kwa Kiingereza.' },
  ],
  teacher: [
    { en: '📚 Homework ideas', sw: '📚 Mawazo ya kazi za nyumbani', prompt_en: 'Give me 5 creative homework ideas for Grade 6 English.', prompt_sw: 'Nipatie mawazo 5 ya ubunifu ya kazi za nyumbani kwa Kiingereza Darasa la 6.' },
    { en: '📊 Differentiated questions', sw: '📊 Maswali tofauti', prompt_en: 'Create differentiated questions for weak, average, and strong learners on multiplication.', prompt_sw: 'Tengeneza maswali tofauti kwa wanafunzi dhaifu, wa wastani, na hodari kuhusu kuzidisha.' },
    { en: '📝 Simplify notes', sw: '📝 Rahisisha maelezo', prompt_en: 'Rewrite these Grade 8 Science notes in simpler language.', prompt_sw: 'Andika maelezo haya ya Sayansi Darasa la 8 kwa lugha rahisi.' },
  ],
  library: [
    { en: '📖 Find a book', sw: '📖 Tafuta kitabu', prompt_en: 'Do we have any books by Ngugi wa Thiong\'o?', prompt_sw: 'Tuna vitabu vyovyote vya Ngugi wa Thiong\'o?' },
    { en: '📋 Borrowing rules', sw: '📋 Sheria za ukopeshi', prompt_en: 'What are the library borrowing rules for students?', prompt_sw: 'Sheria za ukopeshi wa maktaba kwa wanafunzi ni zipi?' },
    { en: '⏰ Overdue books', sw: '⏰ Vitabu vilivyochelewa', prompt_en: 'What happens if I return a book late?', prompt_sw: 'Nini hufanyika nikirudisha kitabu kwa kuchelewa?' },
  ],
  staff: [
    { en: '📄 My payslip', sw: '📄 Ankara yangu ya mshahara', prompt_en: 'How do I access my payslip?', prompt_sw: 'Nawezaje kupata ankara yangu ya mshahara?' },
    { en: '🏖️ Leave policy', sw: '🏖️ Sera ya likizo', prompt_en: 'Explain the annual and sick leave policy.', prompt_sw: 'Fafanua sera ya likizo ya kila mwaka na ya ugonjwa.' },
    { en: '📢 Recent notices', sw: '📢 Matangazo ya hivi karibuni', prompt_en: 'Summarize recent staff notices for me.', prompt_sw: 'Nifafanulie matangazo ya hivi karibuni ya wafanyakazi.' },
  ],
};

export const QuickActions: React.FC<Props> = ({ module, language, disabled, onPick }) => {
  const items = PROMPTS[module] ?? [];
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
      {items.map((p, i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => onPick(language === 'sw' ? p.prompt_sw : p.prompt_en)}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-300 transition-colors whitespace-nowrap border border-slate-200 dark:border-slate-700/60 cursor-pointer disabled:opacity-50"
        >
          {language === 'sw' ? p.sw : p.en}
        </button>
      ))}
    </div>
  );
};