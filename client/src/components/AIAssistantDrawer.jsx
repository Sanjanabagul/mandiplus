import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, X, ShoppingCart, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { aiService } from '../services/aiService.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const AIAssistantDrawer = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: language === 'hi'
        ? 'नमस्ते! मैं मंडी+ एआई खरीद सहायक हूँ। आप अपनी आवश्यकता हिंदी, मराठी या अंग्रेजी में बता सकते हैं। जैसे: "मुझे कल के लिए 50 किलो टमाटर और 20 किलो प्याज चाहिए।"'
        : language === 'mr'
        ? 'नमस्कार! मी मंडी+ एआई खरेदी सहाय्यक आहे. आपण आपली मागणी मराठी, हिंदी किंवा इंग्रजीत सांगू शकता. उदा: "मला ५० किलो टोमॅटो आणि २० किलो कांदा हवा आहे."'
        : 'Hello! I am Mandi+ AI Procurement Assistant. Tell me what crops, quantities, or budget you need, and I will match verified regional farmers and live wholesale rates for you.',
      recommendations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    'I need 50 kg tomatoes and 20 kg onions for my kitchen tomorrow',
    'Find wholesale Sharbati wheat under ₹40/kg',
    'Certified organic baby spinach near Pune APMC',
    'Mujhe 30 kilo tamatar chahiye'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chatProcurement(text, language);
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply,
            recommendations: res.recommendations || []
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to live inventory. Please try again or browse products directly.',
          recommendations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      handleSend(text);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-fade-in">
      {/* Header */}
      <div className="bg-mandi-navy text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-yellow-400 text-mandi-navy flex items-center justify-center font-bold">
            <Bot className="w-5 h-5 text-mandi-blue" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <span>Mandi+ AI Procurement Engine</span>
              <span className="text-[10px] bg-mandi-green px-1.5 py-0.2 rounded text-white font-semibold">Live DB</span>
            </h3>
            <p className="text-[11px] text-gray-300">Grounded in real farmer inventory & APMC mandi rates</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested prompts strip */}
      <div className="bg-gray-50 p-2.5 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-500" /> Prompts:
        </span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[11px] bg-white border border-gray-200 hover:border-mandi-blue hover:text-mandi-blue text-gray-600 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#F8FAFC]">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
              m.role === 'user'
                ? 'bg-mandi-blue text-white rounded-br-xs'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
            }`}>
              <div className="whitespace-pre-line">{m.content}</div>

              {/* Product Recommendations Cards */}
              {m.recommendations && m.recommendations.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-2.5">
                  <span className="text-[10px] font-bold text-mandi-green uppercase tracking-wider block mb-1">
                    Matched Produce in Inventory:
                  </span>
                  {m.recommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center justify-between gap-2 hover:border-mandi-blue/50 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-bold text-mandi-navy text-xs">{rec.name}</div>
                        <div className="text-[11px] text-gray-500">
                          {rec.sellerName} • {rec.locality}
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5">
                          ₹{rec.pricePerUnit}/{rec.unit}
                          <span className="text-[10px] font-normal text-gray-400 ml-1">
                            ({rec.availableStock} {rec.unit} in stock)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart({ _id: rec.productId, name: rec.name, pricePerUnit: rec.pricePerUnit, unit: rec.unit, stockQuantity: rec.availableStock, minOrderQuantity: 1 }, 10)}
                        className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold p-2 rounded-md shrink-0 flex items-center gap-1 text-[11px] shadow-xs active:scale-95 transition-all"
                        title="Add 10 kg to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-mandi-blue bg-white p-3 rounded-2xl border border-gray-100 shadow-sm max-w-[70%]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-mandi-blue" />
            <span>Searching live farmer inventory & calculating best tiers...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`p-2 rounded-full transition-colors ${
            isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-mandi-blue bg-gray-100 hover:bg-blue-50'
          }`}
          title="Speak in English, Hindi, or Marathi"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'hi' ? 'अपनी आवश्यकता लिखें...' : language === 'mr' ? 'आपली मागणी लिहा...' : 'Type crops, quantities or locality...'}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white flex items-center justify-center transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
