import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Coins, DollarSign, RotateCcw, Copy, Check, Info } from 'lucide-react';

export default function CurrencyConverter() {
  const [btcVal, setBtcVal] = useState<string>('0.001');
  const [usdVal, setUsdVal] = useState<string>('66.67');
  const [kesVal, setKesVal] = useState<string>('10000');
  const [copied, setCopied] = useState(false);

  // Constants
  const BTC_USD = 66666.67;
  const BTC_KES = 10000000;

  const handleBtcChange = (val: string) => {
    setBtcVal(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setUsdVal((parsed * BTC_USD).toFixed(2));
      setKesVal(Math.round(parsed * BTC_KES).toString());
    } else {
      setUsdVal('');
      setKesVal('');
    }
  };

  const handleUsdChange = (val: string) => {
    setUsdVal(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const btc = parsed / BTC_USD;
      setBtcVal(btc.toFixed(6));
      setKesVal(Math.round(btc * BTC_KES).toString());
    } else {
      setBtcVal('');
      setKesVal('');
    }
  };

  const handleKesChange = (val: string) => {
    setKesVal(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const btc = parsed / BTC_KES;
      setBtcVal(btc.toFixed(6));
      setUsdVal((btc * BTC_USD).toFixed(2));
    } else {
      setBtcVal('');
      setUsdVal('');
    }
  };

  const handleReset = () => {
    setBtcVal('');
    setUsdVal('');
    setKesVal('');
  };

  const applyPreset = (type: 'btc' | 'usd' | 'kes', amount: number) => {
    if (type === 'btc') {
      setBtcVal(amount.toString());
      setUsdVal((amount * BTC_USD).toFixed(2));
      setKesVal(Math.round(amount * BTC_KES).toString());
    } else if (type === 'usd') {
      setUsdVal(amount.toString());
      const btc = amount / BTC_USD;
      setBtcVal(btc.toFixed(6));
      setKesVal(Math.round(btc * BTC_KES).toString());
    } else {
      setKesVal(amount.toString());
      const btc = amount / BTC_KES;
      setBtcVal(btc.toFixed(6));
      setUsdVal((btc * BTC_USD).toFixed(2));
    }
  };

  const handleCopy = () => {
    const b = parseFloat(btcVal) || 0;
    const u = parseFloat(usdVal) || 0;
    const k = parseFloat(kesVal) || 0;
    const summary = `${b.toFixed(6)} BTC ≈ $${u.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD ≈ Sh ${k.toLocaleString()} KES`;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden" id="currency-converter-card">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-brand-primary/10 rounded-lg text-brand-primary border border-brand-primary/20">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-brand-text-primary">
              Lightning Currency Converter
            </h3>
            <p className="text-[10px] font-mono text-brand-text-secondary mt-0.5">
              Live instant sovereign valuations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(btcVal || usdVal || kesVal) && (
            <button
              onClick={handleReset}
              className="p-1.5 bg-brand-bg hover:bg-brand-border border border-brand-border rounded-lg text-brand-text-secondary hover:text-brand-text-primary transition-all"
              id="converter-reset-btn"
              title="Clear calculations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg border transition-all flex items-center space-x-1 ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-brand-bg hover:bg-brand-border border-brand-border text-brand-text-secondary hover:text-brand-text-primary'
            }`}
            id="converter-copy-btn"
            title="Copy transaction summary text"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* BTC Input Block */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-secondary block">
            Bitcoin (BTC)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-brand-primary text-xs pointer-events-none select-none">
              ₿
            </div>
            <input
              type="text"
              pattern="^[0-9]*[.]?[0-9]*$"
              placeholder="0.000000"
              value={btcVal}
              onChange={(e) => {
                // Ensure only decimals are keyed in
                const formatted = e.target.value.replace(/[^0-9.]/g, '');
                handleBtcChange(formatted);
              }}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-7 pr-3 py-2 text-sm font-semibold font-mono text-brand-text-primary focus:border-brand-primary transition-all outline-none"
              id="converter-input-btc"
            />
          </div>
        </div>

        {/* USD Input Block */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-secondary block">
            USD ($)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-secondary pointer-events-none select-none" />
            <input
              type="text"
              pattern="^[0-9]*[.]?[0-9]*$"
              placeholder="0.00"
              value={usdVal}
              onChange={(e) => {
                const formatted = e.target.value.replace(/[^0-9.]/g, '');
                handleUsdChange(formatted);
              }}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-7 pr-3 py-2 text-sm font-semibold font-mono text-brand-text-primary focus:border-brand-primary transition-all outline-none"
              id="converter-input-usd"
            />
          </div>
        </div>

        {/* KES Input Block */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-secondary block">
            Kenyan Shilling (KES)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-text-secondary pointer-events-none select-none">
              Sh
            </span>
            <input
              type="text"
              pattern="^[0-9]*$"
              placeholder="0"
              value={kesVal}
              onChange={(e) => {
                const formatted = e.target.value.replace(/[^0-9]/g, '');
                handleKesChange(formatted);
              }}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-8 pr-3 py-2 text-sm font-semibold font-mono text-brand-text-primary focus:border-brand-primary transition-all outline-none"
              id="converter-input-kes"
            />
          </div>
        </div>

      </div>

      {/* Presets Block */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
        <span className="text-[10px] font-mono text-brand-text-secondary mr-1">Presets:</span>
        {[
          { label: '100k Sats', action: () => applyPreset('btc', 0.001) },
          { label: '500k Sats', action: () => applyPreset('btc', 0.005) },
          { label: '1m Sats', action: () => applyPreset('btc', 0.01) },
          { label: 'Sh 5,000', action: () => applyPreset('kes', 5000) },
          { label: 'Sh 10,000', action: () => applyPreset('kes', 10000) },
          { label: 'Sh 50,000', action: () => applyPreset('kes', 50000) },
          { label: '$25 USD', action: () => applyPreset('usd', 25) },
          { label: '$100 USD', action: () => applyPreset('usd', 100) },
        ].map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={p.action}
            className="px-2 py-1 bg-brand-bg hover:bg-brand-border border border-brand-border rounded-lg text-[10px] font-semibold text-brand-text-secondary hover:text-brand-primary transition-all cursor-pointer"
            id={`preset-btn-${idx}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Info Notice Ticker */}
      <div className="flex items-center space-x-2 text-[10px] text-brand-text-secondary bg-brand-bg/60 p-2.5 rounded-xl border border-brand-border/40 font-mono">
        <Info className="w-3.5 h-3.5 text-brand-primary" />
        <span>Rate Base: 1 BTC ⇌ $66,666.67 USD ⇌ Sh10,000,000 KES. Values updated locally in real-time.</span>
      </div>

    </div>
  );
}
