import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Camera, RefreshCw, Activity } from 'lucide-react';

export default function CameraStream({ onCount }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // environment for back, user for front
  const [isMobile, setIsMobile] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastCount, setLastCount] = useState(0);
  const [result, setResult] = useState(null);
  const [minConfidence, setMinConfidence] = useState(0.5);

  useEffect(() => {
    // Basic mobile detection
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setIsMobile(true);
    }
    
    // Load confidence threshold
    const savedConf = localStorage.getItem('coconutMinConfidence');
    if (savedConf) {
      setMinConfidence(parseInt(savedConf, 10) / 100);
    }
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsActive(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please allow permissions.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsActive(false);
    }
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(startCamera, 300);
  };

  // Inference loop
  const captureAndDetect = useCallback(async () => {
    if (!isActive || processing || !videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video, but cap at 640px for inference performance
    const MAX_DIM = 640;
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;
    
    if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * MAX_DIM);
        targetWidth = MAX_DIM;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * MAX_DIM);
        targetHeight = MAX_DIM;
      }
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get pure base64 without prefix for workflow API
    const base64data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const response = await axios({
        method: "POST",
        url: "/api/infer",
        data: {
          inputs: {
            image: {
              type: "base64",
              value: base64data
            }
          }
        },
        headers: { "Content-Type": "application/json" }
      });

      // Parse workflow response to find predictions
      let predictions = [];
      if (response.data) {
        for (const key in response.data) {
          if (Array.isArray(response.data[key]) && response.data[key].length > 0 && response.data[key][0].predictions) {
             predictions = response.data[key][0].predictions;
             break;
          } else if (Array.isArray(response.data[key]) && response.data[key].length > 0 && response.data[key][0].class) {
             predictions = response.data[key];
             break;
          }
        }
        if (predictions.length === 0 && response.data.predictions) {
            predictions = response.data.predictions;
        }
      }

      // Filter by confidence threshold
      const filteredPredictions = predictions.filter(p => p.confidence >= minConfidence);

      if (filteredPredictions.length > 0) {
        setResult(filteredPredictions);
        setLastCount(filteredPredictions.length);
        onCount(filteredPredictions.length);
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      // Small delay before next frame processing to avoid rate limits
      setTimeout(() => setProcessing(false), 2000); 
    }
  }, [isActive, processing, onCount]);

  useEffect(() => {
    let interval;
    if (isActive && !processing) {
      interval = setInterval(captureAndDetect, 500);
    }
    return () => clearInterval(interval);
  }, [isActive, processing, captureAndDetect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className={isActive ? "text-teal-500 animate-pulse" : "text-gray-400"} />
          Live Scanner
        </h3>
        {isMobile && isActive && (
          <button 
            onClick={toggleCamera}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700 transition-colors border border-gray-200"
          >
            <RefreshCw size={20} />
          </button>
        )}
      </div>

      <div className="relative w-full h-[60vh] md:h-auto md:aspect-video max-h-[75vh] bg-gray-100 md:rounded-3xl rounded-2xl overflow-hidden border-2 border-gray-300 shadow-inner group mx-auto">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Hidden canvas for taking snapshots */}
        <canvas ref={canvasRef} className="hidden" />

        {!isActive ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <button 
              onClick={startCamera}
              className="flex flex-col items-center gap-3 text-teal-600 hover:text-teal-500 hover:scale-105 transition-all"
            >
              <div className="p-4 bg-teal-50 rounded-full shadow-sm border border-teal-100">
                <Camera size={40} />
              </div>
              <span className="font-semibold text-lg tracking-wide">Start Camera</span>
            </button>
          </div>
        ) : (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <button 
              onClick={stopCamera}
              className="pointer-events-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-colors"
            >
              Stop Scanner
            </button>
          </div>
        )}

        {/* Live Indicator */}
        {isActive && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm z-10">
            <div className={`w-2 h-2 rounded-full ${processing ? 'bg-teal-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{processing ? 'Processing...' : 'Live'}</span>
          </div>
        )}

        {/* Bounding Boxes */}
        {result && isActive && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {result.map((box, idx) => (
              <div
                key={idx}
                className="absolute border-2 border-teal-500 bg-teal-500/20 shadow-sm transition-all duration-200 ease-in-out"
                style={{
                  left: `${(box.x - box.width / 2) * 100}%`,
                  top: `${(box.y - box.height / 2) * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                }}
              >
                <span className="absolute -top-6 left-0 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {box.class || 'coconut'} {box.confidence ? Math.round(box.confidence * 100) + '%' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isActive && lastCount > 0 && (
        <div className="mt-6 w-full max-w-xs animate-fade-in">
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Latest Detection</p>
            <p className="text-4xl font-black text-teal-700 mt-2">{lastCount} <span className="text-base font-semibold text-gray-500">coconuts</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
