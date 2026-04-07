import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, textToSpeech } from '../api';
import type { ChatMessage } from '../types';

const USER_ID = 'anonymous-player';

const GRIOT_BG_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/q_auto/f_auto/v1775489599/image1_h71sst.jpg';

const CONVERSATION_STARTERS = [
  'What is this place?',
  'Who are you?',
  'Tell me about the war',
  'What lies beneath the sand?',
];

const chatStyles = `
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
.chat-input-field:focus {
  border-color: #E88A1A !important;
}
.starter-pill:hover {
  border-color: #E88A1A !important;
  color: #FFFFFF !important;
}
`;

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSpeak = useCallback(async (text: string, index: number) => {
    // If already playing this message, stop it
    if (playingIndex === index && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIndex(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPlayingIndex(index);
    try {
      const blob = await textToSpeech(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingIndex(null);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingIndex(null);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setPlayingIndex(null);
    }
  }, [playingIndex]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
          content: 'Connection lost. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{chatStyles}</style>
      <div
        style={{
          height: 'calc(100dvh - 60px)',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 800,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 16px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', padding: '16px 0 12px', flexShrink: 0 }}>
            <h2
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#FFFFFF',
                fontSize: 24,
                margin: 0,
                letterSpacing: -0.5,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              THE Griot
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#999999',
                fontSize: 14,
                margin: '4px 0 0',
              }}
            >
              Ask your questions. Choose wisely.
            </p>
          </div>

          {/* Chat container */}
          <div
            ref={chatContainerRef}
            style={{
              flex: 1,
              minHeight: 0,
              backgroundImage: `linear-gradient(180deg, rgba(26,26,26,0.85) 0%, rgba(26,26,26,0.95) 100%), url(${GRIOT_BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center',
              border: '1px solid #333333',
              borderRadius: 4,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 16px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    color: '#666666',
                    fontSize: 20,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    margin: '0 0 32px',
                    letterSpacing: 0.5,
                  }}
                >
                  Ask the Griot anything.
                </p>

                {/* Conversation starters */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    justifyContent: 'center',
                    maxWidth: 500,
                  }}
                >
                  {CONVERSATION_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      onClick={() => handleSend(starter)}
                      className="starter-pill"
                      style={{
                        background: 'rgba(34, 34, 34, 0.85)',
                        border: '1px solid #444444',
                        borderRadius: 2,
                        padding: '10px 16px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        color: '#999999',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, color 0.2s',
                        minHeight: 44,
                      }}
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    maxWidth: '85%',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? '#2A2A2A' : '#222222',
                    borderLeft: msg.role === 'user'
                      ? '3px solid #2BA5A5'
                      : '3px solid #E88A1A',
                    borderRadius: 4,
                    padding: 16,
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span
                        style={{
                          fontFamily: "'Roboto Condensed', sans-serif",
                          color: '#E88A1A',
                          fontSize: 11,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        THE Griot
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSpeak(msg.content, i); }}
                        aria-label={playingIndex === i ? 'Stop audio' : 'Listen to response'}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          color: playingIndex === i ? '#E88A1A' : '#666666',
                          transition: 'color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {playingIndex === i ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: msg.role === 'user' ? '#FFFFFF' : '#DDDDDD',
                    }}
                  >
                    {msg.content}
                  </p>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: 'rgba(34, 34, 34, 0.85)',
                    borderLeft: '3px solid #E88A1A',
                    borderRadius: 4,
                    padding: '16px 20px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: '#666666',
                      fontSize: 14,
                      fontStyle: 'italic',
                    }}
                  >
                    Thinking
                    <span style={{ animation: 'dotPulse 1.4s infinite 0s' }}>.</span>
                    <span style={{ animation: 'dotPulse 1.4s infinite 0.2s' }}>.</span>
                    <span style={{ animation: 'dotPulse 1.4s infinite 0.4s' }}>.</span>
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '12px 0',
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={loading}
              className="chat-input-field"
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 2,
                border: '1px solid #333333',
                background: 'rgba(34, 34, 34, 0.85)',
                color: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.2s',
                minHeight: 44,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                padding: '14px 24px',
                borderRadius: 2,
                border: 'none',
                background: '#E88A1A',
                color: '#FFFFFF',
                fontFamily: "'Roboto Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: 'opacity 0.2s',
                minHeight: 44,
                minWidth: 80,
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
