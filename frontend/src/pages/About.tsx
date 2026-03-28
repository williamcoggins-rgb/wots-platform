import { useState, useEffect, useRef } from 'react';

/* ---- Scroll reveal hook ---- */
function useScrollReveal<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function RevealSection({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </div>
  );
}

/* ---- Social icon SVGs ---- */
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.4L20 4h-2l-5.2 6.4L8 4H4z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M9.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        fill="currentColor"
      />
      <path d="M5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3M8 8c1-0.5 2.5-1 4-1s3 .5 4 1M6 9l-1 7 3.5 3h7l3.5-3-1-7" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

/* ---- Styles ---- */
const aboutStyles = [
  '@keyframes progressFill { 0% { width: 0; } 100% { width: 30%; } }',
  '@keyframes progressPulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }',
  '.about-page { max-width: 1000px; margin: 0 auto; padding: 32px 16px 80px; }',
  '.about-split { display: flex; flex-direction: column; gap: 32px; }',
  '@media (min-width: 768px) {',
  '  .about-split { flex-direction: row; gap: 0; }',
  '  .about-split-left, .about-split-right { flex: 1; padding: 0 32px; }',
  '  .about-split-divider { width: 1px; background: linear-gradient(180deg, transparent, var(--color-sphinx-gold), transparent); opacity: 0.3; flex-shrink: 0; }',
  '}',
  '@media (max-width: 767px) {',
  '  .about-split-divider-mobile { height: 1px; background: linear-gradient(90deg, transparent, var(--color-sphinx-gold), transparent); opacity: 0.3; margin: 8px 0; }',
  '}',
  '.progress-bar-track { width: 100%; height: 8px; background: rgba(45,45,68,0.8); border-radius: 4px; overflow: hidden; position: relative; }',
  '.progress-bar-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--color-sphinx-gold-dim), var(--color-sphinx-gold)); animation: progressFill 1.5s ease-out forwards; position: relative; }',
  '.progress-bar-fill::after { content: \'\'; position: absolute; right: 0; top: 0; width: 12px; height: 100%; background: rgba(255,255,255,0.3); border-radius: 4px; animation: progressPulse 2s ease-in-out infinite; }',
  '.social-link { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(184,131,74,0.2); color: var(--color-sand-dark); transition: all 0.3s ease; cursor: pointer; background: transparent; text-decoration: none; }',
  '.social-link:hover { color: var(--color-sphinx-gold); border-color: var(--color-sphinx-gold); box-shadow: 0 0 16px rgba(255,215,0,0.2), 0 0 4px rgba(255,215,0,0.15); }',
  '.timeline-line { position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg, var(--color-sphinx-gold), rgba(184,131,74,0.3), rgba(184,131,74,0.1)); }',
  '.timeline-node { position: relative; padding-left: 44px; padding-bottom: 24px; }',
  '.timeline-dot { position: absolute; left: 8px; top: 4px; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--color-sand-dark); background: var(--color-obsidian); z-index: 1; }',
  '.timeline-dot-active { border-color: var(--color-sphinx-gold); background: var(--color-sphinx-gold); box-shadow: 0 0 10px rgba(255,215,0,0.3); }',
  '.timeline-node-dimmed { opacity: 0.4; }',
].join('\n');

const VOLUMES = [
  { num: 1, label: 'Volume 1', detail: 'In Development', active: true },
  { num: 2, label: 'Volume 2', detail: 'Coming Soon', active: false },
  { num: 3, label: 'Volume 3', detail: 'Coming Soon', active: false },
  { num: 4, label: 'Volume 4', detail: 'Coming Soon', active: false },
  { num: 5, label: 'Volume 5', detail: 'Coming Soon', active: false },
  { num: 6, label: 'Volume 6', detail: 'Coming Soon', active: false },
  { num: 7, label: 'Volume 7', detail: 'Coming Soon', active: false },
];

