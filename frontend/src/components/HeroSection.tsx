import { useState, useEffect } from 'react';
import { getSiteContent } from '../api';
import type { SiteHeroContent } from '../types';

const LOGO_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/q_auto/f_auto/v1775484956/image0_2_om8az4.png';

const DEFAULT_HERO: SiteHeroContent = {
  tagline: 'The war for an ancient world begins.',
  ctaPrimary: { label: 'Consult the Griot', link: '/chat' },
  ctaSecondary: { label: 'Explore the World', link: '/lore' },
  updatedAt: 0,
};

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
  const [hero, setHero] = useState<SiteHeroContent>(DEFAULT_HERO);

  useEffect(() => {
    getSiteContent('hero')
      .then((data: SiteHeroContent | null) => {
        if (data) setHero(data);
      })
      .catch(() => {/* use defaults */});
  }, []);

  return (
    <>
      <style>{heroStyles}</style>
      <section
        style={{
          position: 'relative',
          width: '100%',

          minHeight: 'calc(100dvh - 60px)',

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,138,26,0.08) 0%, transparent 70%),
                        linear-gradient(180deg, rgba(10,10,10,0.5) 0%, rgba(21,21,21,0.4) 100%)
          `,
        }}
      >
        {/* Center content */}
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
                        padding: '2rem 1.5rem',
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
            {hero.tagline}
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap' as const,
              animation: 'fadeInUp 0.8s ease-out 0.6s forwards',
              opacity: 0,
            }}
          >
            <a
              href={hero.ctaPrimary.link}
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
              {hero.ctaPrimary.label}
            </a>
            <a
              href={hero.ctaSecondary.link}
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
              {hero.ctaSecondary.label}
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
