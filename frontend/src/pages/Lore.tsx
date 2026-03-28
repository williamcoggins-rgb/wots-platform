import { useState, useEffect, useRef } from 'react';
import { getContent } from '../api';
import type { ContentItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  lore: 'Ancient Lore',
  quest: 'Quests',
  character: 'Characters',
  location: 'Locations',
};

/* ── SVG Icon Components ── */
function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}>
      <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14l-8-4-8 4z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}>
      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5z" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"
      style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}>
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="12" y="22" width="24" height="18" rx="3" />
      <path d="M17 22V16a7 7 0 0114 0v6" />
      <circle cx="24" cy="32" r="2.5" fill="currentColor" opacity="0.4" />
      <line x1="24" y1="34.5" x2="24" y2="37" />
    </svg>
  );
}

const TYPE_ICON_MAP: Record<string, () => React.JSX.Element> = {
  lore: BookIcon,
  quest: StarIcon,
  character: PersonIcon,
  location: PinIcon,
};

/* ── IntersectionObserver scroll-reveal hook ── */
function useScrollReveal<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── Reveal wrapper ── */
function RevealSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      {children}
    </div>
  );
}

/* ── Page styles ── */
const loreStyles = `
@keyframes underlineExpand {
  0% { width: 0; }
  100% { width: 100%; }
}
@keyframes fogDriftLore {
  0% { transform: translateX(-15%); opacity: 0.2; }
  50% { transform: translateX(15%); opacity: 0.35; }
  100% { transform: translateX(-15%); opacity: 0.2; }
}
@keyframes fogDriftLoreReverse {
  0% { transform: translateX(15%); opacity: 0.15; }
  50% { transform: translateX(-15%); opacity: 0.3; }
  100% { transform: translateX(15%); opacity: 0.15; }
}

.lore-page { position: relative; min-height: 100vh; overflow: hidden; }

.lore-fog-layer {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
}
.lore-fog-layer::before, .lore-fog-layer::after {
  content: ''; position: absolute; width: 140%; height: 40%;
  border-radius: 50%; filter: blur(60px);
}
.lore-fog-layer::before {
  bottom: -15%; left: -20%;
  background: radial-gradient(ellipse, rgba(232,201,160,0.08), transparent 70%);
  animation: fogDriftLore 16s ease-in-out infinite;
}
.lore-fog-layer::after {
  top: 10%; right: -20%;
  background: radial-gradient(ellipse, rgba(184,131,74,0.06), transparent 70%);
  animation: fogDriftLoreReverse 20s ease-in-out infinite;
}

.lore-title-underline {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-sphinx-gold), transparent);
  margin: 12px auto 0;
  animation: underlineExpand 1.2s ease-out forwards;
  max-width: 200px;
}

.stone-tab {
  padding: 8px 18px;
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid rgba(184,131,74,0.15);
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 4px;
  display: flex;
  align-items: center;
  min-height: 40px;
  background: linear-gradient(180deg, rgba(45,45,68,0.5) 0%, rgba(35,35,55,0.6) 100%),
    repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(184,131,74,0.02) 6px, rgba(184,131,74,0.02) 7px);
}
.stone-tab:hover { border-color: rgba(255,215,0,0.3); background: rgba(45,45,68,0.7); }
.stone-tab-active {
  background: rgba(45,45,68,0.8) !important;
  border-color: var(--color-sphinx-gold) !important;
  color: var(--color-sphinx-gold) !important;
  box-shadow: 0 2px 0 0 var(--color-sphinx-gold), 0 0 12px rgba(255,215,0,0.08);
}

.lore-card {
  background: var(--color-obsidian-light);
  border: 1px solid rgba(184,131,74,0.12);
  border-radius: 8px; padding: 20px; cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.lore-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 16px rgba(255,215,0,0.06);
  border-color: rgba(255,215,0,0.3);
}

.lore-card-expand {
  overflow: hidden;
  transition: max-height 0.4s ease, opacity 0.3s ease;
}

.locked-card {
  position: relative;
  background: var(--color-obsidian-light);
  border: 1px solid rgba(184,131,74,0.08);
  border-radius: 8px; padding: 40px 20px; overflow: hidden;
}
.locked-card::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(13,13,26,0.3) 0%, rgba(13,13,26,0.7) 100%);
  z-index: 1;
}
.locked-card-fog { position: absolute; inset: 0; pointer-events: none; }
.locked-card-fog::before {
  content: ''; position: absolute; width: 120%; height: 100%; left: -10%; top: 0;
  border-radius: 50%; filter: blur(30px);
  background: radial-gradient(ellipse, rgba(184,131,74,0.08), transparent 60%);
  animation: fogDriftLore 10s ease-in-out infinite;
}

.section-reveal-underline {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-sphinx-gold-dim), transparent);
  opacity: 0; width: 0;
  transition: width 0.8s ease, opacity 0.8s ease;
}
.section-reveal-underline.visible { width: 100%; opacity: 0.5; }
`;

