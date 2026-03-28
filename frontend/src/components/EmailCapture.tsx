import { useState } from 'react';
import { subscribeEmail } from '../api';
import { useInView } from './useInView';

const emailStyles = `
@keyframes goldBorderGlow {
  0%, 100% { box-shadow: inset 0 0 30px rgba(255,215,0,0.05), 0 0 15px rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.2); }
  50%      { box-shadow: inset 0 0 40px rgba(255,215,0,0.08), 0 0 30px rgba(255,215,0,0.2); border-color: rgba(255,215,0,0.4); }
}

@keyframes checkmarkDraw {
  0%   { stroke-dashoffset: 24; opacity: 0; }
  30%  { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}

@keyframes welcomeFade {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.email-section-glow {
  animation: goldBorderGlow 4s ease-in-out infinite;
}

.email-input-field {
  flex: 1;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: var(--color-obsidian);
  border: 1px solid rgba(184,131,74,0.3);
  color: var(--color-sand-light);
  font-family: var(--font-body);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  min-width: 0;
}
.email-input-field::placeholder {
  color: rgba(184,131,74,0.4);
}
.email-input-field:focus {
  border-color: var(--color-sphinx-gold);
  box-shadow: 0 0 20px rgba(255,215,0,0.15);
}

.email-submit-btn {
  padding: 1rem 2rem;
  background: var(--color-sphinx-gold);
  color: var(--color-obsidian);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}
.email-submit-btn:hover {
  background: var(--color-sphinx-gold-dim);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255,215,0,0.3);
}
.email-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
`;

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { ref, isVisible } = useInView(0.15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return;

    setState('loading');
    try {
      const res = await subscribeEmail(trimmed);
      if (res.success) {
        setState('success');
        setMessage(res.data?.message || 'Welcome, Seeker.');
        setEmail('');
      } else {
        setState('error');
        setMessage(res.error || 'The archive rejects this offering.');
      }
    } catch {
      setState('error');
      setMessage('The connection to the archive has been severed.');
    }
  };

  return (
    <>
      <style>{emailStyles}</style>
      <section
        ref={ref}
        style={{
          padding: '5rem 1.5rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          className="email-section-glow"
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
            background: 'linear-gradient(135deg, var(--color-shadow) 0%, var(--color-obsidian) 50%, rgba(26,16,40,0.8) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: '16px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative corner marks */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', width: '20px', height: '20px', borderTop: '1px solid var(--color-sphinx-gold)', borderLeft: '1px solid var(--color-sphinx-gold)', opacity: 0.4 }} />
          <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderTop: '1px solid var(--color-sphinx-gold)', borderRight: '1px solid var(--color-sphinx-gold)', opacity: 0.4 }} />
          <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '20px', height: '20px', borderBottom: '1px solid var(--color-sphinx-gold)', borderLeft: '1px solid var(--color-sphinx-gold)', opacity: 0.4 }} />
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '20px', height: '20px', borderBottom: '1px solid var(--color-sphinx-gold)', borderRight: '1px solid var(--color-sphinx-gold)', opacity: 0.4 }} />

          {/* Eye icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ margin: '0 auto 1.5rem', display: 'block', opacity: 0.8 }}
          >
            <path
              d="M4 24 C10 14, 18 10, 24 10 C30 10, 38 14, 44 24 C38 34, 30 38, 24 38 C18 38, 10 34, 4 24 Z"
              stroke="var(--color-sphinx-gold)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="24" cy="24" r="6" stroke="var(--color-sphinx-gold)" strokeWidth="1.5" fill="rgba(255,215,0,0.1)" />
            <circle cx="24" cy="24" r="2" fill="var(--color-sphinx-gold)" />
          </svg>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: 'var(--color-sphinx-gold)',
              marginBottom: '0.75rem',
              letterSpacing: '0.08em',
            }}
          >
            Enter the Archive
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'var(--color-sand)',
              marginBottom: '2rem',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}
          >
            Be among the first to know when the gates open.
          </p>

          {state === 'success' ? (
            <div
              style={{
                animation: 'welcomeFade 0.6s ease-out forwards',
              }}
            >
              {/* Animated checkmark */}
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 1rem', display: 'block' }}>
                <circle cx="24" cy="24" r="20" stroke="var(--color-sphinx-gold)" strokeWidth="1.5" fill="none" opacity="0.3" />
                <path
                  d="M15 24 L21 30 L33 18"
                  stroke="var(--color-sphinx-gold)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray="24"
                  style={{ animation: 'checkmarkDraw 0.8s ease-out 0.2s forwards', strokeDashoffset: 24, opacity: 0 }}
                />
              </svg>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  color: 'var(--color-sphinx-gold)',
                  letterSpacing: '0.1em',
                }}
              >
                Welcome, Seeker
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--color-sand-dark)',
                  marginTop: '0.5rem',
                }}
              >
                {message}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '0.75rem',
                maxWidth: '500px',
                margin: '0 auto',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setState('idle'); }}
                placeholder="your.name@realm.com"
                required
                className="email-input-field"
                style={{ minWidth: '200px' }}
              />
              <button
                type="submit"
                disabled={state === 'loading'}
                className="email-submit-btn"
              >
                {state === 'loading' ? 'Inscribing...' : 'Join the Seekers'}
              </button>
            </form>
          )}

          {state === 'error' && (
            <p style={{ color: '#e85d5d', fontSize: '0.85rem', marginTop: '1rem', fontFamily: 'var(--font-body)' }}>
              {message}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
