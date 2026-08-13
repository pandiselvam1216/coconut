import { useState, useEffect } from 'react';

export default function Settings() {
  const [minConfidence, setMinConfidence] = useState(50);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedConf = localStorage.getItem('coconutMinConfidence');
    if (savedConf) {
      setMinConfidence(parseInt(savedConf, 10));
    }
  }, []);

  const handleSaveConfidence = (val) => {
    setMinConfidence(val);
    localStorage.setItem('coconutMinConfidence', val.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetCounts = () => {
    if (window.confirm("Are you sure you want to reset all counts and analytics?")) {
      localStorage.removeItem('coconutTotalCount');
      localStorage.removeItem('coconutLogs');
      window.location.reload();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-200 animate-fade-in max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-gray-700">Minimum Confidence Score</label>
            <span className="text-sm font-bold text-teal-600">{minConfidence}%</span>
          </div>
          <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-6 text-gray-600 shadow-sm relative">
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={minConfidence} 
              onChange={(e) => handleSaveConfidence(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              <span>More Detections</span>
              <span>More Accurate</span>
            </div>
            {saved && (
              <div className="absolute -top-3 right-4 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold animate-fade-in shadow-sm border border-green-200">
                Saved!
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Only detections with a confidence score equal to or higher than this value will be counted.</p>
        </div>

        <div className="pt-6 border-t border-gray-200 mt-6">
          <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
          <button 
            onClick={handleResetCounts}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Reset All Counts
          </button>
        </div>
      </div>
    </div>
  );
}
