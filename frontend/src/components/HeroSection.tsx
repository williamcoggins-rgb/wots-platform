const LOGO_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/image0_1_avuytq.png';

const heroStyles = `
@keyframes scrollBounce {
  0%, 100% { transform: translateY(0) translateX(-50%); }
  50%      { transform: translateY(10px) translateX(-50%); }
}
@keyframes fadeInUp {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

export function HeroSection() {
  return (
    <>
      <style>{heroStyles}</style>
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          minHeight: '600px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,138,26,0.08) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a0a 0%, #151515 100%)
          `,
        }}
      >
        {/* Center content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            padding: '0 1.5rem',
            maxWidth: '800px',
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: '1.5rem', animation: 'fadeInUp 1s ease-out forwards' }}>
            <img
              src={LOGO_URL}
              alt="War of the Sphinx"
              style={{
                maxWidth: '500px',
                width: '85vw',
                display: 'block',
                margin: '0 auto',
                mixBlendMode: 'multiply' as const,
              }}
            />
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '18px',
              color: '#999999',
              fontWeight: 400,
              marginBottom: '2.5rem',
              animation: 'fadeInUp 1s ease-out 0.3s forwards',
              opacity: 0,
            }}
          >
            The war for an ancient world begins.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'fadeInUp 0.8s ease-out 0.6s forwards',
              opacity: 0,
            }}
          >
            <a
              href="/chat"
              style={{
                padding: '14px 32px',
                background: '#E88A1A',
                color: '#FFFFFF',
                fontFamily: "'Roboto Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase' as const,
                borderRadius: '2px',
                textDecoration: 'none',
                transition: 'background 0.3s',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F59E2E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#E88A1A';
              }}
            >
              Consult the Sphinx
            </a>
            <a
              href="/lore"
              style={{
                padding: '14px 32px',
                background: '#2A2A2A',
                color: '#FFFFFF',
                fontFamily: "'Roboto Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px',
                textTransform: 'uppercase' as const,
                borderRadius: '2px',
                textDecoration: 'none',
                transition: 'border-color 0.3s',
                border: '1px solid #444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#888';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#444';
              }}
            >
              Explore the World
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'scrollBounce 2s ease-in-out infinite',
            zIndex: 10,
            opacity: 0.5,
          }}
        >
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
            <path
              d="M2 2 L10 10 L18 2"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>
    </>
  );
}
