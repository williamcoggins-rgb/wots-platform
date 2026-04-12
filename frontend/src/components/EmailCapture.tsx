import { useState, useEffect } from 'react';
import { subscribeEmail, getSiteContent } from '../api';
import { trackAnalyticsEvent } from '../firebase';
import { useInView } from './useInView';
import type { SiteEmailCaptureContent } from '../types';

const DEFAULT_CONTENT: SiteEmailCaptureContent = {
  heading: 'Enter the Archive',
  subheading: 'Be among the first to know when the saga begins.',
  buttonText: 'Subscribe',
  updatedAt: 0,
};

const emailStyles = `
.email-input-field {
  flex: 1;
  padding: 14px 16px;
  background: #222222;
  border: 1px solid #444;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  border-radius: 2px;
  min-width: 0;
}
.email-input-field::placeholder {
  color: #666666;
}
.email-input-field:focus {
  border-color: #E88A1A;
}

.email-submit-btn {
  padding: 14px 28px;
  background: #E88A1A;
  color: #FFFFFF;
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.3s;
  white-space: nowrap;
}
.email-submit-btn:hover {
  background: #F59E2E;
}
.email-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .email-form-row {
    flex-direction: column !important;
  }
}
`;

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { ref, isVisible } = useInView(0.15);
  const [content, setContent] = useState<SiteEmailCaptureContent>(DEFAULT_CONTENT);

  useEffect(() => {
    getSiteContent('email_capture')
      .then((data: SiteEmailCaptureContent | null) => {
        if (data) setContent(data);
      })
      .catch(() => {/* use defaults */});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return;

    setState('loading');
    try {
      const res = await subscribeEmail(trimmed, 'homepage');
      if (res.success) {
        trackAnalyticsEvent('email_signup', { source_page: 'homepage' });
        setState('success');
        setMessage(res.data?.message || 'Welcome, Seeker.');
        setEmail('');
      } else {
        setState('error');
        setMessage(res.error || 'Something went wrong.');
      }
    } catch {
      setState('error');
      setMessage('Connection failed. Please try again.');
    }
  };

  return (
    <>
      <style>{emailStyles}</style>
      <section
        ref={ref}
        style={{
          padding: '5rem 1.5rem',
                      background: 'rgba(26,26,26,0.85)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '2px',
              textTransform: 'uppercase' as const,
              marginBottom: '12px',
              marginTop: 0,
            }}
          >
            {content.heading}
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '16px',
              color: '#999999',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}
          >
            {content.subheading}
          </p>

          {state === 'success' ? (
            <p
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                fontSize: '20px',
                color: '#E88A1A',
                letterSpacing: '1px',
              }}
            >
              Welcome, Seeker.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="email-form-row"
              style={{
                display: 'flex',
                gap: '0',
                maxWidth: '500px',
                margin: '0 auto',
                flexDirection: 'row',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setState('idle'); }}
                placeholder="your@email.com"
                required
                className="email-input-field"
              />
              <button
                type="submit"
                disabled={state === 'loading'}
                className="email-submit-btn"
              >
                {state === 'loading' ? 'Sending...' : content.buttonText.toUpperCase()}
              </button>
            </form>
          )}

          {state === 'error' && (
            <p style={{ color: '#e85d5d', fontSize: '14px', marginTop: '1rem', fontFamily: "'Inter', sans-serif" }}>
              {message}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
