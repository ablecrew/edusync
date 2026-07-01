import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Users, DollarSign, Book, LayoutDashboard, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudents, useTeachers, useInvoices, useBooks } from '../../hooks/useQueries';

export const GlobalSearchCmdK: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const { data: invoices = [] } = useInvoices();
  const { data: books = [] } = useBooks();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();

  const matchedStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(normalized) ||
      s.last_name.toLowerCase().includes(normalized) ||
      s.admission_number.toLowerCase().includes(normalized)
  );

  const matchedTeachers = teachers.filter(
    (t) =>
      t.first_name.toLowerCase().includes(normalized) ||
      t.last_name.toLowerCase().includes(normalized) ||
      t.department.toLowerCase().includes(normalized) ||
      t.staff_id.toLowerCase().includes(normalized)
  );

  const matchedInvoices = invoices.filter(
    (i) =>
      i.invoice_number.toLowerCase().includes(normalized) ||
      i.student_name.toLowerCase().includes(normalized)
  );

  const matchedBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(normalized) ||
      b.author.toLowerCase().includes(normalized) ||
      b.isbn.toLowerCase().includes(normalized)
  );

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-scale-up">
        <div className="relative flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Global search students, teachers, invoices, books, classes... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 text-slate-900 dark:text-slate-100 bg-transparent text-base focus:outline-none placeholder-slate-400"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {normalized.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">
              <p>Type to search across thousands of records instantly.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <button
                  onClick={() => handleSelect('/dashboard/students')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium hover:bg-[#e8f1fc] hover:text-[#08428C]"
                >
                  🎓 Students List
                </button>
                <button
                  onClick={() => handleSelect('/dashboard/teachers')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium hover:bg-[#e8f1fc] hover:text-[#08428C]"
                >
                  🧑‍🏫 Faculty & Teachers
                </button>
                <button
                  onClick={() => handleSelect('/dashboard/finance')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium hover:bg-[#e8f1fc] hover:text-[#08428C]"
                >
                  💰 Invoices & Fees
                </button>
              </div>
            </div>
          )}

          {normalized.length > 0 &&
            matchedStudents.length === 0 &&
            matchedTeachers.length === 0 &&
            matchedInvoices.length === 0 &&
            matchedBooks.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No matching records found for &quot;<span className="font-semibold text-slate-900 dark:text-slate-100">{query}</span>&quot;
              </div>
            )}

          {matchedStudents.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Students ({matchedStudents.length})
              </h4>
              <div className="space-y-1">
                {matchedStudents.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(`/dashboard/students?id=${s.id}`)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#e8f1fc] dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#08428C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {s.first_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#08428C] dark:group-hover:text-blue-400">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.admission_number} • {s.class_name}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#08428C] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedTeachers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Teachers & Faculty ({matchedTeachers.length})
              </h4>
              <div className="space-y-1">
                {matchedTeachers.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(`/dashboard/teachers?id=${t.id}`)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#e8f1fc] dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#08428C]">
                        {t.first_name} {t.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.staff_id} • {t.department}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#08428C] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedInvoices.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Invoices & Fees ({matchedInvoices.length})
              </h4>
              <div className="space-y-1">
                {matchedInvoices.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => handleSelect(`/dashboard/finance`)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#e8f1fc] dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#08428C]">
                        {inv.invoice_number} ({inv.status})
                      </p>
                      <p className="text-xs text-slate-500">
                        {inv.student_name} • ${inv.amount.toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#08428C] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedBooks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 flex items-center gap-1.5">
                <Book className="w-3.5 h-3.5" /> Library Repository ({matchedBooks.length})
              </h4>
              <div className="space-y-1">
                {matchedBooks.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelect(`/dashboard/library`)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#e8f1fc] dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#08428C]">
                        {b.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.author} • ISBN: {b.isbn}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#08428C] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <LayoutDashboard className="w-3.5 h-3.5" /> Quick Navigation
          </span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
