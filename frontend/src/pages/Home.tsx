import { HeroSection } from '../components/HeroSection';
import { ContentCarousel } from '../components/ContentCarousel';
import { EmailCapture } from '../components/EmailCapture';
import { FeatureGrid } from '../components/FeatureGrid';
import { SectionDivider } from '../components/SectionDivider';

export function Home() {
  return (
    <div style={{ overflow: 'hidden' }}>
      {/* FULL-VIEWPORT HERO */}
      <HeroSection />

      <SectionDivider />

      {/* HORIZONTAL-SCROLL CONTENT CAROUSEL */}
      <ContentCarousel />

      <SectionDivider />

      {/* EMAIL CAPTURE */}
      <EmailCapture />

      <SectionDivider />

      {/* FEATURE GRID */}
      <FeatureGrid />

      {/* Footer spacer */}
      <div style={{ height: '4rem' }} />
    </div>
  );
}
