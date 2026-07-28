import React, { useState } from 'react';
import { store } from '../services/store';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Khulumkha! Namaskar! I am THIKANA Northeast AI Mitra. I can help you find authentic homestays, Chang Ghar bamboo stays, and eco lodges across Assam, Meghalaya, Sikkim, Nagaland, Arunachal, Mizoram, Manipur & Tripura with zero commission. What Northeast destination are you exploring?'
    }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const activeProperties = store.getProperties().filter((p) => p.status === 'active');
      const sampleProps = activeProperties.map((p) => ({
        title: p.title,
        city: p.city,
        type: p.propertyType,
        rating: p.rating,
        verified: p.isVerified,
        featured: p.isFeatured,
      }));

      const res = await fetch('/api/ai/travel-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          availableProperties: sampleProps,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply || 'I found some great options! Explore our listings page to chat directly with owners on WhatsApp.',
        },
      ]);
    } catch (err) {
      console.error('AI assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I recommend checking our featured listings in Manali, Gangtok, Goa, and Shillong! Click on any homestay card to connect directly with the host on WhatsApp without paying any commission.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col h-[550px]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                THIKANA AI Mitra
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Powered by Gemini AI • Zero Commission Assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  You
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Searching Northeast stay recommendations...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[10px] text-slate-500 shrink-0 border-t border-slate-100 dark:border-slate-800">
          <span className="font-bold uppercase text-slate-400">Ask:</span>
          {['Kaziranga Safari', 'Sohra Waterfalls', 'Tawang Monastery', 'Majuli Stilt Stay'].map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setQuery(`Recommend stays near ${chip}`);
              }}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full hover:bg-emerald-100 hover:text-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="pt-2 flex gap-2">
          <input
            type="text"
            placeholder="e.g. Find homestays in Kaziranga or Cherrapunji..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
