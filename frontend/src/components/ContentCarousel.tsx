import { useRef } from 'react';
import { useInView } from './useInView';

const carouselStyles = `
@keyframes carouselCardIn {
  0%   { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

.carousel-card {
  flex: 0 0 280px;
  height: 400px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
  scroll-snap-align: start;
}
.carousel-card:hover {
  transform: scale(1.05);
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
}
.carousel-card:hover .carousel-overlay {
  opacity: 0.85;
}
.carousel-card:hover .carousel-label {
  transform: translateY(0);
  opacity: 1;
}

@media (max-width: 640px) {
  .carousel-card {
    flex: 0 0 260px;
    height: 360px;
  }
}
`;

const CARDS = [
  {
    title: 'Volume 1 Coming Soon',
    category: 'ANNOUNCEMENT',
    desc: 'The first chapter of an ancient war is about to be written.',
    gradient: 'linear-gradient(135deg, #2a1535 0%, #5c3a1a 50%, #8b6914 100%)',
    iconPath: 'M24 4 L28 16 L40 16 L30 24 L34 36 L24 28 L14 36 L18 24 L8 16 L20 16 Z',
  },
  {
    title: 'Meet the Sphinx',
    category: 'LORE',
    desc: 'A guardian older than memory. Its riddles shape the fate of worlds.',
    gradient: 'linear-gradient(135deg, #1a1028 0%, #2d1b4e 50%, #6b3fa0 100%)',
    iconPath: 'M24 8 C24 8 16 20 16 28 C16 32.4 19.6 36 24 36 C28.4 36 32 32.4 32 28 C32 20 24 8 24 8 Z',
  },
  {
    title: 'The War Begins',
    category: 'STORY',
    desc: 'Ancient powers stir. Lines are drawn in sand and blood.',
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #4a1a1a 50%, #7a2828 100%)',
    iconPath: 'M24 4 L26 18 L40 18 L28 26 L32 40 L24 30 L16 40 L20 26 L8 18 L22 18 Z',
  },
  {
    title: 'Join the Seekers',
    category: 'COMMUNITY',
    desc: 'Knowledge is earned, not given. The worthy will find their way.',
    gradient: 'linear-gradient(135deg, #0a1a1a 0%, #1a3a2a 50%, #2d6b4f 100%)',
    iconPath: 'M24 6 L24 42 M12 24 L36 24 M16 12 L32 36 M32 12 L16 36',
  },
];

export function ContentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: sectionRef, isVisible } = useInView(0.1);

  return (
    <>
      <style>{carouselStyles}</style>
      <section ref={sectionRef} style={{ padding: '5rem 0 4rem', overflow: 'hidden' }}>
        {/* Section title with decorative lines */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '2.5rem',
            padding: '0 1.5rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div
            style={{
              flex: '1',
              maxWidth: '200px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--color-sphinx-gold-dim))',
            }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              color: 'var(--color-sphinx-gold)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Featured
          </h2>
          <div
            style={{
              flex: '1',
              maxWidth: '200px',
              height: '1px',
              background: 'linear-gradient(90deg, var(--color-sphinx-gold-dim), transparent)',
            }}
          />
        </div>

        {/* Horizontal scrolling cards */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '0 2rem 1rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              className="carousel-card"
              style={{
                background: card.gradient,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 * i}s`,
              }}
            >
              {/* Icon */}
              <div style={{ position: 'absolute', top: '2rem', left: '1.5rem', opacity: 0.3 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d={card.iconPath}
                    stroke="var(--color-sphinx-gold)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Overlay gradient (darkens on hover) */}
              <div
                className="carousel-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)',
                  opacity: 0.6,
                  transition: 'opacity 0.4s ease',
                }}
              />

              {/* Content at bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem',
                  zIndex: 2,
                }}
              >
                {/* Category label — slides up on hover */}
                <span
                  className="carousel-label"
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-sphinx-gold)',
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.2)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    marginBottom: '0.75rem',
                    transform: 'translateY(10px)',
                    opacity: 0.6,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {card.category}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    color: 'var(--color-sand-light)',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.03em',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    color: 'var(--color-sand)',
                    opacity: 0.7,
                    lineHeight: 1.5,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
