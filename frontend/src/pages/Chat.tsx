import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api';
import type { ChatMessage } from '../types';

const USER_ID = 'anonymous-player';

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendMessage(text, USER_ID, sessionId);
      if (res.success && res.data) {
        setSessionId(res.data.sessionId);
        setMessages((prev) => [...prev, res.data!.message]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${res.error || 'Unknown error'}`, timestamp: Date.now() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'The Sphinx is silent... Connection lost.', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto p-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[var(--color-sphinx-gold)]">The Sphinx Speaks</h2>
        <p className="text-sm text-[var(--color-sand-dark)]">Ask your questions. Choose your words wisely.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 rounded-lg bg-[var(--color-obsidian-light)] border border-[var(--color-sand-dark)]/20">
        {messages.length === 0 && (
          <div className="text-center text-[var(--color-sand-dark)] py-12">
            <p className="text-lg italic">"I am the keeper of all knowledge. What do you seek, traveler?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-[var(--color-sand-dark)]/30 text-[var(--color-sand-light)]'
                  : 'bg-[var(--color-sphinx-gold)]/10 text-[var(--color-sphinx-gold)] border border-[var(--color-sphinx-gold)]/20'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="text-xs font-semibold block mb-1 text-[var(--color-sphinx-gold-dim)]">The Sphinx</span>
              )}
              <p className="whitespace-pre-wrap m-0 text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-lg bg-[var(--color-sphinx-gold)]/10 border border-[var(--color-sphinx-gold)]/20">
              <span className="text-[var(--color-sphinx-gold)] animate-pulse">The Sphinx ponders...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Speak to the Sphinx..."
          className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-obsidian-light)] border border-[var(--color-sand-dark)]/30 text-[var(--color-sand-light)] placeholder-[var(--color-sand-dark)] focus:outline-none focus:border-[var(--color-sphinx-gold)]/50"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)] font-semibold rounded-lg hover:bg-[var(--color-sphinx-gold-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
