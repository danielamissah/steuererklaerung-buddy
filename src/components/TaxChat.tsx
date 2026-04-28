'use client';

import { useState, useRef } from 'react';
import { TaxFiling, TaxResult } from '@/types';
import { T } from '@/data/translations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  filing: TaxFiling;
  result: TaxResult;
  t: T;
}

// Contextual AI chat — the model knows the user's exact filing numbers
// and explains why their result looks the way it does.
// This is more useful than a generic tax chatbot because it is grounded
// in the user's specific situation.
export function TaxChat({ filing, result, t }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          filing,
          result,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: t.error,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs">
      {/* Header */}
      <div className="bg-primary p-4 sm:p-5">
        <p className="font-bold text-sm text-white mb-0.5">
          Ask about your result
        </p>
        <p className="text-[11px] text-white/70">
          I know your exact numbers — ask me anything
        </p>
      </div>

      {/* Messages */}
      <div className="min-h-[180px] max-h-[320px] overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-center py-5">
            <p className="text-[13px] text-[#9CA3AF]">
              Ask "Why is my refund this amount?" or "What can I do to get a bigger refund next year?"
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`px-4 py-2.5 rounded-2xl max-w-[90%] text-[13px] leading-relaxed ${
            msg.role === 'user' 
              ? 'self-end bg-primary text-white' 
              : 'self-start bg-gray-100 text-text'
          }`}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="px-4 py-2.5 rounded-2xl bg-gray-100 text-[#9CA3AF] text-[13px] self-start animate-pulse">
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 sm:p-4 border-t border-gray-100">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask a question..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border-1.5 border-border text-[13px] text-text font-inter outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className={`px-4 py-2.5 rounded-xl border-none text-[13px] font-bold font-inter transition-colors ${
            !input.trim() || loading 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-primary text-white cursor-pointer hover:bg-opacity-90'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}