export function Lore() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getContent(filter || undefined, 'published')
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const filterTabs = [
    { key: '', label: 'All' },
    { key: 'lore', label: 'Lore' },
    { key: 'quest', label: 'Quests' },
    { key: 'character', label: 'Characters' },
    { key: 'location', label: 'Locations' },
  ];

  return (
    <>
      <style>{loreStyles}</style>
      <div className="lore-page">
        <div className="lore-fog-layer" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '0 16px 80px' }}>
          {/* Page header */}
          <RevealSection style={{ textAlign: 'center', paddingTop: 32, marginBottom: 40 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', color: 'var(--color-sphinx-gold)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: 0, letterSpacing: '0.08em', fontWeight: 700,
            }}>
              World Lore
            </h2>
            <div className="lore-title-underline" />
            <p style={{
              fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)',
              maxWidth: 500, margin: '16px auto 0', fontSize: '0.95rem', lineHeight: 1.6,
            }}>
              Fragments of forgotten knowledge. More surfaces as the Sphinx speaks.
            </p>
          </RevealSection>

          {/* Stone filter tabs */}
          <RevealSection style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
            {filterTabs.map(({ key, label }) => {
              const IconComp = key ? TYPE_ICON_MAP[key] : null;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`stone-tab ${filter === key ? 'stone-tab-active' : ''}`}
                  style={{ color: filter === key ? 'var(--color-sphinx-gold)' : 'var(--color-sand)' }}
                >
                  {IconComp && <IconComp />}
                  {label}
                </button>
              );
            })}
          </RevealSection>

          {/* Content area */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p className="sphinx-pulse" style={{
                fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)',
                fontStyle: 'italic', fontSize: '1.1rem',
              }}>
                Consulting the ancient texts...
              </p>
            </div>
          ) : items.length === 0 ? (
            /* ── Locked empty state ── */
            <RevealSection>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', marginBottom: 32 }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="locked-card">
                    <div className="locked-card-fog" />
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <LockIcon />
                      <span style={{
                        fontFamily: 'var(--font-display)', color: 'var(--color-sand-dark)',
                        fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7,
                      }}>
                        Coming in Volume 1
                      </span>
                    </div>
                    {/* Ghost text lines */}
                    <div style={{ position: 'relative', zIndex: 0, marginTop: 16, opacity: 0.08 }}>
                      <div style={{ height: 8, background: 'var(--color-sand-dark)', borderRadius: 4, marginBottom: 6, width: '80%' }} />
                      <div style={{ height: 8, background: 'var(--color-sand-dark)', borderRadius: 4, marginBottom: 6, width: '60%' }} />
                      <div style={{ height: 8, background: 'var(--color-sand-dark)', borderRadius: 4, width: '70%' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand)', fontStyle: 'italic', fontSize: '1.05rem', marginBottom: 8 }}>
                  &ldquo;The first fragments surface when the Sphinx speaks.&rdquo;
                </p>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)', fontSize: '0.85rem' }}>
                  Consult the Sphinx to begin uncovering the world&apos;s secrets.
                </p>
              </div>
            </RevealSection>
          ) : (
            /* ── Content cards ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item) => {
                const IconComp = TYPE_ICON_MAP[item.type] || BookIcon;
                const isExpanded = expanded === item.id;
                return (
                  <RevealSection key={item.id}>
                    <div className="lore-card" onClick={() => setExpanded(isExpanded ? null : item.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{
                          fontFamily: 'var(--font-display)', color: 'var(--color-sphinx-gold)',
                          fontSize: '1.1rem', margin: 0, letterSpacing: '0.04em', fontWeight: 700,
                        }}>
                          {item.title}
                        </h3>
                        <span style={{
                          display: 'flex', alignItems: 'center', fontSize: '0.72rem', padding: '4px 10px',
                          borderRadius: 4, background: 'rgba(184,131,74,0.1)', color: 'var(--color-sand)',
                          fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase',
                          flexShrink: 0, marginLeft: 12,
                        }}>
                          <IconComp />
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </div>
                      <div className="lore-card-expand" style={{ maxHeight: isExpanded ? 1000 : 48 }}>
                        <p style={{
                          margin: 0, fontSize: '0.9rem', lineHeight: 1.65,
                          color: isExpanded ? 'var(--color-sand-light)' : 'var(--color-sand-dark)',
                          whiteSpace: isExpanded ? 'pre-wrap' : undefined,
                        }}>
                          {isExpanded ? item.body : `${item.body.substring(0, 150)}...`}
                        </p>
                      </div>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          )}

          {/* Sealed Archives section when items exist */}
          {!loading && items.length > 0 && <SealedArchives />}
        </div>
      </div>
    </>
  );
}

function SealedArchives() {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} style={{
      marginTop: 60,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.7s ease, transform 0.7s ease',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', color: 'var(--color-sphinx-gold)',
          fontSize: '1.2rem', margin: 0, letterSpacing: '0.06em',
        }}>
          Sealed Archives
        </h3>
        <div className={`section-reveal-underline ${visible ? 'visible' : ''}`}
          style={{ maxWidth: 120, margin: '8px auto 0' }} />
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {[1, 2].map((n) => (
          <div key={n} className="locked-card">
            <div className="locked-card-fog" />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <LockIcon />
              <span style={{
                fontFamily: 'var(--font-display)', color: 'var(--color-sand-dark)',
                fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6,
              }}>
                Coming in Volume 1
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
