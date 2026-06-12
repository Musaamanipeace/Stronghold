import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Zap, Coins, Users, Shield, ArrowRight, HeartHandshake, BookOpen, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Track Debts',
      description: 'Know exactly who owes whom. Replace fragile notebooks, missed WhatsApp notes, and oral pacts with a shared, cryptographic ledger.',
      icon: BookOpen,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Instant Settlement',
      description: 'Request, send, and resolve peer balances instantly over the Bitcoin Lightning Network. Clear payments across borders with zero bank fees.',
      icon: Zap,
      color: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20'
    },
    {
      title: 'Community Finance',
      description: 'Built for the real-world. Create savings groups, support family chama cooperatives, and secure micro-loan agreements without red tape.',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    }
  ];

  const stats = [
    { value: 'Less than 1s', label: 'Lightning Settlement' },
    { value: 'Zero', label: 'Middleman Percentages' },
    { value: '100% Shared', label: 'Trust Transparency' }
  ];

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden bg-brand-bg select-none" id="landing-container">
      
      {/* Decorative ambient gradients */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Hero Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 flex-grow flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        
        {/* Hero Left Content */}
        <div className="max-w-2xl text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-brand-card/80 border border-brand-border px-3.5 py-1.5 rounded-full text-xs font-mono text-brand-primary"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Empowering Informal African Ledger Trust</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-brand-text-primary leading-[1.1]"
          >
            Deni — <br />
            <span className="bg-gradient-to-r from-brand-primary to-amber-500 bg-clip-text text-transparent">
              Lend, Borrow, Settle.
            </span> <br />
            No Bank Required.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-brand-text-secondary leading-relaxed"
          >
            Track informal loans and settle instantly using Bitcoin Lightning. Built for families, friends, and community savings circles across Africa to manage cooperative debt safely.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/dashboard')}
              id="landing-hero-cta"
              className="px-8 py-4 rounded-xl primary-gradient-glow text-brand-bg font-bold font-display tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 glow-btn cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 text-brand-bg" />
            </button>
            <button
              onClick={() => navigate('/activity')}
              className="px-6 py-4 rounded-xl border border-brand-border bg-brand-card/30 text-brand-text-primary text-sm font-medium hover:bg-brand-card hover:text-brand-primary transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>View Live Ledger</span>
            </button>
          </motion.div>

          {/* Quick stats board */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-8 grid grid-cols-3 gap-4 border-t border-brand-border/60"
          >
            {stats.map((s, index) => (
              <div key={index}>
                <div className="text-xl sm:text-2xl font-black text-brand-primary font-display">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-brand-text-secondary font-mono tracking-wider uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero Right Visual Mockup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full lg:w-[420px] bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl relative"
        >
          {/* Header element of Mock */}
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-mono text-brand-text-secondary uppercase">Active P2P Client</span>
          </div>

          {/* Content illustration */}
          <div className="space-y-4">
            {/* Total Balance block */}
            <div className="bg-brand-bg p-4 rounded-xl border border-brand-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-brand-text-secondary uppercase">Your Net Balance</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block mt-0.5">+0.0024 BTC</span>
                <span className="text-[10px] font-mono text-brand-text-secondary block">≈ Sh24,000 KES</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <HeartHandshake className="w-6 h-6" />
              </div>
            </div>

            {/* Micro transaction ledger list mock */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-brand-text-secondary uppercase block">Outstanding Debts</span>
              
              {/* Grace Card */}
              <div className="p-3 bg-brand-bg/50 border border-brand-border rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">G</div>
                  <div>
                    <div className="font-semibold text-brand-text-primary">Grace Wanjiku</div>
                    <div className="text-[10px] text-brand-text-secondary font-mono">Overdue • 4 days ago</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400 font-bold">+0.0018 BTC</div>
                  <div className="text-[9px] text-brand-text-secondary">Grace owes you</div>
                </div>
              </div>

              {/* David Card */}
              <div className="p-3 bg-brand-bg/50 border border-brand-border rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">D</div>
                  <div>
                    <div className="font-semibold text-brand-text-primary">David Mwangi</div>
                    <div className="text-[10px] text-brand-text-secondary font-mono">Due in 25 days</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-brand-danger font-bold">-0.0010 BTC</div>
                  <div className="text-[9px] text-brand-text-secondary">You owe David</div>
                </div>
              </div>
            </div>

            {/* Lightning CTA Mock */}
            <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-brand-primary fill-brand-primary animate-pulse" />
                <span className="font-mono text-[10px] text-brand-text-secondary uppercase">Ready for Lightning settlement</span>
              </div>
              <span className="text-[10px] font-mono text-brand-primary font-bold">Settle Instantly</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bullet Feature Cards with Scroll entrance animation */}
      <div className="bg-brand-card/30 border-t border-brand-border py-16 relative z-10 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-display font-bold text-brand-text-primary">How Deni Reshapes Trust</h2>
            <p className="text-xs font-mono text-brand-text-secondary uppercase mt-2 tracking-wider">Lending with sovereign technology</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-brand-card border border-brand-border p-6 rounded-2xl flex flex-col space-y-4 hover:border-brand-primary/30 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-brand-text-primary">{feat.title}</h3>
                    <p className="text-sm text-brand-text-secondary mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer footer */}
      <footer className="border-t border-brand-border py-6 bg-brand-bg/90 backdrop-blur text-center text-xs text-brand-text-secondary font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Deni P2P. Built with sovereign technology over Bitcoin Lightning.</span>
          <div className="flex space-x-4">
            <span className="hover:text-brand-primary transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>App Demo</span>
            <span>•</span>
            <span className="hover:text-brand-primary transition-colors cursor-pointer" onClick={() => navigate('/activity')}>Ledger Feed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