export function About() {
  return (
    <>
      <style>{aboutStyles}</style>
      <div className="about-page">
        {/* Page title */}
        <RevealSection style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-sphinx-gold)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              margin: 0,
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            About the Project
          </h2>
          <div
            style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, var(--color-sphinx-gold), transparent)',
              maxWidth: 180,
              margin: '12px auto 0',
            }}
          />
        </RevealSection>

        {/* Split layout */}
        <div className="about-split">
          {/* Left: Creator story */}
          <div className="about-split-left">
            <RevealSection>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-sphinx-gold)',
                  fontSize: '1.2rem',
                  letterSpacing: '0.06em',
                  margin: '0 0 16px',
                  fontWeight: 700,
                }}
              >
                About the Creator
              </h3>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'rgba(232,201,160,0.8)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <p style={{ margin: 0 }}>
                  <strong
                    style={{
                      color: 'var(--color-sphinx-gold)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    War of the Sphinx
                  </strong>{' '}
                  is an epic worldbuilding project spanning seven volumes. Ancient civilization collides
                  with modern power, and a single enigmatic voice shapes the fate of all who listen.
                </p>
                <p style={{ margin: 0 }}>
                  This is a universe built from the ground up — its history, geography, people, and the
                  mysteries that bind them. Every detail is crafted with intention. Every riddle has a
                  purpose.
                </p>
                <p style={{ margin: 0 }}>
                  This platform is your gateway into that world. Speak with the Sphinx. Uncover fragments
                  of lore as they surface. Be part of the story before the first volume arrives.
                </p>
                <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-sand-dark)' }}>
                  The Sphinx remembers those who arrived before the war began.
                </p>
              </div>
            </RevealSection>
          </div>

          {/* Divider */}
          <div className="about-split-divider hidden md:block" />
          <div className="about-split-divider-mobile md:hidden" />

          {/* Right: Vision + Timeline */}
          <div className="about-split-right">
            <RevealSection>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-sphinx-gold)',
                  fontSize: '1.2rem',
                  letterSpacing: '0.06em',
                  margin: '0 0 16px',
                  fontWeight: 700,
                }}
              >
                The Vision
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'rgba(232,201,160,0.8)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  margin: '0 0 24px',
                }}
              >
                Seven volumes. One world. A story that rewards those who arrived early and paid
                attention. The journey begins with Volume 1.
              </p>

              {/* Progress bar */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-sphinx-gold)',
                      fontSize: '0.8rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Volume 1: In Development
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-sand-dark)',
                      fontSize: '0.8rem',
                    }}
                  >
                    ~30%
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" />
                </div>
              </div>

              {/* 7-Volume Timeline */}
              <div style={{ position: 'relative', paddingTop: 4 }}>
                <div className="timeline-line" />
                {VOLUMES.map((vol) => (
                  <div
                    key={vol.num}
                    className={`timeline-node ${!vol.active ? 'timeline-node-dimmed' : ''}`}
                  >
                    <div
                      className={`timeline-dot ${vol.active ? 'timeline-dot-active' : ''}`}
                    />
                    <div>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: vol.active
                            ? 'var(--color-sphinx-gold)'
                            : 'var(--color-sand-dark)',
                          fontSize: '0.85rem',
                          letterSpacing: '0.06em',
                          fontWeight: vol.active ? 700 : 400,
                        }}
                      >
                        {vol.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          color: vol.active
                            ? 'var(--color-sand-light)'
                            : 'var(--color-sand-dark)',
                          fontSize: '0.78rem',
                          marginLeft: 10,
                          fontStyle: vol.active ? 'normal' : 'italic',
                        }}
                      >
                        {vol.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>

        {/* Follow the Journey */}
        <RevealSection style={{ textAlign: 'center', marginTop: 56 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-sphinx-gold)',
              fontSize: '1.15rem',
              letterSpacing: '0.06em',
              margin: '0 0 12px',
              fontWeight: 700,
            }}
          >
            Follow the Journey
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-sand-dark)',
              fontSize: '0.9rem',
              margin: '0 0 20px',
              lineHeight: 1.6,
            }}
          >
            War of the Sphinx will launch via Kickstarter. Follow for world teasers and development
            updates.
          </p>

          {/* Social links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <a href="#" className="social-link" aria-label="Twitter / X">
              <TwitterIcon />
            </a>
            <a href="#" className="social-link" aria-label="Discord">
              <DiscordIcon />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <InstagramIcon />
            </a>
          </div>
        </RevealSection>
      </div>
    </>
  );
}
