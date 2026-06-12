import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Calendar, User, ArrowUpRight, ArrowDownLeft, AlertCircle, Copy, Check, CheckCircle } from 'lucide-react';
import { useLending } from '../context/LendingContext';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoanCreated?: (loanId: string) => void;
}

export default function NewLoanModal({ isOpen, onClose, onLoanCreated }: NewLoanModalProps) {
  const { createLoan, currentRates } = useLending();
  
  // Step 1: Input details, Step 2: Show Settlement Preview
  const [step, setStep] = useState<1 | 2>(1);
  const [createdLoanId, setCreatedLoanId] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<'lending' | 'borrowing'>('lending');
  const [currency, setCurrency] = useState<'btc' | 'kes' | 'usd'>('btc');
  const [amount, setAmount] = useState('');
  
  // Conversions updated reactively
  const [amountBTC, setAmountBTC] = useState<number>(0);
  const [amountKES, setAmountKES] = useState<number>(0);
  const [amountUSD, setAmountUSD] = useState<number>(0);

  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Lightning Invoice simulation states
  const [invoice, setInvoice] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [paymentSettled, setPaymentSettled] = useState(false);
  const [simulatedTxId, setSimulatedTxId] = useState('');

  // Settle loan function directly from LendingContext
  const { settleLoan } = useLending();

  // Set default due date to 14 days from now
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    const yyyy = defaultDate.getFullYear();
    const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDate.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  }, [isOpen]);

  // Handle live currency recalculations
  useEffect(() => {
    const numAmt = parseFloat(amount) || 0;
    if (numAmt <= 0) {
      setAmountBTC(0);
      setAmountKES(0);
      setAmountUSD(0);
      return;
    }

    if (currency === 'btc') {
      setAmountBTC(numAmt);
      setAmountKES(Math.round(numAmt * currentRates.KES_PER_BTC));
      setAmountUSD(Number((numAmt * currentRates.USD_PER_BTC).toFixed(2)));
    } else if (currency === 'kes') {
      const btc = numAmt / currentRates.KES_PER_BTC;
      setAmountBTC(Number(btc.toFixed(8)));
      setAmountKES(numAmt);
      setAmountUSD(Number((btc * currentRates.USD_PER_BTC).toFixed(2)));
    } else if (currency === 'usd') {
      const btc = numAmt / currentRates.USD_PER_BTC;
      setAmountBTC(Number(btc.toFixed(8)));
      setAmountKES(Math.round(btc * currentRates.KES_PER_BTC));
      setAmountUSD(numAmt);
    }
  }, [amount, currency, currentRates]);

  // Reset form when modal closes/opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDirection('lending');
      setCurrency('btc');
      setAmount('');
      setNote('');
      setFormError('');
      setPaymentSettled(false);
      setIsSimulatingPayment(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Counterparty name is required.');
      return;
    }
    if (amountBTC <= 0) {
      setFormError('Please enter a valid positive loan amount.');
      return;
    }
    if (!dueDate) {
      setFormError('Please select a due date.');
      return;
    }

    setFormError('');

    // Determine starting status of created loan
    // If we are borrowing, let's start as pending until settled, or active if lender disbursed.
    // If we're lending, it starts "active" or "pending"
    // Let's make it start as "active" for standard, or "pending" if is borrowing, which matches settlement demo requirements perfectly.
    const initialStatus = direction === 'borrowing' ? 'pending' : 'active';

    const newId = createLoan({
      name,
      amountBTC,
      amountKES,
      direction,
      note: note.trim() || undefined,
      dueDate,
      status: initialStatus,
    });

    setCreatedLoanId(newId);

    // Generate a beautiful mock Lightning Invoice
    const invoicePrefix = 'lnbc' + Math.floor(amountBTC * 100000000) + 'n1';
    const randomHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setInvoice(`${invoicePrefix}demo${randomHash}pj2s9uxtq2`);
    setSimulatedTxId('tx_demo_' + Math.random().toString(36).substring(2, 10));

    // Move to settlement preview
    setStep(2);
  };

  const copyInvoiceToClipboard = () => {
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3-second simulation sequence
  const startSimulation = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      // Complete settlement state in LendingContext
      settleLoan(createdLoanId);
      setIsSimulatingPayment(false);
      setPaymentSettled(true);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-md"
      />

      {/* Modal Surface */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-brand-card border border-brand-border p-6 shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-lg text-brand-text-primary">
              {step === 1 ? 'Configure New Loan' : 'Settlement Invoice'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors text-xs font-mono border border-brand-border"
          >
            Esc
          </button>
        </div>

        {/* Dynamic Multi-Step Body */}
        <div className="overflow-y-auto pr-1 flex-grow">
          {step === 1 ? (
            /* Configure Loan details */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Direction Toggle */}
              <div className="bg-brand-bg p-1 rounded-xl border border-brand-border flex">
                <button
                  type="button"
                  id="direction-lending-btn"
                  onClick={() => setDirection('lending')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    direction === 'lending'
                      ? 'bg-brand-primary text-brand-bg font-bold shadow-md shadow-brand-primary/10'
                      : 'text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>I'm Lending</span>
                </button>
                <button
                  type="button"
                  id="direction-borrowing-btn"
                  onClick={() => setDirection('borrowing')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    direction === 'borrowing'
                      ? 'bg-amber-500 text-brand-bg font-bold shadow-md shadow-amber-500/10'
                      : 'text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>I'm Borrowing</span>
                </button>
              </div>

              {/* Counterparty Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Counterparty Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grace Wanjiku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text-primary text-sm focus:border-brand-primary"
                  required
                />
              </div>

              {/* Amount & Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider flex justify-between">
                  <span>Amount & Denomination</span>
                  <span className="text-[10px] text-brand-primary font-semibold lowercase">Live conversions</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.00000001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text-primary font-mono text-lg focus:border-brand-primary"
                    required
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="bg-brand-bg border border-brand-border rounded-xl px-3 py-3 text-brand-text-primary text-sm font-mono focus:border-brand-primary"
                  >
                    <option value="btc">BTC</option>
                    <option value="kes">KES (Sh)</option>
                    <option value="usd">USD ($)</option>
                  </select>
                </div>

                {/* Instant Calculation Badge Preview */}
                {parseFloat(amount) > 0 && (
                  <div className="bg-brand-bg/50 border border-brand-border rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-brand-text-secondary">BTC</div>
                      <div className="text-brand-primary font-bold">{amountBTC.toFixed(6)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-text-secondary">KES</div>
                      <div className="text-emerald-400 font-semibold">Sh{amountKES.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-brand-text-secondary">USD</div>
                      <div className="text-cyan-400 font-semibold">${amountUSD.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text-primary text-sm font-mono focus:border-brand-primary"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider">
                  Optional Memo Notes
                </label>
                <textarea
                  placeholder="Details of the pact, chama contribution codes, etc."
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text-primary text-sm focus:border-brand-primary"
                />
              </div>

              {/* Form Error warning */}
              {formError && (
                <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 rounded-xl flex items-start space-x-2 text-xs text-brand-danger">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                id="create-loan-btn"
                className="w-full py-4 rounded-xl primary-gradient-glow text-brand-bg font-bold font-display tracking-wide uppercase hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
              >
                <span>Create Informal Loan</span>
                <Zap className="w-4 h-4 fill-brand-bg stroke-brand-bg" />
              </button>
            </form>
          ) : (
            /* Step 2: Settlement Preview Screen with Invoice and SVG QR */
            <div className="space-y-5 text-center py-2">
              {!paymentSettled ? (
                <>
                  <div className="bg-brand-bg/50 border border-brand-border rounded-xl p-4 flex flex-col items-center">
                    <span className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider">
                      Invoice Amount
                    </span>
                    <span className="text-2xl font-bold font-mono text-brand-primary mt-1">
                      {amountBTC} BTC
                    </span>
                    <span className="text-sm text-brand-text-secondary font-mono mt-0.5">
                      ≈ Sh{amountKES.toLocaleString()} KES • ${amountUSD} USD
                    </span>
                    {direction === 'borrowing' ? (
                      <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-mono mt-3">
                        Debt Initialized (Pending Settle)
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-mono mt-3">
                        Lending Disbursed (Ready to share with {name})
                      </span>
                    )}
                  </div>

                  {/* QR Code SVG Styled Placeholder with Centered Lightning Bolt */}
                  <div className="relative mx-auto w-48 h-48 bg-white rounded-2xl p-3 shadow-xl transition-all duration-300">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-brand-bg">
                      {/* Grid QR Dots */}
                      <rect x="0" y="0" width="22" height="22" className="fill-brand-bg opacity-90" />
                      <rect x="3" y="3" width="16" height="16" className="fill-white" />
                      <rect x="6" y="6" width="10" height="10" className="fill-brand-bg" />

                      <rect x="78" y="0" width="22" height="22" className="fill-brand-bg opacity-90" />
                      <rect x="81" y="3" width="16" height="16" className="fill-white" />
                      <rect x="84" y="6" width="10" height="10" className="fill-brand-bg" />

                      <rect x="0" y="78" width="22" height="22" className="fill-brand-bg opacity-90" />
                      <rect x="3" y="81" width="16" height="16" className="fill-white" />
                      <rect x="6" y="84" width="10" height="10" className="fill-brand-bg" />

                      {/* Random Mock QR lines/dots */}
                      <g className="fill-brand-bg opacity-80">
                        <rect x="28" y="4" width="8" height="4" />
                        <rect x="42" y="8" width="12" height="4" />
                        <rect x="60" y="2" width="6" height="6" />
                        <rect x="30" y="16" width="4" height="12" />
                        <rect x="48" y="18" width="14" height="4" />
                        <rect x="68" y="18" width="4" height="10" />

                        <rect x="4" y="28" width="12" height="4" />
                        <rect x="18" y="34" width="8" height="8" />
                        <rect x="4" y="46" width="6" height="6" />

                        <rect x="78" y="28" width="12" height="4" />
                        <rect x="84" y="36" width="8" height="8" />
                        <rect x="90" y="46" width="6" height="6" />

                        <rect x="28" y="78" width="14" height="4" />
                        <rect x="48" y="82" width="10" height="12" />
                        <rect x="64" y="88" width="10" height="4" />
                        <rect x="80" y="78" width="6" height="14" />
                      </g>

                      {/* Accent Lightning Background Ring */}
                      <circle cx="50" cy="50" r="14" className="fill-brand-primary" />
                    </svg>

                    {/* Glowing Lightning emblem in center of QR */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 bg-brand-bg border-4 border-white rounded-full flex items-center justify-center animate-pulse-slow shadow-md">
                        <Zap className="w-5 h-5 text-brand-primary fill-brand-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Str string snippet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-brand-text-secondary px-1">
                      <span>LIGHTNING INVOICE STRING</span>
                      {copied && <span className="text-emerald-400 font-semibold flex items-center gap-1">Copied!</span>}
                    </div>
                    <div className="flex bg-brand-bg border border-brand-border rounded-xl overflow-hidden p-1.5 items-center">
                      <p className="text-left font-mono text-xs text-brand-text-secondary truncate flex-1 px-2 select-all tracking-tight">
                        {invoice}
                      </p>
                      <button
                        type="button"
                        onClick={copyInvoiceToClipboard}
                        className="p-2 bg-brand-card hover:bg-brand-border rounded-lg text-brand-primary transition-colors focus:ring-1 focus:ring-brand-primary"
                        title="Copy invoice string to clipboard"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Simulate Settle Block */}
                  <div className="pt-2 border-t border-brand-border flex gap-3">
                    {direction === 'borrowing' ? (
                      <button
                        type="button"
                        onClick={startSimulation}
                        disabled={isSimulatingPayment}
                        className="flex-1 py-3 text-sm font-semibold rounded-xl bg-brand-primary text-brand-bg font-bold flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all glow-btn"
                      >
                        {isSimulatingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                            <span>Awaiting Payment Callback...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-brand-bg fill-brand-bg" />
                            <span>Settle Instantly (Demo Pay)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onLoanCreated) onLoanCreated(createdLoanId);
                        }}
                        className="flex-1 py-3 text-sm font-semibold rounded-xl bg-brand-primary text-brand-bg font-bold hover:bg-brand-primary/95 transition-all"
                      >
                        Share Invoice & Close
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onLoanCreated) onLoanCreated(createdLoanId);
                      }}
                      disabled={isSimulatingPayment}
                      className="px-4 py-3 text-sm font-semibold rounded-xl border border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                /* Success screen after lightning settle simulation completes! */
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-6 flex flex-col items-center space-y-4"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-semibold text-brand-text-primary">
                      ✓ Payment Settled
                    </h3>
                    <p className="text-xs text-brand-text-secondary mt-1 max-w-sm mx-auto">
                      Loan successfully cleared and settled instantly via Bitcoin Lightning Network. No banks involved.
                    </p>
                  </div>

                  <div className="w-full bg-brand-bg/50 border border-brand-border rounded-xl p-4 text-left font-mono space-y-2 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-text-secondary">Settle Reference</span>
                      <span className="text-cyan-400 font-bold">{simulatedTxId}</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-brand-border/60 pt-2">
                      <span className="text-brand-text-secondary">Amount Settled</span>
                      <span className="text-brand-primary font-bold">{amountBTC} BTC</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-brand-border/60 pt-2">
                      <span className="text-brand-text-secondary">Lender / Peer</span>
                      <span className="text-brand-text-primary">{name}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onLoanCreated) onLoanCreated(createdLoanId);
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-brand-bg font-bold text-sm tracking-wide transition-all uppercase shadow-lg shadow-emerald-500/10"
                  >
                    Finish & Close
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
