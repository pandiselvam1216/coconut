import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Loader2 } from 'lucide-react';

export default function ImageTest({ onCount }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [minConfidence, setMinConfidence] = useState(0.5);

  useEffect(() => {
    const savedConf = localStorage.getItem('coconutMinConfidence');
    if (savedConf) {
      setMinConfidence(parseInt(savedConf, 10) / 100);
    }
  }, []);

  const processImage = async (file) => {
    if (!file) return;
    
    // Preview
    const url = URL.createObjectURL(file);
    setImage(url);
    // Clear previous errors
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        // Strip the data URL prefix to get pure base64
        const base64data = reader.result.split(',')[1];
        
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

          // In workflows, the response structure depends on the output node names.
          // Usually, object detection predictions are nested under an output array.
          // We look for 'predictions' or the first array we can find.
          let predictions = [];
          if (response.data) {
            // Find the array that contains the bounding boxes
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
          
          setResult(filteredPredictions);
          
          if (filteredPredictions.length > 0) {
            onCount(filteredPredictions.length);
          }
        } catch (error) {
          console.error("Error analyzing image:", error);
          const detailedError = error.response?.data?.message || error.response?.data?.detail?.[0]?.msg || error.message || "Unknown error";
          setError(`API Error: ${detailedError}. Check API key.`);
          setResult(null);
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Upload Test Image</h3>
      
      {error && (
        <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl mb-4 border border-red-200 text-sm font-semibold text-center">
          {error}
        </div>
      )}
      
      {!image && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-64 border-2 border-dashed border-gray-300 bg-gray-50 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 hover:border-teal-400 transition-all group shadow-sm"
        >
          <Upload className="text-gray-400 group-hover:text-teal-500 mb-2 transition-colors" size={32} />
          <span className="text-gray-500 font-medium group-hover:text-teal-600 transition-colors">Tap to browse or drop an image</span>
        </div>
      )}

      {image && (
        <div className="relative w-full h-[60vh] md:h-auto md:aspect-video max-h-[75vh] rounded-2xl md:rounded-3xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-inner mx-auto">
          <img src={image} alt="Preview" className="w-full h-full object-cover" />
          
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="animate-spin text-teal-500" size={48} />
            </div>
          )}

          {result && (
            <div className="absolute inset-0 pointer-events-none">
              {result.map((box, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-teal-500 bg-teal-500/20 shadow-sm"
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
      )}

      {result && !loading && (
        <div className="mt-6 text-center">
          <div className="inline-block bg-teal-50 text-teal-700 border border-teal-200 rounded-2xl px-8 py-4 shadow-sm">
            <span className="text-4xl font-black">{result.length}</span> <span className="font-semibold text-teal-600">coconuts detected!</span>
          </div>
          <button 
            onClick={() => { setImage(null); setResult(null); }}
            className="block w-full mt-4 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Upload another image
          </button>
        </div>
      )}

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={(e) => processImage(e.target.files[0])}
      />
    </div>
  );
}
