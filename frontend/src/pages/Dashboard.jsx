import { useState } from 'react';
import CameraStream from '../components/CameraStream';
import ImageTest from '../components/ImageTest';

export default function Dashboard({ onCount }) {
  const [mode, setMode] = useState('stream'); // 'stream' or 'image'

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full h-full max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-2 flex gap-2 w-full max-w-md mx-auto shadow-sm border border-gray-200">
        <button 
          onClick={() => setMode('stream')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${mode === 'stream' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Live Stream
        </button>
        <button 
          onClick={() => setMode('image')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${mode === 'image' ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Test Image
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-200 relative overflow-hidden flex-1 flex flex-col">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {mode === 'stream' ? (
          <CameraStream onCount={onCount} />
        ) : (
          <ImageTest onCount={onCount} />
        )}
      </div>
    </div>
  );
}
