import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, ArrowUpRight, ArrowDownLeft, AlertCircle, Calendar, 
  User, CheckCircle, Bell, Plus, Filter, Search, ArrowRight,
  TrendingUp, TrendingDown, Clock, Info, ShieldAlert, SlidersHorizontal, RotateCcw, X, Download
} from 'lucide-react';
import { useLending } from '../context/LendingContext';
import { exportLoansToCSV, exportActivitiesToCSV } from '../utils/csvExport';
import { Loan, LoanStatus } from '../types';
import NewLoanModal from '../components/NewLoanModal';
import SettleModal from '../components/SettleModal';
import CurrencyConverter from '../components/CurrencyConverter';

export default function Dashboard() {
  const navigate = useNavigate();
  const { loans, activities, sendReminder } = useLending();

  // Modal open/close controls
  const [newLoanOpen, setNewLoanOpen] = useState(false);
  const [selectedSettleLoan, setSelectedSettleLoan] = useState<Loan | null>(null);
  
  // Filtering and Searching states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<'all' | 'lending' | 'borrowing'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'overdue' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'due-date' | 'amount-desc' | 'amount-asc'>('newest');

  // Exchange metrics
  const BTC_USD = 66666.67;
  const BTC_KES = 10000000;

  // Derive aggregates dynamically based on state
  const totalOwedToYou = loans
    .filter(l => l.direction === 'lending' && l.status !== 'settled')
    .reduce((sum, l) => sum + l.amountBTC, 0);

  const totalOwedByYou = loans
    .filter(l => l.direction === 'borrowing' && l.status !== 'settled')
    .reduce((sum, l) => sum + l.amountBTC, 0);

  const netBalance = totalOwedToYou - totalOwedByYou;

  // Filtered & Sorted Loans logic
  const filteredLoans = loans
    .filter((loan) => {
      // 1. Direction Filter
      if (filterDirection !== 'all' && loan.direction !== filterDirection) return false;

      // 2. Status Filter
      if (filterStatus !== 'all' && loan.status !== filterStatus) return false;

      // 3. Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = loan.name.toLowerCase().includes(q);
        const matchesNote = (loan.note || '').toLowerCase().includes(q);
        const matchesStatus = loan.status.toLowerCase().includes(q);
        return matchesName || matchesNote || matchesStatus;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'due-date':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'amount-desc':
          return b.amountBTC - a.amountBTC;
        case 'amount-asc':
          return a.amountBTC - b.amountBTC;
        default:
          return 0;
      }
    });

  const getStatusStyle = (status: LoanStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'overdue':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'settled':
        return 'bg-brand-text-secondary/15 text-brand-text-secondary border-brand-border';
      default:
        return 'bg-brand-border text-brand-text-secondary border-brand-border';
    }
  };

  const getInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase();
  };

  // Triggering visual notice confirmation upon reminder
  const handleTriggerReminder = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Avoid triggering card navigation
    sendReminder(id);
    
    // Quick custom toast alert notification
    const btn = e.currentTarget as HTMLButtonElement;
    const origText = btn.innerHTML;
    btn.innerHTML = '✓ Sent!';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = origText;
      btn.disabled = false;
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none" id="dashboard-container">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-brand-text-primary">
            My Ledger
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1 font-sans">
            Sovereign trust tracking & instant Lightning Network settles.
          </p>
        </div>

        {/* Rapid Conversion Ticker Card */}
        <div className="bg-brand-card/90 border border-brand-border px-4 py-2.5 rounded-xl flex items-center space-x-3 text-xs font-mono">
          <Info className="w-4 h-4 text-brand-primary" />
          <span className="text-brand-text-secondary">Conversions:</span>
          <span>1 BTC ≈ Sh10,000,000 KES • $66,666 USD</span>
        </div>
      </div>

      {/* KPI Stats Cards Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* KPI Card 1: Total Owed To You */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider">
              Total Owed To You
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-emerald-400">
              {totalOwedToYou.toFixed(4)} BTC
            </div>
            <div className="text-xs text-brand-text-secondary font-mono mt-1 flex gap-2">
              <span>≈ Sh{(totalOwedToYou * BTC_KES).toLocaleString()} KES</span>
              <span>•</span>
              <span>${(totalOwedToYou * BTC_USD).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 2: Total You Owe */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider">
              Total You Owe
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-rose-500">
              {totalOwedByYou.toFixed(4)} BTC
            </div>
            <div className="text-xs text-brand-text-secondary font-mono mt-1 flex gap-2">
              <span>≈ Sh{(totalOwedByYou * BTC_KES).toLocaleString()} KES</span>
              <span>•</span>
              <span>${(totalOwedByYou * BTC_USD).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
            </div>
          </div>
        </motion.div>

        {/* KPI Card 3: Net Position */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-brand-card border border-brand-border p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-brand-text-secondary uppercase tracking-wider">
              Net Position
            </span>
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Zap className="w-4 h-4 text-brand-primary fill-brand-primary" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-black font-mono ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {netBalance >= 0 ? '+' : ''}{netBalance.toFixed(4)} BTC
            </div>
            <div className="text-xs text-brand-text-secondary font-mono mt-1 flex gap-2">
              <span>≈ Sh{(netBalance * BTC_KES).toLocaleString()} KES</span>
              <span>•</span>
              <span>${(netBalance * BTC_USD).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Interactive valuer tool */}
      <div className="mb-8">
        <CurrencyConverter />
      </div>

      {/* Filter and Action list section */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 sm:p-6 mb-8">
        
        {/* Dynamic Multi-Criteria Filters & Advanced Search */}
        <div className="flex flex-col gap-6 mb-6 pb-6 border-b border-brand-border">
          
          {/* Top Row: Search Input & Sort Selector */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
              <input
                type="text"
                placeholder="Search ledger by companion name, notes, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-10 pr-10 py-2.5 text-sm font-sans focus:border-brand-primary text-brand-text-primary animate-fade-in"
                id="search-input-field"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md hover:bg-brand-border flex items-center justify-center text-brand-text-secondary"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-brand-text-secondary whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-brand-text-primary cursor-pointer hover:border-brand-primary transition-all focus:border-brand-primary"
                id="sort-select-control"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="due-date">Due Date (Soonest first)</option>
                <option value="amount-desc">Amount (Highest first)</option>
                <option value="amount-asc">Amount (Lowest first)</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Filter Selections & Match Counts */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              {/* Direction selector */}
              <div className="space-y-1.5 w-full md:w-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-secondary">Direction</span>
                <div className="flex gap-1 bg-brand-bg p-1 rounded-xl border border-brand-border">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'lending', label: 'Lending' },
                    { key: 'borrowing', label: 'Borrowing' }
                  ].map((dir) => {
                    const count = dir.key === 'all' 
                      ? loans.length 
                      : loans.filter(l => l.direction === dir.key).length;
                    return (
                      <button
                        key={dir.key}
                        type="button"
                        onClick={() => setFilterDirection(dir.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          filterDirection === dir.key
                            ? 'bg-brand-primary text-brand-bg font-bold shadow'
                            : 'text-brand-text-secondary hover:text-brand-text-primary'
                        }`}
                        id={`filter-dir-${dir.key}`}
                      >
                        <span>{dir.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          filterDirection === dir.key
                            ? 'bg-brand-bg/20 text-brand-bg'
                            : 'bg-brand-card text-brand-text-primary'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status selector split */}
              <div className="space-y-1.5 w-full md:w-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-text-secondary">Status</span>
                <div className="flex flex-wrap gap-1 bg-brand-bg p-1 rounded-xl border border-brand-border">
                  {[
                    { key: 'all', label: 'All Statuses' },
                    { key: 'active', label: 'Active' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'overdue', label: 'Overdue' },
                    { key: 'settled', label: 'Settled' }
                  ].map((stat) => {
                    const count = stat.key === 'all'
                      ? loans.length
                      : loans.filter(l => l.status === stat.key).length;
                    return (
                      <button
                        key={stat.key}
                        type="button"
                        onClick={() => setFilterStatus(stat.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          filterStatus === stat.key
                            ? 'bg-brand-primary text-brand-bg font-bold shadow'
                            : 'text-brand-text-secondary hover:text-brand-text-primary'
                        }`}
                        id={`filter-status-${stat.key}`}
                      >
                        <span>{stat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          filterStatus === stat.key
                            ? 'bg-brand-bg/20 text-brand-bg'
                            : 'bg-brand-card text-brand-text-primary'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Match info and Clear option */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-3 self-end xl:self-auto w-full xl:w-auto border-t xl:border-t-0 border-brand-border/40 pt-3 xl:pt-0">
              {/* CSV Export Buttons for immediate download access */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => exportLoansToCSV(filteredLoans)}
                  className="px-3 py-1.5 hover:bg-brand-border hover:text-brand-text-primary bg-brand-bg border border-brand-border text-brand-text-secondary rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export currently filtered list of loans to CSV"
                  id="export-loans-csv-btn"
                >
                  <Download className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Export Loans Ledger</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportActivitiesToCSV(activities)}
                  className="px-3 py-1.5 hover:bg-brand-border hover:text-brand-text-primary bg-brand-bg border border-brand-border text-brand-text-secondary rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer sm:mr-2"
                  title="Export sovereign transaction activity federate logs to CSV"
                  id="export-activities-csv-btn"
                >
                  <Download className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Export Activity Feed</span>
                </button>
              </div>

              <span className="text-xs font-sans text-brand-text-secondary">
                Showing <strong className="text-brand-text-primary font-semibold">{filteredLoans.length}</strong> of {loans.length} loans
              </span>
              {(searchQuery || filterDirection !== 'all' || filterStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDirection('all');
                    setFilterStatus('all');
                    setSortBy('newest');
                  }}
                  className="px-2.5 py-1.5 bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  id="reset-filters"
                  title="Wipe search and active filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* Loans Table & Lists */}
        {filteredLoans.length === 0 ? (
          /* Empty state placeholder as requested */
          <div className="text-center py-16 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center text-brand-text-secondary relative">
              <span className="absolute inset-0 scale-75 rounded-full bg-brand-primary/5 animate-ping" />
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-brand-text-primary">No transactions found</h3>
              <p className="text-xs text-brand-text-secondary mt-1 max-w-sm mx-auto">
                No loans found matching your filters. Create your first informal loan now by using the floating action button below.
              </p>
            </div>
            <button
              onClick={() => setNewLoanOpen(true)}
              id="empty-state-cta"
              className="px-5 py-2.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl text-xs font-semibold hover:bg-brand-primary/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Loan</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map((loan) => {
              const overdue = loan.status === 'overdue';
              const pending = loan.status === 'pending';
              const isLending = loan.direction === 'lending';

              return (
                <div
                  key={loan.id}
                  onClick={() => navigate(`/loan/${loan.id}`)}
                  id={`loan-card-${loan.id}`}
                  className="bg-brand-bg/50 border border-brand-border hover:border-brand-primary/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:scale-[1.005] cursor-pointer"
                >
                  {/* Left Column: Avatar & Name details */}
                  <div className="flex items-center space-x-3.5">
                    
                    {/* Compact custom Avatar */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm select-none border shadow-inner ${
                      isLending
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {getInitial(loan.name)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-brand-text-primary hover:text-brand-primary transition-colors">
                          {loan.name}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase border font-semibold ${getStatusStyle(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>

                      {/* Notes Memo snippet */}
                      <p className="text-xs text-brand-text-secondary mt-0.5 line-clamp-1 max-w-[280px]">
                        {loan.note || 'No transaction notes.'}
                      </p>

                      {/* Due date status bar */}
                      <div className="flex items-center space-x-1.5 text-[10px] text-brand-text-secondary font-mono mt-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-text-secondary" />
                        <span>Due Date: {loan.dueDate}</span>
                        {overdue && (
                          <span className="text-brand-danger font-semibold bg-brand-danger/10 px-1 py-0.5 rounded flex items-center gap-0.5">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Values & Quick CTA Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-brand-border/60 pt-3 sm:pt-0">
                    
                    {/* Amount Block */}
                    <div className="sm:text-right">
                      <div className={`font-mono text-sm font-semibold flex items-center gap-1 sm:justify-end ${
                        isLending ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {isLending ? '+' : '-'}{loan.amountBTC.toFixed(5)} BTC
                      </div>
                      <div className="text-[11px] text-brand-text-secondary font-mono mt-0.5">
                        Sh{loan.amountKES.toLocaleString()} KES • ${loan.amountUSD} USD
                      </div>
                      <div className="text-[10px] text-brand-text-secondary font-semibold uppercase tracking-wider mt-0.5 font-sans">
                        {isLending ? 'You Lent' : 'You Borrowed'}
                      </div>
                    </div>

                    {/* Actions Panel depending on status */}
                    <div className="flex items-center gap-2">
                      {loan.status === 'active' && (
                        <button
                          type="button"
                          onClick={(e) => handleTriggerReminder(e, loan.id, loan.name)}
                          id={`remind-btn-${loan.id}`}
                          className="px-3 py-2 bg-brand-card hover:bg-brand-border border border-brand-border text-brand-primary hover:text-brand-text-primary rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3 text-brand-primary" />
                          <span>Remind</span>
                        </button>
                      )}

                      {pending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid routine card navigation
                            setSelectedSettleLoan(loan);
                          }}
                          id={`settle-btn-${loan.id}`}
                          className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-brand-bg font-bold font-mono text-xs transition-colors flex items-center gap-1 shadow shadow-emerald-500/10"
                        >
                          <Zap className="w-3.5 h-3.5 fill-brand-bg stroke-brand-bg" />
                          <span>Settle Now</span>
                        </button>
                      )}

                      {overdue && (
                        <button
                          type="button"
                          onClick={(e) => handleTriggerReminder(e, loan.id, loan.name)}
                          id={`remind-overdue-btn-${loan.id}`}
                          className="px-3 py-2 bg-brand-danger/10 border border-brand-danger/20 hover:bg-brand-danger hover:text-brand-bg text-brand-danger rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Remind!</span>
                        </button>
                      )}

                      {loan.status === 'settled' && (
                        <span className="px-3 py-2 bg-brand-border text-brand-text-secondary rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-text-secondary" />
                          <span>Archived</span>
                        </span>
                      )}

                      {/* Chevron detail link */}
                      <div className="p-1 px-1.5 border border-brand-border hover:border-brand-primary hover:bg-brand-card rounded-lg transition-colors text-brand-text-secondary">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setNewLoanOpen(true)}
          id="new-loan-fab-btn"
          className="px-5 py-4 rounded-xl primary-gradient-glow text-brand-bg font-bold font-display tracking-wide uppercase transition-all flex items-center space-x-2 shadow-2xl shadow-brand-primary/20 glow-btn"
          title="Create brand new loan contract"
        >
          <Plus className="w-5 h-5 text-brand-bg stroke-[3px]" />
          <span>New Loan</span>
        </motion.button>
      </div>

      {/* Modals injection */}
      <AnimatePresence>
        {newLoanOpen && (
          <NewLoanModal 
            isOpen={newLoanOpen} 
            onClose={() => setNewLoanOpen(false)} 
            onLoanCreated={(id) => navigate(`/loan/${id}`)}
          />
        )}
        
        {selectedSettleLoan && (
          <SettleModal
            isOpen={!!selectedSettleLoan}
            loan={selectedSettleLoan}
            onClose={() => setSelectedSettleLoan(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
