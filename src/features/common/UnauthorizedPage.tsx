import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-6 shadow-xs">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Unauthorized Access</h1>
      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
        Your current role permission sandbox does not grant access to this enterprise resource. Contact your Super Admin or School Principal.
      </p>
      <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
      </Button>
    </div>
  );
};
