import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api';
import type { ChatMessage } from '../types';

const USER_ID = 'anonymous-player';

const CONVERSATION_STARTERS = [
  'What is this place?',
  'Who are you?',
  'Tell me about the war',
  'What lies beneath the sand?',
];

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendMessage(msg, USER_ID, sessionId);
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
        { role: 'assistant', content: 'The Sphinx is silent... The connection to the temple has been severed.', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4.5rem)] max-w-3xl mx-auto px-3 py-2 md:p-4">
      {/* Header — compact on mobile */}
      <div className="text-center mb-2 md:mb-4 shrink-0">
        <h2 className="text-xl md:text-3xl font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide">
          The Sphinx Speaks
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-sand-dark)] mt-0.5">
          An ancient voice. Choose your words wisely.
        </p>
      </div>

      {/* Chat container — temple stone texture */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 md:space-y-4 mb-2 md:mb-4 p-3 md:p-6 rounded-lg temple-stone bg-[var(--color-obsidian-deep)] border border-[var(--color-sand-dark)]/15">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
            {/* Sphinx eye icon */}
            <svg viewBox="0 0 64 64" className="w-12 h-12 md:w-16 md:h-16 text-[var(--color-sphinx-gold)]/40 mb-4 md:mb-6" fill="none" stroke="currentColor" strokeWidth="1">
              <ellipse cx="32" cy="32" rx="28" ry="14" />
              <circle cx="32" cy="32" r="8" />
              <circle cx="32" cy="32" r="3" fill="currentColor" />
              <line x1="32" y1="2" x2="32" y2="14" />
              <line x1="32" y1="50" x2="32" y2="62" />
              <line x1="2" y1="32" x2="10" y2="32" />
              <line x1="54" y1="32" x2="62" y2="32" />
            </svg>
            <p className="text-base md:text-lg text-[var(--color-sand)] italic font-[var(--font-body)] leading-relaxed max-w-sm md:max-w-md px-2">
              "I have been here longer than the stones remember.
              What do you seek, traveler?"
            </p>

            {/* Conversation starter pills — 2-col on mobile, wrap on desktop */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 mt-6 md:mt-8 w-full max-w-sm md:max-w-none px-2">
              {CONVERSATION_STARTERS.map((starter) => (
                <button
                  key={starter}
                  onClick={() => handleSend(starter)}
                  className="px-3 md:px-4 py-2.5 md:py-2 text-sm rounded-full border border-[var(--color-sand-dark)]/30 text-[var(--color-sand)] hover:border-[var(--color-sphinx-gold)]/50 hover:text-[var(--color-sphinx-gold)] hover:bg-[var(--color-sphinx-gold)]/5 active:bg-[var(--color-sphinx-gold)]/10 transition-all font-[var(--font-body)]"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2.5 md:py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-[var(--color-sand-dark)]/20 text-[var(--color-sand-light)] border border-[var(--color-sand-dark)]/15'
                  : 'bg-[var(--color-parchment)]/8 text-[var(--color-parchment)] border border-[var(--color-parchment)]/10'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="text-xs font-semibold block mb-1 text-[var(--color-sphinx-gold-dim)] font-[var(--font-display)] tracking-wider uppercase">
                  The Sphinx
                </span>
              )}
              <p className="whitespace-pre-wrap m-0 text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-[var(--color-parchment)]/8 border border-[var(--color-parchment)]/10">
              <span className="text-xs font-semibold block mb-1 text-[var(--color-sphinx-gold-dim)] font-[var(--font-display)] tracking-wider uppercase">
                The Sphinx
              </span>
              <span className="text-[var(--color-parchment)]/70 sphinx-pulse text-sm italic">
                The Sphinx contemplates...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area — safe area padding for PWA */}
      <div className="flex gap-2 shrink-0 pb-[env(safe-area-inset-bottom)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Speak to the Sphinx..."
          className="flex-1 px-3 md:px-4 py-3 rounded-lg bg-[var(--color-obsidian-light)] border border-[var(--color-sand-dark)]/20 text-[var(--color-sand-light)] placeholder-[var(--color-sand-dark)]/60 focus:outline-none focus:border-[var(--color-sphinx-gold)]/40 transition-colors font-[var(--font-body)] text-base"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-4 md:px-6 py-3 bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)] font-semibold rounded-lg hover:bg-[var(--color-sphinx-gold-dim)] active:bg-[var(--color-sphinx-gold-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[var(--font-display)] tracking-wider text-sm uppercase"
        >
          Send
        </button>
      </div>
    </div>
  );
}
