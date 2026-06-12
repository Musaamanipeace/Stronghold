import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LendingProvider } from './context/LendingContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoanDetail from './pages/LoanDetail';
import ActivityPage from './pages/ActivityPage';

export default function App() {
  return (
    <LendingProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col font-sans selection:bg-brand-primary/30">
          {/* Top navigation header containing brand logo and BTC tickers */}
          <Navbar />
          
          {/* Core app routing entry points */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/loan/:id" element={<LoanDetail />} />
              <Route path="/activity" element={<ActivityPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LendingProvider>
  );
}
