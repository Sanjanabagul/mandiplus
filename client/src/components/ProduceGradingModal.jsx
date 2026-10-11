import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, X, Sparkles, RefreshCw } from 'lucide-react';
import { aiService } from '../services/aiService.js';

export const ProduceGradingModal = ({ isOpen, onClose, onGradingComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cropName, setCropName] = useState('Tomato');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('cropName', cropName);

    try {
      const res = await aiService.gradeProduceImage(formData);
      if (res.success) {
        setResult(res.grading);
        if (onGradingComplete) {
          onGradingComplete({
            grade: res.grading.grade,
            imageUrl: res.imageUrl,
            details: res.grading
          });
        }
      } else {
        setError(res.message || 'Grading failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error communicating with AI Produce Grading service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-mandi-green flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-mandi-navy">AI Produce Quality Grading</h3>
            <p className="text-xs text-mandi-muted">Automated visual inspection of crop freshness & grade</p>
          </div>
        </div>

        {/* Crop Selection */}
        <div className="my-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Crop Type</label>
          <select
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none"
          >
            <option value="Tomato">Tomatoes (Salad / Hybrid)</option>
            <option value="Onion">Onions (Red / White)</option>
            <option value="Potato">Potatoes (Jyoti / Table)</option>
            <option value="Grapes">Grapes (Thomson / Crimson)</option>
            <option value="Mango">Mangoes (Alphonso / Kesar)</option>
            <option value="Spinach">Greens / Spinach (Palak)</option>
          </select>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-gray-300 hover:border-mandi-blue rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 mb-4 relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="h-44 mx-auto rounded-lg object-cover shadow-sm" />
              <span className="text-[11px] text-mandi-blue font-medium mt-2 block underline">Click to choose a different photo</span>
            </div>
          ) : (
            <div className="py-4">
              <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Click or drag & drop produce photo</p>
              <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WebP up to 5MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        {!result && (
          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="w-full bg-mandi-green hover:bg-mandi-green-dark disabled:bg-gray-200 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Produce Surface & Color Uniformity...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Quality Assessment</span>
              </>
            )}
          </button>
        )}

        {/* Structured Results Display */}
        {result && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Assessment Result</span>
                <span className="text-xl font-black text-emerald-900">{result.grade}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-700 block">AI Confidence</span>
                <span className="font-bold text-emerald-900 text-sm">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block text-[10px]">Freshness Score</span>
                <span className="font-bold text-emerald-800 text-sm">{result.freshnessScore} / 100</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-gray-500 block text-[10px]">Defect Rate</span>
                <span className="font-bold text-emerald-800 text-sm">{result.defectRatePercent}%</span>
              </div>
            </div>

            <div className="mb-3">
              <h5 className="font-semibold text-emerald-950 mb-1">Visual Observations:</h5>
              <ul className="space-y-1 list-disc list-inside text-gray-700">
                {result.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>

            <p className="text-[10px] text-gray-500 italic bg-white/60 p-2 rounded border border-gray-100 mb-3">
              {result.disclaimer}
            </p>

            <button
              onClick={onClose}
              className="w-full bg-mandi-green text-white font-bold py-2 rounded-lg text-xs hover:bg-mandi-green-dark transition-colors"
            >
              Confirm & Apply Grade to Listing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
