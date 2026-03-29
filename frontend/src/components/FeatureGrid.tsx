import { useInView } from './useInView';

const gridStyles = `
@keyframes iconHoverSpin {
  0%   { transform: scale(1) rotate(0deg); }
  50%  { transform: scale(1.15) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.feature-card {
  background: rgba(21,40,40,0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(184,131,74,0.15);
  border-radius: 12px;
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: border-color 0.4s ease;
}
.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(212,145,46,0.05);
  border-color: rgba(212,145,46,0.3);
  background: rgba(21,40,40,0.45);
}
.feature-card:hover .feature-icon {
  animation: iconHoverSpin 0.6s ease-out;
}
.feature-card:hover .feature-glow {
  opacity: 0.15;
}
`;

interface Feature {
  title: string;
  desc: string;
  icon: React.ReactNode;
  glowColor: string;
  imageUrl?: string;
}

const FEATURES: Feature[] = [
  {
    title: 'A World Buried in Sand',
    desc: 'An ancient civilization stirs beneath the desert. Its cities remember what its people have forgotten.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
        {/* Pyramid with inner structure */}
        <polygon points="24,6 42,38 6,38" strokeLinejoin="round" />
        <line x1="24" y1="6" x2="24" y2="38" opacity="0.5" />
        <line x1="15" y1="22" x2="33" y2="22" opacity="0.5" />
        <circle cx="24" cy="28" r="3" opacity="0.6" />
      </svg>
    ),
    glowColor: 'rgba(212,145,46,0.3)',
  },
  {
    title: 'Ancient Riddles',
    desc: 'The Sphinx speaks in puzzles. Every answer opens a door — and every door hides another question.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
        {/* Eye of knowledge */}
        <path d="M4 24 C12 14 20 10 24 10 C28 10 36 14 44 24 C36 34 28 38 24 38 C20 38 12 34 4 24 Z" />
        <circle cx="24" cy="24" r="7" />
        <circle cx="24" cy="24" r="3" fill="var(--color-primary)" opacity="0.4" />
        {/* Rays */}
        <line x1="24" y1="2" x2="24" y2="7" opacity="0.3" />
        <line x1="24" y1="41" x2="24" y2="46" opacity="0.3" />
        <line x1="2" y1="24" x2="7" y2="24" opacity="0.3" />
        <line x1="41" y1="24" x2="46" y2="24" opacity="0.3" />
      </svg>
    ),
    glowColor: 'rgba(43,165,165,0.3)',
  },
  {
    title: 'A War Is Coming',
    desc: 'Power shifts in the dark. Something old is waking, and not everyone will survive what follows.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
        {/* Crossed swords / conflict */}
        <line x1="8" y1="8" x2="40" y2="40" strokeLinecap="round" />
        <line x1="40" y1="8" x2="8" y2="40" strokeLinecap="round" />
        <circle cx="24" cy="24" r="8" opacity="0.5" />
        <circle cx="24" cy="24" r="3" fill="var(--color-primary)" opacity="0.3" />
        {/* Spark lines */}
        <line x1="24" y1="4" x2="24" y2="10" opacity="0.3" />
        <line x1="24" y1="38" x2="24" y2="44" opacity="0.3" />
        <line x1="4" y1="24" x2="10" y2="24" opacity="0.3" />
        <line x1="38" y1="24" x2="44" y2="24" opacity="0.3" />
      </svg>
    ),
    glowColor: 'rgba(196,90,42,0.3)',
  },
];

export function FeatureGrid() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <>
      <style>{gridStyles}</style>
      <section
        ref={ref}
        style={{
          padding: '4rem 1.5rem 5rem',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        {/* Section title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '3rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
              color: 'var(--color-primary)',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}
          >
            What Lies Within
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-sand-dark)',
              letterSpacing: '0.05em',
            }}
          >
            Fragments of a world waiting to be uncovered
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className="feature-card"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
                transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 * i}s`,
              }}
            >
              {/* Background image if available */}
              {feat.imageUrl && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${feat.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '12px',
                      opacity: 0.25,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(13,27,27,0.6) 0%, rgba(13,27,27,0.9) 100%)',
                      borderRadius: '12px',
                    }}
                  />
                </>
              )}

              {/* Background glow */}
              <div
                className="feature-glow"
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${feat.glowColor}, transparent 70%)`,
                  opacity: 0.05,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: 'none',
                }}
              />

              <div className="feature-icon" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                {feat.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  color: 'var(--color-primary)',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  color: 'var(--color-sand)',
                  lineHeight: 1.7,
                  opacity: 0.8,
                }}
              >
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
