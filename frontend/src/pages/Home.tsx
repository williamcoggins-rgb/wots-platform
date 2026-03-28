import { HeroSection } from '../components/HeroSection';
import { ContentCarousel } from '../components/ContentCarousel';
import { EmailCapture } from '../components/EmailCapture';
import { FeatureGrid } from '../components/FeatureGrid';
import { SectionDivider } from '../components/SectionDivider';

export function Home() {
  return (
    <div className="grain-overlay" style={{ overflow: 'hidden' }}>
      {/* ── FULL-VIEWPORT HERO ── */}
      <HeroSection />

      {/* ── Divider ── */}
      <SectionDivider />

      {/* ── HORIZONTAL-SCROLL CONTENT CAROUSEL ── */}
      <ContentCarousel />

      {/* ── Divider ── */}
      <SectionDivider />

      {/* ── EMAIL CAPTURE — DRAMATIC FULL-WIDTH BANNER ── */}
      <EmailCapture />

      {/* ── Divider ── */}
      <SectionDivider />

      {/* ── FEATURE GRID ── */}
      <FeatureGrid />

      {/* ── Footer spacer ── */}
      <div
        style={{
          textAlign: 'center',
          padding: '2rem 1rem 4rem',
          opacity: 0.3,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon
            points="16,2 30,28 2,28"
            stroke="var(--color-sphinx-gold)"
            strokeWidth="1"
            fill="none"
          />
          <circle cx="16" cy="18" r="3" stroke="var(--color-sphinx-gold)" strokeWidth="0.8" fill="none" />
        </svg>
      </div>
    </div>
  );
}
