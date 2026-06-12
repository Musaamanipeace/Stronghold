import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Zap, Calendar, User, Info, CheckCircle, Bell, 
  Trash2, AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock,
  FileText, ShieldCheck, Mail, Sparkles, Copy, Check
} from 'lucide-react';
import { useLending } from '../context/LendingContext';
import SettleModal from '../components/SettleModal';

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loans, sendReminder } = useLending();
  const [settledModalOpen, setSettledModalOpen] = useState(false);
  const [remindCopied, setRemindCopied] = useState(false);

  // Retrieve matching loan
  const loan = loans.find((l) => l.id === id);

  if (!loan) {
    return (
      <div className="max-w-md mx-auto py-16 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center text-brand-danger mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-display font-semibold text-brand-text-primary">Ledger Record Not Found</h2>
        <p className="text-xs text-brand-text-secondary mt-1">
          The requested transaction ID matches no offline in-memory cache records.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 px-5 py-2.5 bg-brand-card hover:bg-brand-border border border-brand-border text-brand-text-primary rounded-xl text-xs font-mono font-bold transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isLending = loan.direction === 'lending';
  const isPending = loan.status === 'pending';
  const isActive = loan.status === 'active';
  const isOverdue = loan.status === 'overdue';
  const isSettled = loan.status === 'settled';

  const handleSettleTrigger = () => {
    setSettledModalOpen(true);
  };

  const handleRemindClick = () => {
    sendReminder(loan.id);
  };

  const copySmartReminderLink = () => {
    const textToCopy = `Hi ${loan.name}, here is a friendly nudge regarding our active balance memo [${loan.note || 'Deni contract'}]. You can settle instantly using Bitcoin Lightning here: lnbc_invoice_payment`;
    navigator.clipboard.writeText(textToCopy);
    setRemindCopied(true);
    setTimeout(() => setRemindCopied(false), 2000);
  };

  // Helper icons for timelines
  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <User className="w-4 h-4 text-emerald-400" />;
      case 'reminder':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'settlement_initiated':
        return <Zap className="w-4 h-4 text-brand-primary" />;
      case 'settled':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-brand-text-secondary" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none" id="loan-detail-container">
      
      {/* Return Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2 text-brand-text-secondary hover:text-brand-text-primary mb-6 transition-colors text-xs font-mono uppercase tracking-wider bg-brand-card/50 hover:bg-brand-card border border-brand-border px-3.5 py-2 rounded-xl"
        id="detail-back-btn"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>

      {/* Main Grid: Info Section & Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column: Loan Overview Card */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Main Card */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* User identification */}
            <div className="flex items-center space-x-4 pb-4 border-b border-brand-border">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                isLending
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {loan.name.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-brand-text-secondary uppercase tracking-widest block">
                  Peer Counterparty
                </span>
                <h2 className="text-xl font-display font-black text-brand-text-primary">
                  {loan.name}
                </h2>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${
                    isSettled ? 'bg-brand-border text-brand-text-secondary' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                  }`}>
                    {loan.direction === 'lending' ? 'You Lent' : 'You Borrowed'}
                  </span>
                  
                  <span className="text-[10px] font-mono text-brand-text-secondary">
                    Created: {loan.createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Balances Display */}
            <div className="py-6 text-center select-all">
              <span className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider block">
                Total Transaction Value
              </span>
              <span className={`text-3xl font-black font-mono block mt-1.5 ${
                isLending ? 'text-emerald-400' : 'text-rose-500'
              }`}>
                {isLending ? '+' : '-'}{loan.amountBTC.toFixed(6)} BTC
              </span>
              <span className="text-sm font-mono text-brand-text-secondary block mt-1">
                ≈ Sh{loan.amountKES.toLocaleString()} KES • ${loan.amountUSD} USD
              </span>
            </div>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-brand-border pt-5 text-xs font-mono">
              <div className="bg-brand-bg/50 p-3 rounded-xl border border-brand-border">
                <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block">Due Date</span>
                <span className="text-brand-text-primary font-bold mt-1 block">{loan.dueDate}</span>
              </div>
              <div className="bg-brand-bg/50 p-3 rounded-xl border border-brand-border">
                <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block">Repayment State</span>
                <span className={`font-bold mt-1 block capitalize ${
                  isOverdue ? 'text-brand-danger' : isSettled ? 'text-emerald-400' : 'text-amber-500'
                }`}>
                  {loan.status}
                </span>
              </div>
            </div>

            {/* Memos Text Box */}
            <div className="mt-5 bg-brand-bg/50 border border-brand-border rounded-xl p-4">
              <span className="text-[10px] font-mono text-brand-text-secondary uppercase tracking-wider flex items-center space-x-1 mb-2">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                <span>Pact Memo Agreement</span>
              </span>
              <p className="text-sm text-brand-text-primary leading-relaxed font-sans italic">
                "{loan.note || 'No custom memo rules entered at creation.'}"
              </p>
            </div>

            {/* Dynamic Settle or Reminder Trigger CTAs */}
            <div className="mt-6 pt-5 border-t border-brand-border space-y-3">
              {!isSettled ? (
                <>
                  <button
                    onClick={handleSettleTrigger}
                    id="detail-settle-btn"
                    className="w-full py-3.5 rounded-xl primary-gradient-glow text-brand-bg font-bold font-display uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer glow-btn"
                  >
                    <Zap className="w-4 h-4 fill-brand-bg stroke-brand-bg" />
                    <span>Clear Balance via Lightning</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRemindClick}
                      id="detail-remind-btn"
                      className="flex-1 py-2.5 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-border/60 text-brand-primary font-bold font-mono text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Send Quick Nudge</span>
                    </button>
                    
                    <button
                      onClick={copySmartReminderLink}
                      className="p-2.5 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-border/60 text-brand-text-secondary hover:text-brand-text-primary transition-colors flex items-center justify-center"
                      title="Copy customizable peer reminder text"
                    >
                      {remindCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              ) : (
                /* Already settled state card */
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
                  <span className="w-11 h-11 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-emerald-400 block font-display">✓ Balance Settled</span>
                    <span className="text-[11px] text-brand-text-secondary font-mono mt-0.5 block">
                      This formal micro-contract has been closed over the Lightning network.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Protection / Trust Note */}
          <div className="p-4 bg-brand-card/50 border border-brand-border rounded-2xl flex items-start space-x-3 text-xs text-brand-text-secondary select-none">
            <ShieldCheck className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-brand-text-primary block">Sovereign Proof-of-Trust</span>
              <p className="mt-0.5 leading-relaxed font-sans">
                Informal loans tracked on Deni use in-app ledger hashing to guarantee trust transparency. Reminders are pushed over Lightning protocols or social links for seamless coordination.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Repayment Timeline entries */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-sm text-brand-text-primary flex items-center space-x-1">
            <Clock className="w-4 h-4 text-brand-primary" />
            <span>Repayment Timeline Ledger</span>
          </h3>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden">
            
            {/* Timeline thread line */}
            <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-brand-border" />

            <div className="space-y-6 relative">
              {loan.timeline.map((entry, index) => (
                <div key={entry.id} className="flex gap-4 items-start">
                  
                  {/* Icon circle */}
                  <div className="w-7 h-7 bg-brand-bg border border-brand-border rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm">
                    {getTimelineIcon(entry.type)}
                  </div>

                  {/* Body description */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-text-primary font-display">
                        {entry.title}
                      </span>
                      {index === loan.timeline.length - 1 && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-brand-text-secondary font-sans leading-relaxed">
                      {entry.description}
                    </p>
                    <span className="text-[9px] font-mono text-brand-text-secondary uppercase block">
                      {entry.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settle modal integration */}
      <AnimatePresence>
        {settledModalOpen && (
          <SettleModal
            isOpen={settledModalOpen}
            loan={loan}
            onClose={() => setSettledModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
