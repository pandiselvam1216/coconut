import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { Camera, BarChart3, Settings as SettingsIcon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [totalCount, setTotalCount] = useState(0);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const savedCount = localStorage.getItem('coconutTotalCount');
    if (savedCount) {
      setTotalCount(parseInt(savedCount));
    }
    
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/diagnostics');
        const data = await response.json();
        setModelReady(data.model_loaded);
      } catch (e) {
        setModelReady(false);
      }
    };
    checkApiKey();
    // Re-check periodically
    const interval = setInterval(checkApiKey, 10000);
    return () => clearInterval(interval);
  }, []);

  const incrementCount = (count) => {
    setTotalCount(prev => {
      const newCount = prev + count;
      localStorage.setItem('coconutTotalCount', newCount.toString());
      
      // Log for analytics to backend API instead of large localStorage array
      fetch('/api/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      }).catch(err => console.error("Failed to log count:", err));
      
      return newCount;
    });
  };

  const resetCount = () => {
    if (window.confirm("Reset total count to zero?")) {
      setTotalCount(0);
      localStorage.setItem('coconutTotalCount', '0');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans md:flex">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-xl z-50 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200 flex flex-col items-center">
          <img src="/tcm-logo.jpg" alt="TCM Vision" className="h-12 w-auto mb-4 object-contain drop-shadow-sm" />
          <h1 className="text-lg font-black text-teal-600 tracking-wider uppercase text-center leading-tight">Coconut<br/>Counter</h1>
        </div>
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-semibold'}`}
          >
            <Camera size={20} className={activeTab === 'dashboard' ? 'text-teal-600' : ''} />
            <span>Detect</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-semibold'}`}
          >
            <BarChart3 size={20} className={activeTab === 'analytics' ? 'text-teal-600' : ''} />
            <span>Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-semibold'}`}
          >
            <SettingsIcon size={20} className={activeTab === 'settings' ? 'text-teal-600' : ''} />
            <span>Settings</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
           <div className="flex items-center justify-center gap-2 text-xs font-semibold bg-white px-3 py-2.5 rounded-full border border-gray-200 shadow-sm">
             <div className={`w-2.5 h-2.5 rounded-full ${modelReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
             <span className="text-gray-600">{modelReady ? 'Model Ready' : 'Model Error'}</span>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header / Counter */}
        <header className="bg-white border-b border-gray-200 p-6 flex flex-col items-center justify-center sticky top-0 z-40 shadow-sm">
          <div className="md:hidden absolute top-4 right-4 flex items-center gap-2 text-xs font-semibold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <div className={`w-2.5 h-2.5 rounded-full ${modelReady ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-gray-600">{modelReady ? 'Model Ready' : 'Model Error'}</span>
          </div>
          
          <img src="/tcm-logo.jpg" alt="TCM Vision" className="h-10 w-auto mb-3 object-contain md:hidden" />
          
          <h1 className="text-xl font-bold text-teal-600 mb-2 tracking-wider uppercase md:hidden">Coconut Counter</h1>
          <div className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-600 drop-shadow-sm">
            {totalCount}
          </div>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-gray-500 text-sm font-medium">Total Counted</p>
          <button 
            onClick={resetCount}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-semibold transition-colors"
          >
            Reset
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {activeTab === 'dashboard' && <Dashboard onCount={incrementCount} />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'settings' && <Settings />}
        </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 pb-safe flex justify-around shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'dashboard' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-800'}`}
        >
          <Camera size={24} className="mb-1" />
          <span className="text-xs font-semibold">Detect</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'analytics' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-800'}`}
        >
          <BarChart3 size={24} className="mb-1" />
          <span className="text-xs font-semibold">Analytics</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center transition-colors ${activeTab === 'settings' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-800'}`}
        >
          <SettingsIcon size={24} className="mb-1" />
          <span className="text-xs font-semibold">Settings</span>
        </button>
      </nav>
      </div>
    </div>
  );
}
