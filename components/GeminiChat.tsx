import React, { useState, useRef, useEffect } from 'react';
import { askGemini } from '../services/geminiService';
import { SimulationParams, SimulationStep, ChatMessage } from '../types';

interface Props {
  params: SimulationParams;
  step: SimulationStep;
}

const GeminiChat: React.FC<Props> = ({ params, step }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "I'm your AI Physics Tutor. Confused about the graph? Ask me anything about the Twin Paradox!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setLoading(true);

    // Add user message to UI
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);

    // Convert history format for API
    const apiHistory = newHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const response = await askGemini(userMsg, params, step, apiHistory);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
            <span className="text-xl">✨</span> AI Tutor
        </h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Gemini 2.0 Flash</span>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 rounded-lg p-3 text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Why does the line tilt?"
          className="flex-grow bg-slate-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default GeminiChat;
