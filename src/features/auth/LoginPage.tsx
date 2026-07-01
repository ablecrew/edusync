import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GraduationCap, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid official email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Check your credentials or Supabase Auth.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    const success = await forgotPassword(forgotEmail);
    setForgotLoading(false);
    if (success) {
      setForgotSent(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSent(false);
        setForgotEmail('');
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#08428C] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#08428C]/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">EduSync</span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back!
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in to see what's popping today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200">
              {authError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Official Email Address"
              type="email"
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="e.g. youremail@gmail.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <Input
                label="Password"
                type="password"
                leftIcon={<Lock className="w-4 h-4" />}
                placeholder="Enter password"
                {...register('password')}
                error={errors.password?.message}
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-[#08428C] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Account Password"
        description="Enter your official school email to receive an automated password reset recovery link."
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. dandemarasighan@gmail.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
          <Button type="submit" variant="primary" className="w-full" isLoading={forgotLoading}>
            Send Recovery Link
          </Button>

          {forgotSent && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Reset instructions sent! Check your inbox or Supabase Auth logs.</span>
            </div>
          )}
        </form>
      </Dialog>
    </div>
  );
};
