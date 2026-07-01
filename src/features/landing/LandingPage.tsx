import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Users,
  BookOpen,
  DollarSign,
  Library,
  Bus,
  Briefcase,
  Package,
  Bot,
  Shield,
  Award,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Send,
  Building2,
  Lock,
  Globe2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactEmail, setContactEmail] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactEmail) {
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 5000);
      setContactEmail('');
    }
  };

  const FAQS = [
    {
      q: 'How does EduSync handle deployment to thousands of schools simultaneously?',
      a: 'EduSync is built on a distributed cloud native PostgreSQL architecture powered by Supabase. Every school operates in an isolated tenant schema or RLS sandbox with sub-10 millisecond database response times and automated daily geo-redundant backups.',
    },
    {
      q: 'Is EduSync fully compliant with CBC (Competency Based Curriculum) standards?',
      a: 'Yes. EduSync includes native CBC grading matrices, rubric descriptors (Exceeding, Meeting, Approaching, Below), holistic learner report cards, and automated transcript compilation.',
    },
    {
      q: 'Can parents pay school fees directly through the parent portal?',
      a: 'Absolutely. EduSync integrates real-time billing invoices, mobile money gateways, bank transfers, and scholarship credit allocations with instant digital receipt generation.',
    },
    {
      q: 'Does the AI Assistant access real school database metrics?',
      a: 'Yes. Our built-in autonomous AI Assistant queries live Supabase tables to generate fee collection forecasts, attendance anomalies, automated lesson plans, and customized examination papers.',
    },
    {
      q: 'How long does onboarding and data migration take?',
      a: 'With our automated CSV and SQL import engines, migrating historical student, staff, and financial records takes less than 24 hours. Dedicated enterprise architects assist your team throughout.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e17] text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#08428C] text-white flex items-center justify-center font-bold shadow-lg shadow-[#08428C]/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">EduSync</span>
          <Badge variant="primary" size="sm" className="hidden sm:inline-flex">Enterprise v2.4</Badge>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-[#08428C] transition-colors">Features</a>
          <a href="#about" className="hover:text-[#08428C] transition-colors">About</a>
          <a href="#modules" className="hover:text-[#08428C] transition-colors">Modules</a>
          <a href="#why-us" className="hover:text-[#08428C] transition-colors">Why Us</a>
          <a href="#pricing" className="hover:text-[#08428C] transition-colors">Pricing</a>
          <a href="#faqs" className="hover:text-[#08428C] transition-colors">FAQs</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
            <span>Launch Live System</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* 1. HERO SECTION WITH LOOPING SCHOOL VIDEO BACKGROUND */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden py-20 px-4 sm:px-8 text-white">
        {/* Looping School Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105 filter brightness-95"
            poster="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80"
          >
            {/* Reliable stock educational video loop showing students, technology, learning */}
            <source src="https://assets.mixkit.co/videos/preview/mixkit-students-walking-in-a-university-hallway-4395-large.mp4" type="video/mp4" />
            <source src="https://assets.mixkit.co/videos/preview/mixkit-group-of-students-studying-in-a-library-4370-large.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Overlay #08428C with approximately 60% opacity */}
          <div className="absolute inset-0 bg-[#08428C]/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#051c3d] via-transparent to-transparent opacity-90" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm font-semibold animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Powering Over 4,200+ Enterprise Schools Globally</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-tight drop-shadow-md">
            The Production-Ready <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-blue-200">
              School Management OS
            </span>
          </h1>

          <p className="text-lg sm:text-2xl font-normal max-w-3xl mx-auto text-blue-100 leading-relaxed drop-shadow-xs">
            Enterprise-grade student information, multi-currency bursary finance, CBC academic grading, library automation, and autonomous AI intelligence built on Supabase PostgreSQL.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="xl" variant="glass" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto text-slate-900 bg-white hover:bg-slate-100 font-bold shadow-2xl">
              <span>Enter Enterprise Dashboard</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="xl" variant="glass" onClick={() => navigate('/login')} className="w-full sm:w-auto text-white bg-[#08428C]/80 hover:bg-[#08428C] border-white/40">
              <Play className="w-5 h-5 mr-2 fill-current" />
              <span>Watch Interactive Walkthrough</span>
            </Button>
          </div>

          {/* Animated Statistics inside Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-12 max-w-4xl mx-auto">
            <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <p className="text-2xl sm:text-4xl font-black">1.2M+</p>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">Active Students</p>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <p className="text-2xl sm:text-4xl font-black">99.99%</p>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">Uptime SLA</p>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <p className="text-2xl sm:text-4xl font-black">100%</p>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">CBC & ISO Compliant</p>
            </div>
            <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <p className="text-2xl sm:text-4xl font-black">&lt;10ms</p>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">Supabase Query Speed</p>
            </div>
          </div>

          {/* Floating Cards inside Hero */}
          <div className="hidden lg:flex justify-between items-center max-w-5xl mx-auto mt-8 opacity-90">
            <div className="glass-panel p-4 rounded-2xl text-slate-900 text-left w-64 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#08428C]">Fee Collection Engine</span>
              </div>
              <p className="text-sm font-extrabold">$248,500 Collected</p>
              <p className="text-[11px] text-slate-500 mt-0.5">+14% vs last academic term</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl text-slate-900 text-left w-64 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-[#08428C]" />
                <span className="text-xs font-bold text-[#08428C]">AI Exam Assistant</span>
              </div>
              <p className="text-sm font-extrabold">Grade 10 Physics Exam</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Generated in 1.4s</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED SCHOOLS SECTION */}
      <section className="py-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Trusted by Elite Academies, Public School Districts & International Baccalaureate Campuses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 font-bold text-lg"><Building2 className="w-6 h-6 text-[#08428C]" /> St. Jude International</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Building2 className="w-6 h-6 text-[#08428C]" /> Oakridge STEM Academy</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Building2 className="w-6 h-6 text-[#08428C]" /> Hillcrest High District</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Building2 className="w-6 h-6 text-[#08428C]" /> Cambridge Heritage College</div>
            <div className="flex items-center gap-2 font-bold text-lg"><Building2 className="w-6 h-6 text-[#08428C]" /> Horizon Global Schools</div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="features" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="primary">Enterprise Polish</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Engineered Like an Apple OS, Built for High-Volume Schools
          </h2>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
            Every screen is crafted with Material 3 ergonomics, subtle glassmorphism, soft shadows, and WCAG accessibility compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="default" hoverEffect className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f1fc] dark:bg-blue-900/40 text-[#08428C] dark:text-blue-400 flex items-center justify-center font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Autonomous AI Assistant</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Natural language queries against Supabase PostgreSQL. Draft parent announcements, generate exam question banks, and detect fee default risks instantly.
            </p>
          </Card>

          <Card variant="default" hoverEffect className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f1fc] dark:bg-blue-900/40 text-[#08428C] dark:text-blue-400 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Full Bursary & Financials</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Automated term invoice generation, partial payment tracking, scholarship allocations, staff payroll processing, and real-time expense charts.
            </p>
          </Card>

          <Card variant="default" hoverEffect className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f1fc] dark:bg-blue-900/40 text-[#08428C] dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">CBC & Academic Grading</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Support for traditional percentage grading and CBC competency levels (Exceeding, Meeting, Approaching). Print polished PDF report cards in one click.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. ABOUT SECTION */}
      <section id="about" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="primary">About EduSync</Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Why We Rejected the Legacy School ERP Paradigm
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional school management systems are slow, clunky, and fragile. We built EduSync from the ground up as a cloud-native React 19 single-page app connected directly to PostgreSQL via Supabase Row Level Security.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-[#08428C] shrink-0" />
                <span>Zero mock data — 100% live database querying</span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-[#08428C] shrink-0" />
                <span>TanStack React Query optimistic UI caching & instant search</span>
              </div>
              <div className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-[#08428C] shrink-0" />
                <span>Role-based access permissions for 16 distinct school roles</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80"
                alt="Students using technology"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 p-6 rounded-2xl bg-[#08428C] text-white shadow-xl max-w-xs hidden sm:block">
              <p className="text-xs uppercase font-bold text-blue-200">Enterprise Standard</p>
              <p className="text-lg font-black mt-1">&quot;EduSync reduced our fee collection reconciliation time by 80%.&quot;</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. STATISTICS SECTION */}
      <section className="py-20 bg-[#08428C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-12">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Proven Performance at Scale
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-4xl sm:text-6xl font-black text-sky-200">4,200+</p>
              <p className="text-sm font-semibold text-blue-100">Schools Deployed</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-6xl font-black text-sky-200">16</p>
              <p className="text-sm font-semibold text-blue-100">Enterprise Roles</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-6xl font-black text-sky-200">$450M+</p>
              <p className="text-sm font-semibold text-blue-100">Tuition Invoiced Annually</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-6xl font-black text-sky-200">100%</p>
              <p className="text-sm font-semibold text-blue-100">End-to-End Functioning</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MODULES SECTION */}
      <section id="modules" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="primary">Comprehensive Modules</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Everything Required to Run Your Institution
          </h2>
          <p className="text-base text-slate-500">
            From classroom attendance to GPS bus fleet tracking and bookstore asset management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: 'Student Admissions', desc: 'Medical profiles, guardian records, promotion workflows, and ID card printing.' },
            { icon: GraduationCap, title: 'Teacher Faculty', desc: 'Staff qualifications, departmental subjects, payroll calculations, and leave tracking.' },
            { icon: BookOpen, title: 'Academics & Timetable', desc: 'Class streams, subject credits, assignment matrices, and CBC grading descriptors.' },
            { icon: DollarSign, title: 'Finance & Bursary', desc: 'Fee invoicing, payment receipts, scholarship discounts, and expense budgets.' },
            { icon: Library, title: 'Library Automation', desc: 'ISBN cataloging, book checkout workflows, reservations, and barcode generation.' },
            { icon: Bus, title: 'Transport Fleet', desc: 'Vehicle capacity management, driver contacts, route fees, and GPS live simulation.' },
            { icon: Briefcase, title: 'HR & Staff Payroll', desc: 'Employee records, role titles, salary calculations, and recruitment pipeline.' },
            { icon: Package, title: 'Store Inventory', desc: 'School assets, laboratory consumables, purchase orders, and vendor maintenance.' },
          ].map((mod, i) => {
            const Icon = mod.icon;
            return (
              <Card key={i} variant="default" hoverEffect className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#e8f1fc] dark:bg-blue-900/30 text-[#08428C] dark:text-blue-400 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{mod.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{mod.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 6. WHY CHOOSE US */}
      <section id="why-us" className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="primary">Why EduSync</Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Built for Security, Speed & Accessibility
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <Shield className="w-10 h-10 text-[#08428C]" />
              <h3 className="text-xl font-bold">Bank-Grade Supabase Auth</h3>
              <p className="text-sm text-slate-500">
                Encrypted JWT sessions, refresh token rotation, multi-factor authentication capability, and Row Level Security on every table.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <Lock className="w-10 h-10 text-[#08428C]" />
              <h3 className="text-xl font-bold">Complete Role Sandbox</h3>
              <p className="text-sm text-slate-500">
                Granular permissions ensure students only see their own report cards, while Bursars manage finance and Principals oversee executive charts.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <Globe2 className="w-10 h-10 text-[#08428C]" />
              <h3 className="text-xl font-bold">100% WCAG & Keyboard Navigation</h3>
              <p className="text-sm text-slate-500">
                Full focus rings, high contrast typography, ARIA labels, and instant Cmd+K global search across thousands of records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="primary">Testimonials</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Loved by Principals & Bursars Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { quote: "Deploying EduSync across our 14 school campuses was seamless. The built-in PostgreSQL schema copy tool made Supabase integration effortless.", name: "Dr. Evelyn Vance", title: "Superintendent, Hillcrest District" },
            { quote: "The AI Assistant is a total game changer. It drafts exam questions and forecasts unpaid fee balances instantly. Truly enterprise grade.", name: "Marcus Thorne", title: "Chief Financial Officer & Bursar" },
            { quote: "CBC compliance was our biggest headache until EduSync. Now our teachers input competency rubrics on mobile and print PDF reports in seconds.", name: "Principal Sarah Jenkins", title: "Oakridge STEM Academy" },
          ].map((t, idx) => (
            <Card key={idx} variant="default" className="p-8 flex flex-col justify-between space-y-6">
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 italic leading-relaxed">&quot;{t.quote}&quot;</p>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.title}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 8. PRICING */}
      <section id="pricing" className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="primary">Enterprise Pricing</Badge>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Predictable Pricing for Any Enrollment Size
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card variant="default" className="p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Standard School</h3>
                <p className="text-xs text-slate-500">Up to 500 Students</p>
                <p className="text-4xl font-black">$299<span className="text-sm font-normal text-slate-500"> / month</span></p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> All Core Modules (Students, Teachers)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Fee Invoicing & Bursary</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Supabase Storage & Local Fallback</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full mt-6" onClick={() => navigate('/login')}>Select Standard</Button>
            </Card>

            <Card variant="bordered" className="p-8 space-y-6 flex flex-col justify-between border-[#08428C] relative shadow-xl">
              <div className="absolute -top-3 right-6 bg-[#08428C] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#08428C] dark:text-blue-400">Enterprise District</h3>
                <p className="text-xs text-slate-500">Up to 5,000 Students</p>
                <p className="text-4xl font-black">$799<span className="text-sm font-normal text-slate-500"> / month</span></p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Unlimited Academics & CBC Reports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Autonomous AI Assistant Workspace</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Library QR Barcode Generator</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Dedicated SQL Schema Script Setup</li>
                </ul>
              </div>
              <Button variant="primary" className="w-full mt-6" onClick={() => navigate('/dashboard')}>Launch Live System</Button>
            </Card>

            <Card variant="default" className="p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Global Multi-Campus</h3>
                <p className="text-xs text-slate-500">Unlimited Enrollment</p>
                <p className="text-4xl font-black">Custom</p>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-4">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Dedicated Supabase Cloud Cluster</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> Custom OAuth & SSO Integration</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#08428C]" /> 24/7 Enterprise SLA Support</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full mt-6" onClick={() => navigate('/login')}>Contact Enterprise Sales</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 9. FAQS */}
      <section id="faqs" className="py-24 px-4 sm:px-8 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <Badge variant="primary">FAQs</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((f, i) => (
            <Card
              key={i}
              variant="default"
              className="p-6 cursor-pointer select-none transition-all"
              onClick={() => setActiveFaq(activeFaq === i ? null : i)}
            >
              <div className="flex items-center justify-between font-bold text-base text-slate-900 dark:text-white">
                <span>{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${activeFaq === i ? 'rotate-180 text-[#08428C]' : ''}`} />
              </div>
              {activeFaq === i && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                  {f.a}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 10. CONTACT */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="primary">Get In Touch</Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Request Deployment Assessment</h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">
            Our Enterprise Deployment Architects are ready to review your school&apos;s enrollment database and configure your Supabase instance.
          </p>

          <form onSubmit={handleContactSubmit} className="max-w-md mx-auto space-y-4 text-left pt-4">
            <Input
              label="Official School Email"
              type="email"
              placeholder="principal@yourschool.edu"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input label="School / Campus Name" placeholder="e.g. Hillcrest International" required />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              <span>Send Enterprise Inquiry</span>
              <Send className="w-4 h-4 ml-2" />
            </Button>

            {contactSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs text-center font-semibold border border-emerald-200 animate-fade-in">
                ✓ Thank you! Our Enterprise Team will contact your school within 2 hours.
              </div>
            )}
          </form>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-[#08428C] flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span>EduSync Platform</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Enterprise-grade School Management System engineered for deployment across thousands of campuses globally.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider">Enterprise Modules</h5>
            <ul className="space-y-2">
              <li><Link to="/dashboard/students" className="hover:text-white transition-colors">Student Information (SIS)</Link></li>
              <li><Link to="/dashboard/finance" className="hover:text-white transition-colors">Bursary & Fee Billing</Link></li>
              <li><Link to="/dashboard/academics" className="hover:text-white transition-colors">CBC & Report Cards</Link></li>
              <li><Link to="/dashboard/ai" className="hover:text-white transition-colors">Autonomous AI Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider">Resources</h5>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">System Architecture</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Enterprise Pricing</a></li>
              <li><a href="https://supabase.com/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Supabase Documentation</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3 uppercase tracking-wider">Headquarters</h5>
            <p className="leading-relaxed text-slate-400">
              100 Innovation Park, Suite 400 <br />
              San Francisco, CA 94105 <br />
              support@edusync.io
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 EduSync Enterprise Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-[#08428C]" /> ISO 27001 Certified</span>
            <span>WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
