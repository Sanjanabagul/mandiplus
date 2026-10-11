import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export const VoiceSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setSpeechError(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use keyboard search or Chrome/Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Set speech language based on app language
    if (language === 'hi') recognition.lang = 'hi-IN';
    else if (language === 'mr') recognition.lang = 'mr-IN';
    else recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        setIsListening(false);
        setTimeout(() => {
          onClose();
          navigate(`/products?search=${encodeURIComponent(text)}`);
        }, 800);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setSpeechError(`Could not detect speech (${event.error}). Please try again or type in the search bar.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
    }

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-mandi-navy mb-1">
          {t('voice_search')}
        </h3>
        <p className="text-xs text-mandi-muted mb-6">
          {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'} voice input active
        </p>

        {/* Microphone Pulse Visual */}
        <div className="flex justify-center my-6">
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-mandi-blue/20 animate-ping"></div>
                <div className="absolute -inset-3 rounded-full bg-mandi-blue/10 animate-pulse"></div>
              </>
            )}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-mandi-blue text-white shadow-lg shadow-blue-500/40' : 'bg-gray-100 text-gray-500'
            }`}>
              {isListening ? <Mic className="w-9 h-9 animate-pulse" /> : <MicOff className="w-9 h-9" />}
            </div>
          </div>
        </div>

        {/* Live speech transcription */}
        <div className="min-h-[60px] flex items-center justify-center px-4 py-2 bg-gray-50 rounded-xl mb-4 border border-gray-100">
          {transcript ? (
            <p className="text-lg font-semibold text-mandi-navy">"{transcript}"</p>
          ) : isListening ? (
            <p className="text-sm text-mandi-blue font-medium animate-pulse">{t('listening')}</p>
          ) : (
            <p className="text-xs text-mandi-muted">{t('speak_crop')}</p>
          )}
        </div>

        {speechError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs text-left mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        <div className="text-xs text-gray-400">
          Tip: You can say crop names in English, Hindi, or Marathi.
        </div>
      </div>
    </div>
  );
};
