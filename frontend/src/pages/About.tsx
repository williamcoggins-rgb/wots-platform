const aboutStyles = `
@keyframes progressFill {
  0% { width: 0; }
  100% { width: 30%; }
}
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #333333;
  background: rgba(34,34,34,0.85);
  color: #FFFFFF;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
}
.social-link:hover {
  color: #E88A1A;
  border-color: #E88A1A;
  box-shadow: 0 0 12px rgba(232,138,26,0.2);
}
`;

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
      <div
        style={{
          minHeight: '100vh',
          paddingTop: 80,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '0 16px 80px',
          }}
        >
          {/* Section 1: About the Project */}
          <div style={{ marginBottom: 60 }}>
            <h2
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#FFFFFF',
                fontSize: 32,
                margin: '0 0 24px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              ABOUT THE PROJECT
            </h2>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#CCCCCC',
                fontSize: 16,
                lineHeight: 1.7,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#E88A1A', fontFamily: "'Roboto Condensed', sans-serif" }}>
                  War of the Sphinx
                </strong>{' '}
                is an epic worldbuilding project that spans seven volumes. It is a universe built from the
                ground up — its history, geography, people, and the mysteries that bind them together.
              </p>
              <p style={{ margin: 0 }}>
                This platform is your gateway into that world. Speak with the Sphinx. Uncover fragments of
                lore as they surface. Be part of the story before the first volume arrives.
              </p>
              <p style={{ margin: 0 }}>
                Volume 1 is currently in development. Every detail is crafted with intention. Every riddle
                has a purpose.
              </p>
            </div>
          </div>

          {/* Section 2: The Journey — Volume Timeline */}
          <div style={{ marginBottom: 60 }}>
            <h2
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#FFFFFF',
                fontSize: 32,
                margin: '0 0 32px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              THE JOURNEY
            </h2>

            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: '#333333',
                }}
              />

              {VOLUMES.map((vol) => (
                <div
                  key={vol.num}
                  style={{
                    position: 'relative',
                    paddingBottom: vol.num === 7 ? 0 : 24,
                    opacity: vol.active ? 1 : 0.4,
                  }}
                >
                  {/* Circle dot */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -32 + 0,
                      top: 2,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: vol.active ? 'none' : '2px solid #444444',
                      background: vol.active ? '#E88A1A' : 'transparent',
                      boxSizing: 'border-box',
                    }}
                  />

                  <div>
                    <span
                      style={{
                        fontFamily: "'Roboto Condensed', sans-serif",
                        color: vol.active ? '#FFFFFF' : '#666666',
                        fontSize: 15,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {vol.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: vol.active ? '#999999' : '#666666',
                        fontSize: 14,
                        marginLeft: 12,
                      }}
                    >
                      {vol.detail}
                    </span>
                  </div>

                  {/* Progress bar for Volume 1 */}
                  {vol.active && (
                    <div
                      style={{
                        marginTop: 10,
                        maxWidth: 300,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            color: '#999999',
                            fontSize: 12,
                          }}
                        >
                          Progress
                        </span>
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            color: '#999999',
                            fontSize: 12,
                          }}
                        >
                          ~30%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 6,
                          background: '#2A2A2A',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 3,
                            background: '#E88A1A',
                            animation: 'progressFill 1.5s ease-out forwards',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Follow the Journey */}
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#FFFFFF',
                fontSize: 32,
                margin: '0 0 16px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              FOLLOW THE JOURNEY
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#999999',
                fontSize: 16,
                margin: '0 0 8px',
                lineHeight: 1.6,
              }}
            >
              War of the Sphinx will launch via Kickstarter.
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#999999',
                fontSize: 16,
                margin: '0 0 28px',
                lineHeight: 1.6,
              }}
            >
              Follow for world teasers and development updates.
            </p>

            {/* Social links */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
              <a href="#" className="social-link" aria-label="X">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.4L20 4h-2l-5.2 6.4L8 4H4z" />
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Discord">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path
                    d="M9.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                    fill="currentColor"
                  />
                  <path d="M5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3M8 8c1-0.5 2.5-1 4-1s3 .5 4 1M6 9l-1 7 3.5 3h7l3.5-3-1-7" />
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>

            {/* Bottom text */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#666666',
                fontSize: 14,
                fontStyle: 'italic',
              }}
            >
              The Sphinx remembers those who arrived first.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
