import { useState, useEffect } from 'react';
import { useInView } from './useInView';
import { getGalleryImages } from '../api';
import type { GalleryImage } from '../types';

const gridStyles = `
.feature-card-modern {
  background: #222222;
  border-radius: 4px;
  padding: 28px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}
.feature-card-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}
`;

interface Feature {
  title: string;
  desc: string;
  borderColor: string;
  hoverBorderColor: string;
  imageUrl?: string;
}

const FEATURES: Feature[] = [
  {
    title: 'A World Buried in Sand',
    desc: 'An ancient civilization stirs beneath the desert. Its cities remember what its people have forgotten.',
    borderColor: '#E88A1A',
    hoverBorderColor: '#F5A623',
  },
  {
    title: 'Ancient Riddles',
    desc: 'The Sphinx speaks in puzzles. Every answer opens a door — and every door hides another question.',
    borderColor: '#2BA5A5',
    hoverBorderColor: '#3DC0C0',
  },
  {
    title: 'A War Is Coming',
    desc: 'Power shifts in the dark. Something old is waking, and not everyone will survive what follows.',
    borderColor: '#F5C542',
    hoverBorderColor: '#FFD966',
  },
];

export function FeatureGrid() {
  const { ref, isVisible } = useInView(0.1);
  const [envImages, setEnvImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    getGalleryImages('environments')
      .then(setEnvImages)
      .catch(() => {/* use plain background fallbacks */});
  }, []);

  const featuresWithImages = FEATURES.map((feat, i) => {
    const img = envImages[i];
    return img ? { ...feat, imageUrl: img.url } : feat;
  });

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
            transition: 'all 0.8s ease',
          }}
        >
          <h2
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '2px',
              textTransform: 'uppercase' as const,
              margin: 0,
            }}
          >
            Discover
          </h2>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {featuresWithImages.map((feat, i) => (
            <div
              key={feat.title}
              className="feature-card-modern"
              style={{
                borderLeft: `3px solid ${feat.borderColor}`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${0.15 * i}s, transform 0.6s ease ${0.15 * i}s`,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderLeftColor = feat.hoverBorderColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderLeftColor = feat.borderColor;
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
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(34,34,34,0.85)',
                    }}
                  />
                </>
              )}
              <h3
                style={{
                  position: 'relative',
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                  marginTop: 0,
                  marginBottom: '12px',
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  position: 'relative',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  color: '#999999',
                  lineHeight: 1.6,
                  margin: 0,
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
