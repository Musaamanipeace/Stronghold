import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Home, Zap, DollarSign, Coins, HeartHandshake, Menu, X, Sun, Moon } from 'lucide-react';
import { useLending } from '../context/LendingContext';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useLending();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Activity Feed', path: '/activity', icon: Activity },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group" id="nav-logo-btn">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-amber-500 flex items-center justify-center shadow-lg shadow-brand-primary/20 transition-transform group-hover:scale-105">
              <Zap className="w-5 h-5 text-brand-bg fill-brand-bg stroke-brand-bg" />
            </div>
            <div>
              <span className="font-display font-bold text-2xl tracking-wide text-brand-text-primary group-hover:text-brand-primary transition-colors">
                Deni
              </span>
              <span className="hidden sm:inline-block ml-1.5 px-2 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                Lightning MVP
              </span>
            </div>
          </Link>

          {/* Peer-to-peer Tickers (Desktop only) */}
          <div className="hidden lg:flex items-center space-x-6 border-l border-brand-border pl-6 text-xs font-mono">
            <div className="flex items-center space-x-2 text-brand-text-secondary bg-brand-card/50 px-3 py-1.5 rounded-lg border border-brand-border">
              <Coins className="w-3.5 h-3.5 text-brand-primary" />
              <span>BTC/USD:</span>
              <span className="text-emerald-400 font-semibold">$66,666</span>
            </div>
            <div className="flex items-center space-x-2 text-brand-text-secondary bg-brand-card/50 px-3 py-1.5 rounded-lg border border-brand-border">
              <span className="text-amber-500 font-bold">K</span>
              <span>BTC/KES:</span>
              <span className="text-emerald-400 font-semibold">Sh10,000,000</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-card'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-primary' : 'text-brand-text-secondary'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              id="theme-toggle-btn"
              className="p-2.5 ml-2 rounded-xl text-brand-text-secondary hover:text-brand-primary hover:bg-brand-card border border-brand-border/60 transition-all cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle theme mode"
            >
              {theme === 'light' ? (
                <Moon className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500/10" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10 animate-pulse-slow" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Quick theme toggler for mobile next to the menu */}
            <button
              onClick={toggleTheme}
              id="mobile-quick-theme-btn"
              className="p-2.5 rounded-xl text-brand-text-secondary hover:text-brand-primary hover:bg-brand-card border border-brand-border/60 transition-all cursor-pointer min-w-[40px] min-h-[40px]"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle theme mode quick"
            >
              {theme === 'light' ? (
                <Moon className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500/10" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10 animate-pulse-slow" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-card focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
              id="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={`mobile-nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    active
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : 'text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-brand-primary' : 'text-brand-text-secondary'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Theme Toggle Row */}
            <div className="px-3 py-1.5">
              <button
                onClick={toggleTheme}
                id="mobile-theme-toggle-btn"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-brand-text-secondary hover:text-brand-text-primary bg-brand-card/40 border border-brand-border/60 font-medium text-sm transition-all"
              >
                <span className="flex items-center space-x-3">
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-5 h-5 text-indigo-500" />
                      <span>Dark Theme</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-5 h-5 text-amber-500 animate-pulse-slow" />
                      <span>Light Theme</span>
                    </>
                  )}
                </span>
                <span className="text-xs text-brand-primary font-mono capitalize">
                  {theme} Mode
                </span>
              </button>
            </div>

            {/* Mobile Tickers */}
            <div className="px-4 py-3 border-t border-brand-border/60 mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex flex-col space-y-1 bg-brand-card/60 p-2.5 rounded-lg border border-brand-border">
                <span className="text-brand-text-secondary">BTC/USD</span>
                <span className="text-emerald-400 font-semibold">$66,666</span>
              </div>
              <div className="flex flex-col space-y-1 bg-brand-card/60 p-2.5 rounded-lg border border-brand-border">
                <span className="text-brand-text-secondary">BTC/KES</span>
                <span className="text-emerald-400 font-semibold">Sh10,000,000</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
