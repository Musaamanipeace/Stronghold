import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Activity, Zap, ArrowUpRight, ArrowDownLeft, Bell, Search, 
  Clock, Coins, RefreshCw, ChevronRight, Info, CheckCircle, Database, Download
} from 'lucide-react';
import { useLending } from '../context/LendingContext';
import { exportActivitiesToCSV } from '../utils/csvExport';

export default function ActivityPage() {
  const navigate = useNavigate();
  const { activities } = useLending();
  const [filterType, setFilterType] = useState<'all' | 'settle' | 'create' | 'reminder'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const displayActivities = activities.filter((act) => {
    // 1. Type filter
    if (filterType !== 'all' && act.type !== filterType) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = act.description.toLowerCase().includes(q);
      const nameMatch = act.loanName.toLowerCase().includes(q);
      const txMatch = (act.txId || '').toLowerCase().includes(q);
      return descMatch || nameMatch || txMatch;
    }

    return true;
  });

  const getEventIcon = (type: string, direction: string) => {
    switch (type) {
      case 'settle':
        return direction === 'lending' ? (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        ) : (
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
      case 'create':
        return direction === 'lending' ? (
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        ) : (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        );
      case 'reminder':
        return (
          <div className="p-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-lg">
            <Bell className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-brand-card border border-brand-border text-brand-text-secondary rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none" id="activity-page-container">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-brand-text-primary">
            Sovereign Ledger Feed
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            Real-time, offline cryptographic activity tracking logs of all loan events.
          </p>
        </div>

        {/* Sync Indicator */}
        <div className="bg-brand-card border border-brand-border px-3.5 py-1.5 rounded-xl flex items-center space-x-2 text-xs font-mono text-emerald-400 self-start md:self-auto">
          <Database className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Leger Local Cache Synced</span>
        </div>
      </div>

      {/* filter controls */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 md:p-6 mb-8">
        
        {/* Top filter row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pb-4 mb-6 border-b border-brand-border">
          
          {/* Quick chip status buttons */}
          <div className="flex flex-wrap gap-1 bg-brand-bg p-1 rounded-xl border border-brand-border">
            {(['all', 'settle', 'create', 'reminder'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-brand-primary text-brand-bg font-bold'
                    : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                {type === 'all' ? 'All events' : type === 'settle' ? 'Settled' : type === 'create' ? 'Creations' : 'Reminders'}
              </button>
            ))}
          </div>

          {/* Search bar & Export inside feeds */}
          <div className="flex items-center gap-2 flex-grow sm:max-w-md justify-end">
            <div className="relative flex-grow sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
              <input
                type="text"
                placeholder="Search companion or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-sans focus:border-brand-primary text-brand-text-primary"
              />
            </div>

            <button
              type="button"
              onClick={() => exportActivitiesToCSV(displayActivities)}
              className="px-3.5 py-2.5 hover:bg-brand-border hover:text-brand-text-primary bg-brand-bg border border-brand-border text-brand-text-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Export current filtered view of transaction activities to CSV"
              id="export-activities-csv-page-btn"
            >
              <Download className="w-3.5 h-3.5 text-brand-primary" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* List items */}
        {displayActivities.length === 0 ? (
          <div className="text-center py-16 text-brand-text-secondary flex flex-col items-center space-y-4">
            <div className="p-4 bg-brand-bg border border-brand-border rounded-full text-brand-text-secondary">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display font-semibold text-brand-text-primary">No Ledger Events</p>
              <p className="text-xs text-brand-text-secondary mt-1 max-w-xs mx-auto">
                No events could be resolved for the active filter parameters.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((act) => {
              const isSettlement = act.type === 'settle';
              const isCreation = act.type === 'create';
              
              return (
                <div
                  key={act.id}
                  onClick={() => navigate(`/loan/${act.loanId}`)}
                  className="p-4 rounded-xl bg-brand-bg/40 border border-brand-border hover:border-brand-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all hover:scale-[1.002]"
                >
                  {/* Left row: Icon & description log details */}
                  <div className="flex items-start sm:items-center space-x-3.5 flex-1 pr-4">
                    
                    {/* Compact Icon identifier */}
                    <div className="flex-shrink-0">
                      {getEventIcon(act.type, act.direction)}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-brand-text-primary font-sans leading-relaxed">
                        {act.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-brand-text-secondary font-mono">
                        <span className="uppercase">{act.timestamp}</span>
                        {act.txId && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400 select-all font-semibold uppercase">{act.txId}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-brand-primary">Memo: {act.loanName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right row: value marker & link */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-brand-border/40 pt-2 sm:pt-0">
                    
                    {/* Amount shown if relevant */}
                    {act.amountBTC !== undefined ? (
                      <div className={`font-mono text-xs font-bold ${
                        act.type === 'settle'
                          ? act.direction === 'lending' ? 'text-emerald-400' : 'text-emerald-400'
                          : act.direction === 'lending' ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {act.amountBTC.toFixed(5)} BTC
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-brand-text-secondary tracking-wider uppercase bg-brand-card px-2 py-0.5 rounded border border-brand-border font-semibold">
                        Nudge
                      </span>
                    )}

                    {/* Navigation helper */}
                    <span className="text-[10px] font-mono text-brand-text-secondary hover:text-brand-primary transition-colors flex items-center space-x-0.5 mt-0.5">
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
