import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-6 shadow-xs">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-2">404</h1>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        The requested module or resource does not exist or has been relocated within the EduSync directory.
      </p>
      <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
      </Button>
    </div>
  );
};
