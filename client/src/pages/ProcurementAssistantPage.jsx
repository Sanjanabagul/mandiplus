import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  Sparkles,
  RefreshCw,
  ShoppingCart,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { aiService } from '../services/aiService.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const ProcurementAssistantPage = () => {
  const { language, setLanguage } = useLanguage();
  const { addToCart } = useCart();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: language === 'hi'
        ? 'नमस्ते! मैं मंडी+ एआई खरीद सहायक हूँ। आप अपनी कृषि खरीद आवश्यकताएँ बोलकर या लिखकर बता सकते हैं।\n\nउदाहरण: "मुझे 50 किलो टमाटर और 20 किलो प्याज चाहिए" या "पुणे के पास थोक शरबती गेहूं दिखाइए।"'
        : language === 'mr'
        ? 'नमस्कार! मी मंडी+ एआई खरेदी सहाय्यक आहे. आपण आपल्या शेतमाल खरेदीची मागणी बोलून किंवा टाईप करून सांगू शकता.\n\nउदाहरण: "मला ५० किलो टोमॅटो आणि २० किलो कांदा हवा आहे" किंवा "पुण्याजवळील घाऊक शरबती गहू दाखवा."'
        : 'Welcome to Mandi+ Conversational Procurement Engine!\n\nTell me the crops, quantities, and delivery preference for your store, restaurant, or wholesale business in natural English, Hindi, or Marathi. I will verify live farmer stock and find the best price tiers for you.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    { title: 'Restaurant Supplies', text: 'I need 50 kg of tomatoes and 20 kg of onions for my restaurant tomorrow.' },
    { title: 'Bulk Grain Deal', text: 'Find me 200 kg aged Basmati rice and 100 kg Sharbati wheat under wholesale rate.' },
    { title: 'Hindi Query', text: 'मुझे 30 किलो टमाटर और 10 किलो आलू चाहिए।' },
    { title: 'Marathi Query', text: 'मला ५० किलो कांदा आणि २० किलो आले हवे आहे.' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
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
          content: 'Unable to connect to live inventory service. Please verify your connection or try again.',
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
      alert('Speech recognition not supported in this browser. Please use Chrome/Edge or type directly.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSendMessage(transcript);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Language Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-mandi-navy flex items-center justify-center font-black shadow-sm">
            <Bot className="w-7 h-7 text-mandi-blue" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-mandi-navy flex items-center gap-2">
              <span>Mandi+ Conversational Procurement Engine</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Live AI</span>
            </h1>
            <p className="text-xs text-mandi-muted">
              Inventory-grounded natural language procurement in English, Hindi, and Marathi
            </p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold shadow-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'en' ? 'bg-mandi-blue text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'hi' ? 'bg-mandi-blue text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            हिंदी
          </button>
          <button
            onClick={() => setLanguage('mr')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'mr' ? 'bg-mandi-blue text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* Suggested Scenario Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p.text)}
            className="text-left bg-white p-3 rounded-xl border border-gray-200 hover:border-mandi-blue hover:shadow-xs transition-all"
          >
            <div className="text-[10px] uppercase font-bold text-mandi-blue mb-0.5">{p.title}</div>
            <div className="text-xs text-gray-700 line-clamp-2">{p.text}</div>
          </button>
        ))}
      </div>

      {/* Main Conversation Window */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[560px] overflow-hidden">

        {/* Message Bubble History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-mandi-blue text-white rounded-br-xs'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
              }`}>
                <div className="whitespace-pre-line font-medium">{m.content}</div>

                {/* Grounded Inventory Cards */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Stock Verified from APMC Mandi:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.recommendations.map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-between hover:border-mandi-blue transition-colors text-left"
                        >
                          <div>
                            <div className="font-bold text-mandi-navy text-xs">{rec.name}</div>
                            <div className="text-[11px] text-gray-500">{rec.sellerName} • {rec.locality}</div>
                            <div className="text-sm font-black text-emerald-800 mt-1">
                              ₹{rec.pricePerUnit} / {rec.unit}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{rec.matchReason}</div>
                          </div>

                          <button
                            onClick={() => addToCart({ _id: rec.productId, name: rec.name, pricePerUnit: rec.pricePerUnit, unit: rec.unit, stockQuantity: rec.availableStock, minOrderQuantity: 1 }, 10)}
                            className="w-full mt-2.5 bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add 10 {rec.unit} to Cart</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-mandi-blue bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm max-w-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking regional farm inventory & sorting wholesale tiers...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 bg-white border-t border-gray-200 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-full transition-colors shrink-0 ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:text-mandi-blue hover:bg-blue-50'
            }`}
            title="Speech Recognition"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'अपनी कृषि आवश्यकता यहाँ लिखें (उदा. "मुझे 50 किलो टमाटर और 20 किलो प्याज चाहिए")...'
                : language === 'mr'
                ? 'आपली मागणी येथे लिहा (उदा. "मला ५० किलो टोमॅटो आणि २० किलो कांदा हवा आहे")...'
                : 'Type your procurement requirement (e.g. "I need 50 kg tomatoes and 20 kg onions tomorrow")...'
            }
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
