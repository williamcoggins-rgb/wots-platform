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

/* ---- Inline SVG: Egyptian Eye for typing indicator ---- */
function SphinxEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 20 Q16 2 32 2 Q48 2 62 20 Q48 38 32 38 Q16 38 2 20Z" />
      <circle cx="32" cy="20" r="10" />
      <circle cx="32" cy="20" r="4" fill="currentColor" />
      <line x1="32" y1="0" x2="32" y2="6" strokeWidth="1" opacity="0.5" />
      <line x1="32" y1="34" x2="32" y2="40" strokeWidth="1" opacity="0.5" />
      <path d="M8 20 L0 18" strokeWidth="1" opacity="0.4" />
      <path d="M56 20 L64 18" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/* ---- Hieroglyph sidebar decorations (desktop only) ---- */
function HieroglyphSidebar() {
  return (
    <div
      style={{
        width: 60,
        minHeight: '100%',
        background: 'linear-gradient(180deg, rgba(13,13,26,0.95) 0%, rgba(26,26,46,0.9) 50%, rgba(13,13,26,0.95) 100%)',
        borderRight: '1px solid rgba(184,131,74,0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 24,
        gap: 28,
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="rgba(212,165,116,0.25)" strokeWidth="1">
        <ellipse cx="16" cy="14" rx="12" ry="7" />
        <circle cx="16" cy="14" r="3" fill="rgba(212,165,116,0.15)" />
        <path d="M10 21 L8 28" />
        <path d="M14 21 L16 26 L18 21" />
      </svg>
      <svg viewBox="0 0 32 40" width="24" height="32" fill="none" stroke="rgba(212,165,116,0.2)" strokeWidth="1.2">
        <ellipse cx="16" cy="10" rx="7" ry="8" />
        <line x1="16" y1="18" x2="16" y2="38" />
        <line x1="8" y1="26" x2="24" y2="26" />
      </svg>
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="rgba(212,165,116,0.2)" strokeWidth="1">
        <path d="M6 24 Q10 12 20 10 Q26 9 28 12" />
        <circle cx="26" cy="10" r="2" fill="rgba(212,165,116,0.12)" />
        <path d="M20 10 Q18 18 10 24" />
        <path d="M10 24 L6 28" />
        <path d="M10 24 L14 28" />
      </svg>
      <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="rgba(212,165,116,0.18)" strokeWidth="1">
        <path d="M16 4 L30 28 L2 28 Z" />
        <line x1="16" y1="4" x2="16" y2="28" opacity="0.4" />
      </svg>
      <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="rgba(212,165,116,0.2)" strokeWidth="1">
        <ellipse cx="16" cy="18" rx="8" ry="10" />
        <path d="M8 14 Q2 8 4 4" />
        <path d="M24 14 Q30 8 28 4" />
        <line x1="12" y1="8" x2="20" y2="8" opacity="0.3" />
      </svg>
      <svg viewBox="0 0 24 40" width="20" height="32" fill="none" stroke="rgba(212,165,116,0.18)" strokeWidth="1">
        <path d="M12 2 Q6 10 6 20 Q6 30 12 38" />
        <path d="M12 2 Q18 10 18 20 Q18 30 12 38" />
        <line x1="12" y1="2" x2="12" y2="38" opacity="0.3" />
      </svg>
    </div>
  );
}

const chatStyles = [
  '@keyframes torchFlicker {',
  '  0%, 100% { opacity: 0.35; }',
  '  25% { opacity: 0.45; }',
  '  50% { opacity: 0.3; }',
  '  75% { opacity: 0.5; }',
  '}',
  '@keyframes torchFlicker2 {',
  '  0%, 100% { opacity: 0.25; }',
  '  30% { opacity: 0.4; }',
  '  60% { opacity: 0.2; }',
  '  85% { opacity: 0.38; }',
  '}',
  '@keyframes hieroglyphScroll {',
  '  0% { background-position: 0 0; }',
  '  100% { background-position: 200px 0; }',
  '}',
  '@keyframes eyePulse {',
  '  0%, 100% { opacity: 0.5; transform: scale(1); }',
  '  50% { opacity: 1; transform: scale(1.08); }',
  '}',
  '.chat-temple-bg {',
  '  position: relative;',
  '  background:',
  '    radial-gradient(ellipse at 10% 10%, rgba(255,160,40,0.06) 0%, transparent 50%),',
  '    radial-gradient(ellipse at 90% 8%, rgba(255,140,30,0.05) 0%, transparent 50%),',
  '    linear-gradient(180deg, rgba(13,13,26,0.98) 0%, rgba(26,26,46,0.95) 40%, rgba(18,18,31,0.98) 100%),',
  '    repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(184,131,74,0.025) 48px, rgba(184,131,74,0.025) 49px),',
  '    repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(184,131,74,0.025) 48px, rgba(184,131,74,0.025) 49px);',
  '}',
  '.chat-temple-bg::before {',
  '  content: \'\'; position: absolute; top: 0; left: 0;',
  '  width: 200px; height: 300px;',
  '  background: radial-gradient(ellipse at center, rgba(255,170,50,0.12), transparent 70%);',
  '  pointer-events: none; animation: torchFlicker 4s ease-in-out infinite; z-index: 0;',
  '}',
  '.chat-temple-bg::after {',
  '  content: \'\'; position: absolute; top: 0; right: 0;',
  '  width: 200px; height: 300px;',
  '  background: radial-gradient(ellipse at center, rgba(255,150,40,0.1), transparent 70%);',
  '  pointer-events: none; animation: torchFlicker2 5s ease-in-out infinite; z-index: 0;',
  '}',
  '.hieroglyph-border {',
  '  height: 3px; opacity: 0.3;',
  '  background: repeating-linear-gradient(90deg,',
  '    var(--color-sphinx-gold-dim) 0px, var(--color-sphinx-gold-dim) 4px,',
  '    transparent 4px, transparent 8px,',
  '    var(--color-sphinx-gold) 8px, var(--color-sphinx-gold) 10px,',
  '    transparent 10px, transparent 16px,',
  '    var(--color-sphinx-gold-dim) 16px, var(--color-sphinx-gold-dim) 18px,',
  '    transparent 18px, transparent 24px);',
  '  animation: hieroglyphScroll 12s linear infinite;',
  '}',
  '.sphinx-eye-pulse { animation: eyePulse 2.5s ease-in-out infinite; }',
  '.stone-tablet-btn {',
  '  clip-path: polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%);',
  '  background: linear-gradient(180deg, rgba(45,45,68,0.9) 0%, rgba(35,35,55,0.95) 100%);',
  '  border: none; cursor: pointer; color: var(--color-sand);',
  '  font-family: var(--font-body); font-size: 0.85rem;',
  '  padding: 14px 12px; min-height: 44px; line-height: 1.3;',
  '  box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3);',
  '  transition: transform 0.25s ease, box-shadow 0.25s ease;',
  '}',
  '.stone-tablet-btn:hover {',
  '  transform: translateY(-4px);',
  '  box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(255,215,0,0.08);',
  '}',
  '.stone-tablet-btn:active { transform: translateY(-2px); }',
  '.msg-assistant {',
  '  background: rgba(245,230,200,0.07); border: 1px solid rgba(245,230,200,0.1);',
  '  border-radius: 12px 12px 12px 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);',
  '}',
  '.msg-user {',
  '  background: rgba(45,45,68,0.6); border: 1px solid rgba(184,131,74,0.12);',
  '  border-radius: 12px 12px 2px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);',
  '}',
  '.chat-input-field:focus { border-color: rgba(255,215,0,0.35) !important; }',
].join('\n');

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
        {
          role: 'assistant',
          content: 'The Sphinx is silent... The connection to the temple has been severed.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const eyeResponsiveStyle = [
    '.sphinx-eye-pulse { width: 56px; height: 36px; color: rgba(255,215,0,0.35); margin-bottom: 20px; }',
    '@media(min-width:768px){ .sphinx-eye-pulse { width: 72px; height: 46px; margin-bottom: 28px; } }',
    '.msg-assistant .sphinx-eye-pulse { width: 36px; height: 22px; color: var(--color-sphinx-gold-dim); }',
  ].join('\n');

  return (
    <>
      <style>{chatStyles}</style>
      <style>{eyeResponsiveStyle}</style>
      <div
        className="chat-temple-bg"
        style={{ display: 'flex', height: 'calc(100dvh - 3.5rem)', overflow: 'hidden' }}
      >
        {/* Desktop hieroglyph sidebar */}
        <div className="hidden md:block">
          <HieroglyphSidebar />
        </div>

        {/* Main chat column */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            minWidth: 0,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', padding: '12px 16px 8px', flexShrink: 0 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-sphinx-gold)',
                fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                margin: 0,
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              The Sphinx Speaks
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-sand-dark)',
                fontSize: '0.8rem',
                margin: '2px 0 0',
                opacity: 0.8,
              }}
            >
              An ancient voice. Choose your words wisely.
            </p>
          </div>

          {/* Animated hieroglyph border */}
          <div className="hieroglyph-border" style={{ margin: '0 16px', flexShrink: 0 }} />

          {/* Messages scroll area */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 12px' }}>
            {/* Empty state */}
            {messages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 16px',
                  textAlign: 'center',
                  minHeight: '60%',
                }}
              >
                <SphinxEye className="sphinx-eye-pulse" />

                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-sand)',
                    fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                    fontStyle: 'italic',
                    lineHeight: 1.7,
                    maxWidth: 420,
                    margin: '0 0 28px',
                  }}
                >
                  &ldquo;I have been here longer than the stones remember.
                  <br />
                  What do you seek, traveler?&rdquo;
                </p>

                {/* Stone tablet starters */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    width: '100%',
                    maxWidth: 420,
                  }}
                >
                  {CONVERSATION_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      onClick={() => handleSend(starter)}
                      className="stone-tablet-btn"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className={msg.role === 'user' ? 'msg-user' : 'msg-assistant'}
                    style={{ maxWidth: '85%', padding: '10px 14px' }}
                  >
                    {msg.role === 'assistant' && (
                      <span
                        style={{
                          display: 'block',
                          fontFamily: 'var(--font-display)',
                          color: 'var(--color-sphinx-gold-dim)',
                          fontSize: '0.7rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        The Sphinx
                      </span>
                    )}
                    <p
                      style={{
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: 1.65,
                        color:
                          msg.role === 'user' ? 'var(--color-sand-light)' : 'var(--color-parchment)',
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator with pulsing eye */}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    className="msg-assistant"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <SphinxEye className="sphinx-eye-pulse" />
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: 'rgba(245,230,200,0.6)',
                        fontSize: '0.78rem',
                        fontStyle: 'italic',
                      }}
                    >
                      The Sphinx contemplates...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input bar */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '8px 12px',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
              flexShrink: 0,
              borderTop: '1px solid rgba(184,131,74,0.1)',
              background: 'rgba(13,13,26,0.6)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Speak to the Sphinx..."
              disabled={loading}
              className="chat-input-field"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(184,131,74,0.15)',
                background: 'var(--color-obsidian-light)',
                color: 'var(--color-sand-light)',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                minHeight: 44,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--color-sphinx-gold)',
                color: 'var(--color-obsidian)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: 'background 0.2s, opacity 0.2s',
                minHeight: 44,
                minWidth: 70,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
