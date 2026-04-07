import { useRef, useState, useEffect } from 'react';
import { useInView } from './useInView';
import { getGalleryImages, getSiteContent } from '../api';
import type { GalleryImage, SiteFeaturedContent, FeaturedCard } from '../types';

const carouselStyles = `
.carousel-card {
  flex: 0 0 280px;
  height: 380px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  scroll-snap-align: start;
}
.carousel-card:hover {
  transform: scale(1.03);
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
}
.carousel-card:hover .carousel-overlay {
  background: linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.85) 100%);
}
.carousel-scroll::-webkit-scrollbar { display: none; }

@media (max-width: 640px) {
  .carousel-scroll {
    flex-direction: column !important;
    overflow-x: visible !important;
    padding: 0 1rem 1rem !important;
    gap: 1rem !important;
  }
  .carousel-card {
    flex: none !important;
    width: 100% !important;
    height: 220px;
  }
}
`;

interface CarouselCard {
  title: string;
  category: string;
  desc: string;
  gradient: string;
  imageUrl?: string;
}

const DEFAULT_CARDS: CarouselCard[] = [
  {
    title: 'Volume 1 Coming Soon',
    category: 'ANNOUNCEMENT',
    desc: 'The first chapter of an ancient war is about to be written.',
    gradient: 'linear-gradient(160deg, #1a1a1a 0%, #3d2200 60%, #E88A1A 100%)',
  },
  {
    title: 'Meet the Sphinx',
    category: 'LORE',
    desc: 'A guardian older than memory. Its riddles shape the fate of worlds.',
    gradient: 'linear-gradient(160deg, #1a1a1a 0%, #0f3333 60%, #2BA5A5 100%)',
  },
  {
    title: 'The War Begins',
    category: 'STORY',
    desc: 'Ancient powers stir. Lines are drawn in sand and blood.',
    gradient: 'linear-gradient(160deg, #1a1a1a 0%, #3d1515 60%, #c43030 100%)',
  },
  {
    title: 'Join the Seekers',
    category: 'COMMUNITY',
    desc: 'Knowledge is earned, not given. The worthy will find their way.',
    gradient: 'linear-gradient(160deg, #1a1a1a 0%, #1a3d1a 60%, #2e8b2e 100%)',
  },
];

const DEFAULT_CATEGORY_MAP: Record<string, GalleryImage['category']> = {
  'ANNOUNCEMENT': 'covers',
  'LORE': 'characters',
  'STORY': 'hero',
  'COMMUNITY': 'environments',
};

export function ContentCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: sectionRef, isVisible } = useInView(0.1);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [cards, setCards] = useState<CarouselCard[]>(DEFAULT_CARDS);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>(DEFAULT_CATEGORY_MAP);

  useEffect(() => {
    getGalleryImages()
      .then(setGalleryImages)
      .catch(() => {/* use gradient fallbacks */});

    getSiteContent('featured_cards')
      .then((data: SiteFeaturedContent | null) => {
        if (data?.cards?.length) {
          const newCards: CarouselCard[] = data.cards.map((c: FeaturedCard) => ({
            title: c.title,
            category: c.category,
            desc: c.desc,
            gradient: c.gradient,
          }));
          setCards(newCards);
          const newMap: Record<string, string> = {};
          for (const c of data.cards) {
            if (c.imageCategory) {
              newMap[c.category] = c.imageCategory;
            }
          }
          if (Object.keys(newMap).length > 0) {
            setCategoryMap(newMap);
          }
        }
      })
      .catch(() => {/* use default cards */});
  }, []);

  const cardsWithImages = cards.map((card) => {
    const targetCategory = categoryMap[card.category];
    const match = targetCategory
      ? galleryImages.find((img) => img.category === targetCategory)
      : undefined;
    return match ? { ...card, imageUrl: match.url } : card;
  });

  return (
    <>
      <style>{carouselStyles}</style>
      <section ref={sectionRef} style={{ padding: '4rem 0 3rem', overflow: 'hidden' }}>
        {/* Section title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '2.5rem',
            padding: '0 2rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease',
          }}
        >
          <div style={{ flex: 1, maxWidth: '200px', height: '1px', background: 'linear-gradient(90deg, transparent, #333)' }} />
          <h2
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '2px',
              textTransform: 'uppercase' as const,
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            Featured
          </h2>
          <div style={{ flex: 1, maxWidth: '200px', height: '1px', background: 'linear-gradient(90deg, #333, transparent)' }} />
        </div>

        {/* Horizontal scrolling cards */}
        <div
          ref={scrollRef}
          className="carousel-scroll"
          style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '0 2rem 1rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {cardsWithImages.map((card, i) => (
            <div
              key={card.title}
              className="carousel-card"
              tabIndex={0}
              role="article"
              aria-label={card.title}
              style={{
                background: card.imageUrl ? undefined : card.gradient,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.6s ease ${0.1 * i}s, transform 0.6s ease ${0.1 * i}s`,
              }}
            >
              {/* Background image if available */}
              {card.imageUrl && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${card.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Overlay gradient */}
              <div
                className="carousel-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: card.imageUrl
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
                    : 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)',
                  transition: 'background 0.3s ease',
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
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase' as const,
                    color: '#E88A1A',
                    marginBottom: '8px',
                  }}
                >
                  {card.category}
                </span>
                <h3
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '6px',
                    margin: '0 0 6px 0',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: '#999999',
                    lineHeight: 1.5,
                    margin: 0,
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
