import { useState, useEffect, useCallback } from 'react';
import { getGalleryImages } from '../api';
import { trackAnalyticsEvent } from '../firebase';
import type { GalleryImage } from '../types';

const FILTER_TABS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Hero', value: 'hero' },
  { label: 'Characters', value: 'characters' },
  { label: 'Environments', value: 'environments' },
  { label: 'Covers', value: 'covers' },
  { label: 'Misc', value: 'misc' },
];

const galleryStyles = `
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}
@media (max-width: 1024px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .gallery-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
.gallery-card {
  background: rgba(20,20,40,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,215,0,0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.gallery-card:hover {
  transform: translateY(-6px) scale(1.02);
  border-color: rgba(255,215,0,0.3);
  box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.06);
}
.gallery-card:hover .gallery-card-img {
  transform: scale(1.08);
}
.gallery-card-img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  display: block;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.gallery-filter-tabs::-webkit-scrollbar { display: none; }
.gallery-filter-tab {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(184,131,74,0.2);
  border-radius: 6px;
  color: #FFFFFF;
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.gallery-filter-tab:hover {
  border-color: var(--color-sand);
  color: var(--color-sand);
}
.gallery-filter-tab.active {
  background: rgba(255,215,0,0.1);
  border-color: var(--color-gold);
  color: var(--color-gold);
}
.gallery-category-badge {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-gold);
  background: rgba(255,215,0,0.1);
  border: 1px solid rgba(255,215,0,0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: lightboxFadeIn 0.3s ease-out;
}
@keyframes lightboxFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.lightbox-close {
  position: absolute;
  top: max(1rem, env(safe-area-inset-top, 1rem));
  right: 1rem;
  width: 48px;
  height: 48px;
  background: rgba(20,20,40,0.6);
  border: 1px solid rgba(255,215,0,0.2);
  border-radius: 50%;
  color: var(--color-sand);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.lightbox-close:hover {
  background: rgba(255,215,0,0.15);
  border-color: var(--color-gold);
  color: var(--color-gold);
}
`;

export function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const imgs = await getGalleryImages(activeFilter);
      setImages(imgs);
    } catch (err) {
      console.error('Failed to fetch gallery images:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchImages();
    trackAnalyticsEvent('gallery_viewed', { filter: activeFilter || 'all' });
  }, [fetchImages, activeFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <style>{galleryStyles}</style>
      <div
        style={{
          minHeight: '100vh',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem 4rem',
        }}
      >
        {/* Page Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            padding: '2rem 0',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              marginBottom: '0.75rem',
            }}
          >
            The Archives
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 700,
              marginBottom: '1rem',
              lineHeight: 1.1,
              color: '#FFFFFF',
            }}
          >
            Art Gallery
          </h1>
          <div
            style={{
              width: '60px',
              height: '1px',
              margin: '0 auto 1rem',
              background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              color: '#F0C878',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Visions from the world of the Sphinx, rendered in light and shadow.
          </p>

          {/* Filter Tabs */}
          <div
            className="gallery-filter-tabs"
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              marginTop: '1.5rem',
              padding: '0 0 4px',
            }}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.label}
                className={`gallery-filter-tab ${activeFilter === tab.value ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div
              className="sphinx-pulse"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, var(--color-gold), var(--color-gold-dim))',
                margin: '0 auto 1.5rem',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-sand-dark)',
              }}
            >
              Unveiling the archives...
            </p>
          </div>
        ) : images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1.1rem',
                color: 'var(--color-sand-dark)',
              }}
            >
              {activeFilter ? `No ${activeFilter} artwork found.` : 'The gallery awaits its first artwork.'}
            </p>
          </div>
        ) : (
          <div className="gallery-grid">
            {images.map((img, i) => (
              <div
                key={img.id}
                className="gallery-card"
                onClick={() => setLightboxImage(img)}
                style={{
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <img
                    className="gallery-card-img"
                    src={img.url}
                    alt={img.title}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.9rem',
                        color: 'var(--color-sand-light)',
                        letterSpacing: '0.03em',
                        margin: 0,
                        flex: 1,
                        marginRight: '0.5rem',
                      }}
                    >
                      {img.title}
                    </h3>
                    <span className="gallery-category-badge">{img.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxImage && (
          <div
            className="lightbox-overlay"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
              }}
            >
              &times;
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.3rem',
                    color: 'var(--color-sand-light)',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  {lightboxImage.title}
                </h2>
                <span className="gallery-category-badge">{lightboxImage.category}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
