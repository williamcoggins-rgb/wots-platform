import { useEffect, useState } from 'react';
import type { GalleryImage } from '../types';
import { getGalleryImages } from '../api';

const LOGO_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/image0_1_avuytq.png';

/* ── inline styles for the hero (keeps everything in one file, no external CSS needed) ── */

const heroStyles = `
@keyframes heroGradientShift {
  0%   { background-position: 50% 100%; }
  50%  { background-position: 50% 60%; }
  100% { background-position: 50% 100%; }
}

@keyframes duneFloat1 {
  0%, 100% { transform: translateY(0) translateX(0); }
  50%      { transform: translateY(-6px) translateX(4px); }
}
@keyframes duneFloat2 {
  0%, 100% { transform: translateY(0) translateX(0); }
  50%      { transform: translateY(-4px) translateX(-6px); }
}

@keyframes particleDrift {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  15%  { opacity: 0.7; }
  85%  { opacity: 0.5; }
  100% { transform: translateY(-120px) translateX(30px); opacity: 0; }
}

@keyframes sphinxEyePulse {
  0%, 100% { box-shadow: 0 0 40px 10px rgba(212,145,46,0.15), 0 0 80px 20px rgba(212,145,46,0.08); transform: scale(1); }
  50%      { box-shadow: 0 0 60px 20px rgba(212,145,46,0.3), 0 0 120px 40px rgba(212,145,46,0.12); transform: scale(1.05); }
}

@keyframes sphinxIrisPulse {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}

@keyframes titleReveal {
  0%   { opacity: 0; transform: translateY(30px); letter-spacing: 0.3em; }
  100% { opacity: 1; transform: translateY(0); letter-spacing: 0.05em; }
}

@keyframes subtitleFade {
  0%   { opacity: 0; transform: translateY(15px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes scrollBounce {
  0%, 100% { transform: translateY(0) translateX(-50%); }
  50%      { transform: translateY(10px) translateX(-50%); }
}

@keyframes pyramidFadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes logoGlow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(212,145,46,0.3)) drop-shadow(0 0 40px rgba(196,90,42,0.15)); }
  50%      { filter: drop-shadow(0 0 30px rgba(212,145,46,0.5)) drop-shadow(0 0 60px rgba(196,90,42,0.25)); }
}

.hero-title-animate {
  animation: titleReveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  opacity: 0;
}
.hero-subtitle-animate {
  animation: subtitleFade 1s ease-out 0.8s forwards;
  opacity: 0;
}
.hero-tagline-animate {
  animation: subtitleFade 1s ease-out 0.5s forwards;
  opacity: 0;
}
.hero-buttons-animate {
  animation: subtitleFade 0.8s ease-out 1.2s forwards;
  opacity: 0;
}
`;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  bottom: `${Math.random() * 40}%`,
  size: 1.5 + Math.random() * 2.5,
  duration: 4 + Math.random() * 6,
  delay: Math.random() * 8,
  opacity: 0.3 + Math.random() * 0.4,
}));

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  const [heroImage, setHeroImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    getGalleryImages('hero')
      .then((imgs) => {
        if (imgs.length > 0) setHeroImage(imgs[0]);
      })
      .catch(() => { /* fallback to CSS gradient */ });
  }, []);

  const parallaxSlow = scrollY * 0.2;
  const parallaxMid = scrollY * 0.4;

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
        }}
      >
        {/* ── BG: Hero image or animated gradient sky ── */}
        {heroImage ? (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${heroImage.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `translateY(${parallaxSlow}px)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(
                  180deg,
                  rgba(5,10,10,0.7) 0%,
                  rgba(13,27,27,0.4) 40%,
                  rgba(13,27,27,0.6) 70%,
                  var(--color-obsidian) 100%
                )`,
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                180deg,
                #050A0A 0%,
                #0D1B1B 25%,
                #152828 45%,
                #2a2010 60%,
                #5c3a1a 78%,
                #8b5a14 92%,
                var(--color-primary-dim) 100%
              )`,
              backgroundSize: '100% 200%',
              animation: 'heroGradientShift 20s ease-in-out infinite',
              transform: `translateY(${parallaxSlow}px)`,
            }}
          />
        )}

        {/* ── Pyramid silhouettes (CSS clip-path) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '5%',
            width: '25%',
            maxWidth: '300px',
            aspectRatio: '2/1',
            background: 'linear-gradient(180deg, rgba(13,27,27,0.9) 0%, rgba(21,40,40,0.7) 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            transform: `translateY(${parallaxSlow}px)`,
            animation: 'pyramidFadeIn 2s ease-out forwards',
            opacity: 0,
            animationDelay: '0.3s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '18%',
            width: '35%',
            maxWidth: '400px',
            aspectRatio: '2.2/1',
            background: 'linear-gradient(180deg, rgba(13,27,27,0.8) 0%, rgba(21,40,40,0.6) 100%)',
            clipPath: 'polygon(45% 0%, 100% 100%, 0% 100%)',
            transform: `translateY(${parallaxSlow}px)`,
            animation: 'pyramidFadeIn 2s ease-out forwards',
            opacity: 0,
            animationDelay: '0.5s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '11%',
            right: '8%',
            width: '20%',
            maxWidth: '220px',
            aspectRatio: '1.8/1',
            background: 'linear-gradient(180deg, rgba(13,27,27,0.7) 0%, rgba(21,40,40,0.5) 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            transform: `translateY(${parallaxSlow}px)`,
            animation: 'pyramidFadeIn 2s ease-out forwards',
            opacity: 0,
            animationDelay: '0.7s',
          }}
        />

        {/* ── Mid layer: Sand dune silhouettes ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-5%',
            width: '110%',
            height: '30%',
            background: 'var(--color-obsidian)',
            clipPath: 'polygon(0% 60%, 8% 45%, 20% 55%, 35% 30%, 50% 50%, 65% 25%, 78% 45%, 90% 35%, 100% 50%, 100% 100%, 0% 100%)',
            transform: `translateY(${parallaxMid}px)`,
            animation: 'duneFloat1 18s ease-in-out infinite',
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-3%',
            width: '106%',
            height: '22%',
            background: 'linear-gradient(180deg, var(--color-obsidian) 0%, var(--color-shadow) 100%)',
            clipPath: 'polygon(0% 70%, 12% 50%, 25% 65%, 40% 40%, 55% 60%, 70% 35%, 85% 55%, 95% 45%, 100% 60%, 100% 100%, 0% 100%)',
            transform: `translateY(${parallaxMid * 0.5}px)`,
            animation: 'duneFloat2 22s ease-in-out infinite',
            zIndex: 3,
          }}
        />

        {/* ── Floating dust particles ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: p.left,
                bottom: p.bottom,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: p.id % 2 === 0
                  ? `radial-gradient(circle, var(--color-primary), var(--color-sand))`
                  : `radial-gradient(circle, var(--color-teal), var(--color-teal-dim))`,
                opacity: p.opacity,
                animation: `particleDrift ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Sphinx eye glow ── */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 5,
          }}
        >
          {/* Outer glow */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,145,46,0.2) 0%, rgba(212,145,46,0.05) 40%, transparent 70%)',
              animation: 'sphinxEyePulse 4s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Iris */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, var(--color-primary), var(--color-primary-dim))',
                animation: 'sphinxIrisPulse 3s ease-in-out infinite',
                boxShadow: '0 0 20px rgba(212,145,46,0.4)',
              }}
            >
              {/* Pupil slit */}
              <div
                style={{
                  width: '3px',
                  height: '16px',
                  margin: '4px auto 0',
                  borderRadius: '2px',
                  background: 'var(--color-shadow)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Center content ── */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            padding: '0 1.5rem',
            maxWidth: '800px',
          }}
        >
          <p
            className="hero-tagline-animate"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'var(--color-sand-dark)',
              marginBottom: '1rem',
            }}
          >
            A World Forged in Riddles
          </p>

          <div className="hero-title-animate" style={{ marginBottom: '1.5rem' }}>
            <img
              src={LOGO_URL}
              alt="War of the Sphinx"
              style={{
                maxWidth: '600px',
                width: '90%',
                animation: 'logoGlow 4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Decorative line */}
          <div
            className="hero-subtitle-animate"
            style={{
              width: '80px',
              height: '1px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
            }}
          />

          <p
            className="hero-subtitle-animate"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
              color: 'var(--color-sand-light)',
              maxWidth: '600px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.7,
            }}
          >
            An ancient voice stirs beneath the sand. A civilization forgotten by time.
            A war that will change everything. Are you ready to listen?
          </p>

          <div className="hero-buttons-animate" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/chat"
              style={{
                padding: '0.875rem 2rem',
                background: 'var(--color-primary)',
                color: 'var(--color-obsidian)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background 0.3s, transform 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-dim)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Consult the Sphinx
            </a>
            <a
              href="/lore"
              style={{
                padding: '0.875rem 2rem',
                border: '1px solid rgba(196,90,42,0.5)',
                color: 'var(--color-sand)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                borderRadius: '8px',
                textDecoration: 'none',
                background: 'transparent',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(196,90,42,0.15)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(196,90,42,0.5)';
              }}
            >
              Explore the World
            </a>
          </div>
        </div>

        {/* ── Scroll indicator ── */}
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'scrollBounce 2s ease-in-out infinite',
            zIndex: 10,
            opacity: 0.6,
          }}
        >
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
            <path
              d="M12 4 L12 20 M6 14 L12 20 L18 14"
              stroke="var(--color-sand)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 22 L12 28 L18 22"
              stroke="var(--color-sand)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />
          </svg>
        </div>
      </section>
    </>
  );
}
