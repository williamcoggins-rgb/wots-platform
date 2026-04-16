import { HeroSection } from '../components/HeroSection';
import { ContentCarousel } from '../components/ContentCarousel';
import { EmailCapture } from '../components/EmailCapture';
import { FeatureGrid } from '../components/FeatureGrid';
import { SectionDivider } from '../components/SectionDivider';
import { SEO } from '../components/SEO';

export function Home() {
  return (
    <div style={{ overflow: 'hidden' }}>
      <SEO
        title="Home"
        description="War of the Sphinx — a 7-volume Afrofuturist superhero comic set in Neo-Nubia. Explore the lore, speak with The Griot, and be the first to know when Volume 1 drops."
        canonicalPath="/"
      />
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
