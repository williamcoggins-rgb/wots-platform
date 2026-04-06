import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getSiteContent, updateSiteContent } from '../api';
import type { GalleryImage, SiteHeroContent, SiteEmailCaptureContent, FeaturedCard, DiscoverCard } from '../types';

const CLOUDINARY_CLOUD = 'dcpeomifz';
const CLOUDINARY_PRESET = 'wots_unsigned';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

const CATEGORIES: GalleryImage['category'][] = ['hero', 'characters', 'environments', 'covers', 'misc'];

type AdminTab = 'gallery' | 'site-content';

const defaultHero: SiteHeroContent = {
  tagline: 'The war for an ancient world begins.',
  ctaPrimary: { label: 'Consult the Griot', link: '/chat' },
  ctaSecondary: { label: 'Explore the World', link: '/lore' },
  updatedAt: 0,
};

const defaultFeaturedCard: FeaturedCard = {
  title: '',
  category: '',
  desc: '',
  gradient: '',
  imageCategory: '',
};

const DEFAULT_FEATURED_CARDS: FeaturedCard[] = [
  { title: 'Volume 1 Coming Soon', category: 'Announcement', desc: 'The first chapter of an ancient war is about to be written.', gradient: 'linear-gradient(135deg, rgba(30,60,80,0.85), rgba(20,40,60,0.9))', imageCategory: '' },
  { title: 'Meet the Sphinx', category: 'Lore', desc: 'A guardian older than memory. Its riddles shape the fate of worlds.', gradient: 'linear-gradient(135deg, rgba(20,80,80,0.85), rgba(15,60,60,0.9))', imageCategory: '' },
  { title: 'The War Begins', category: 'Story', desc: 'Ancient powers stir. Lines are drawn in sand and blood.', gradient: 'linear-gradient(135deg, rgba(80,30,40,0.85), rgba(60,20,30,0.9))', imageCategory: '' },
  { title: 'Join the Seekers', category: 'Community', desc: 'Knowledge is earned, not given. The worthy will find their way.', gradient: 'linear-gradient(135deg, rgba(30,70,40,0.85), rgba(20,50,30,0.9))', imageCategory: '' },
];

const defaultDiscoverCard: DiscoverCard = {
  title: '',
  desc: '',
  borderColor: '',
  hoverBorderColor: '',
};

const DEFAULT_DISCOVER_CARDS: DiscoverCard[] = [
  { title: 'A World Buried in Sand', desc: 'An ancient civilization stirs beneath the desert. Its cities remember what its people have forgotten.', borderColor: '#E88A1A', hoverBorderColor: '#F5C542' },
  { title: 'Ancient Riddles', desc: 'The Sphinx speaks in puzzles. Every answer opens a door \u2014 and every door hides another question.', borderColor: '#2BA5A5', hoverBorderColor: '#35BFBF' },
  { title: 'A War is Coming', desc: 'Power shifts in the dark. Something old is waking, and not everyone will survive what follows.', borderColor: '#999999', hoverBorderColor: '#FFFFFF' },
];

const defaultEmailCapture: SiteEmailCaptureContent = {
  heading: 'Enter the Archive',
  subheading: 'Be among the first to know when the saga begins.',
  buttonText: 'Subscribe',
  updatedAt: 0,
};

// Shared CMS input style
const cmsInputStyle: React.CSSProperties = {
  background: '#1A1A1A',
  border: '1px solid #444',
  borderRadius: '2px',
  padding: '10px 12px',
  color: '#FFFFFF',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const cmsLabelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Roboto Condensed', sans-serif",
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#999',
  marginBottom: '6px',
};

const cmsSaveButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: '#E88A1A',
  color: '#FFFFFF',
  fontFamily: "'Roboto Condensed', sans-serif",
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
};

const cmsDangerButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: 'transparent',
  color: '#E05555',
  border: '1px solid #E05555',
  borderRadius: '2px',
  fontFamily: "'Roboto Condensed', sans-serif",
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  fontWeight: 600,
};

const cmsAddButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: 'transparent',
  color: '#E88A1A',
  border: '1px solid #E88A1A',
  borderRadius: '2px',
  fontFamily: "'Roboto Condensed', sans-serif",
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  fontWeight: 600,
};

// Reusable CMS input component
function CmsInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={cmsLabelStyle}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...cmsInputStyle,
          borderColor: focused ? '#E88A1A' : '#444',
        }}
      />
    </div>
  );
}

// Color swatch input
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={cmsLabelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '2px',
            border: '1px solid #444',
            background: value || '#000',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#FFFFFF or rgba(...)"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...cmsInputStyle,
            borderColor: focused ? '#E88A1A' : '#444',
          }}
        />
      </div>
    </div>
  );
}

// Collapsible section
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: '#222222',
        border: '1px solid #333',
        borderRadius: '4px',
        marginBottom: '16px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#E88A1A',
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M4 6L8 10L12 6" stroke="#E88A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  );
}

// Save feedback component
function SaveFeedback({ status }: { status: 'idle' | 'saving' | 'saved' | 'error'; errorMsg?: string }) {
  if (status === 'idle') return null;
  if (status === 'saving') return <span style={{ color: '#999', fontSize: '13px', marginLeft: '12px' }}>Saving...</span>;
  if (status === 'saved') return <span style={{ color: '#4CAF50', fontSize: '13px', marginLeft: '12px' }}>Saved!</span>;
  return null;
}

function SaveError({ message }: { message: string }) {
  if (!message) return null;
  return <span style={{ color: '#E05555', fontSize: '13px', marginLeft: '12px' }}>{message}</span>;
}

// Site Content Editor
function SiteContentEditor() {
  // Hero state
  const [hero, setHero] = useState<SiteHeroContent>({ ...defaultHero });
  const [heroStatus, setHeroStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [heroError, setHeroError] = useState('');

  // Featured cards state
  const [featuredCards, setFeaturedCards] = useState<FeaturedCard[]>(DEFAULT_FEATURED_CARDS.map(c => ({ ...c })));
  const [featuredStatus, setFeaturedStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [featuredError, setFeaturedError] = useState('');

  // Discover cards state
  const [discoverCards, setDiscoverCards] = useState<DiscoverCard[]>(DEFAULT_DISCOVER_CARDS.map(c => ({ ...c })));
  const [discoverStatus, setDiscoverStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [discoverError, setDiscoverError] = useState('');

  // Email capture state
  const [emailCapture, setEmailCapture] = useState<SiteEmailCaptureContent>({ ...defaultEmailCapture });
  const [emailStatus, setEmailStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  const [loading, setLoading] = useState(true);

  // Fetch all sections on mount
  useEffect(() => {
    async function fetchAll() {
      try {
        const [heroData, featuredData, discoverData, emailData] = await Promise.all([
          getSiteContent('hero'),
          getSiteContent('featured_cards'),
          getSiteContent('discover_cards'),
          getSiteContent('email_capture'),
        ]);
        if (heroData) setHero({ ...defaultHero, ...heroData });
        if (featuredData?.cards?.length) setFeaturedCards(featuredData.cards);
        if (discoverData?.cards?.length) setDiscoverCards(discoverData.cards);
        if (emailData) setEmailCapture({ ...defaultEmailCapture, ...emailData });
      } catch (err) {
        console.error('Failed to fetch site content:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Save helpers with auto-fade
  const saveWithFeedback = async (
    section: string,
    data: unknown,
    setStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void,
    setError: (s: string) => void,
  ) => {
    setStatus('saving');
    setError('');
    try {
      await updateSiteContent(section, data);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Save failed');
    }
  };

  // Featured card updater
  const updateFeaturedCard = (index: number, field: keyof FeaturedCard, value: string) => {
    setFeaturedCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  // Discover card updater
  const updateDiscoverCard = (index: number, field: keyof DiscoverCard, value: string) => {
    setDiscoverCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#999', fontFamily: "'Inter', sans-serif" }}>Loading site content...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <CollapsibleSection title="Hero Section" defaultOpen>
        <CmsInput label="Tagline" value={hero.tagline} onChange={(val) => setHero((h) => ({ ...h, tagline: val }))} placeholder="Enter hero tagline..." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <CmsInput
            label="CTA Primary Label"
            value={hero.ctaPrimary.label}
            onChange={(val) => setHero((h) => ({ ...h, ctaPrimary: { ...h.ctaPrimary, label: val } }))}
            placeholder="Button text..."
          />
          <CmsInput
            label="CTA Primary Link"
            value={hero.ctaPrimary.link}
            onChange={(val) => setHero((h) => ({ ...h, ctaPrimary: { ...h.ctaPrimary, link: val } }))}
            placeholder="/path or https://..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <CmsInput
            label="CTA Secondary Label"
            value={hero.ctaSecondary.label}
            onChange={(val) => setHero((h) => ({ ...h, ctaSecondary: { ...h.ctaSecondary, label: val } }))}
            placeholder="Button text..."
          />
          <CmsInput
            label="CTA Secondary Link"
            value={hero.ctaSecondary.link}
            onChange={(val) => setHero((h) => ({ ...h, ctaSecondary: { ...h.ctaSecondary, link: val } }))}
            placeholder="/path or https://..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
          <button
            style={cmsSaveButtonStyle}
            onClick={() => saveWithFeedback('hero', { tagline: hero.tagline, ctaPrimary: hero.ctaPrimary, ctaSecondary: hero.ctaSecondary }, setHeroStatus, setHeroError)}
          >
            Save Changes
          </button>
          <SaveFeedback status={heroStatus} />
          <SaveError message={heroError} />
        </div>
      </CollapsibleSection>

      {/* Featured Cards */}
      <CollapsibleSection title="Featured Cards">
        {featuredCards.map((card, i) => (
          <div
            key={i}
            style={{
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '12px',
              background: '#1A1A1A',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#999', fontFamily: "'Roboto Condensed', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Card {i + 1}
              </span>
              <button
                style={cmsDangerButtonStyle}
                onClick={() => {
                  if (confirm(`Remove card ${i + 1}?`)) {
                    setFeaturedCards((prev) => prev.filter((_, idx) => idx !== i));
                  }
                }}
              >
                Remove
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <CmsInput label="Title" value={card.title} onChange={(val) => updateFeaturedCard(i, 'title', val)} />
              <CmsInput label="Category" value={card.category} onChange={(val) => updateFeaturedCard(i, 'category', val)} />
            </div>
            <CmsInput label="Description" value={card.desc} onChange={(val) => updateFeaturedCard(i, 'desc', val)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <CmsInput label="Gradient" value={card.gradient} onChange={(val) => updateFeaturedCard(i, 'gradient', val)} placeholder="linear-gradient(...)" />
              <CmsInput label="Image Category" value={card.imageCategory} onChange={(val) => updateFeaturedCard(i, 'imageCategory', val)} />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <button style={cmsAddButtonStyle} onClick={() => setFeaturedCards((prev) => [...prev, { ...defaultFeaturedCard }])}>
            Add Card
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
          <button
            style={cmsSaveButtonStyle}
            onClick={() => saveWithFeedback('featured_cards', { cards: featuredCards }, setFeaturedStatus, setFeaturedError)}
          >
            Save Changes
          </button>
          <SaveFeedback status={featuredStatus} />
          <SaveError message={featuredError} />
        </div>
      </CollapsibleSection>

      {/* Discover Cards */}
      <CollapsibleSection title="Discover Cards">
        {discoverCards.map((card, i) => (
          <div
            key={i}
            style={{
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '12px',
              background: '#1A1A1A',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#999', fontFamily: "'Roboto Condensed', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Card {i + 1}
              </span>
              <button
                style={cmsDangerButtonStyle}
                onClick={() => {
                  if (confirm(`Remove card ${i + 1}?`)) {
                    setDiscoverCards((prev) => prev.filter((_, idx) => idx !== i));
                  }
                }}
              >
                Remove
              </button>
            </div>
            <CmsInput label="Title" value={card.title} onChange={(val) => updateDiscoverCard(i, 'title', val)} />
            <CmsInput label="Description" value={card.desc} onChange={(val) => updateDiscoverCard(i, 'desc', val)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ColorInput label="Border Color" value={card.borderColor} onChange={(val) => updateDiscoverCard(i, 'borderColor', val)} />
              <ColorInput label="Hover Border Color" value={card.hoverBorderColor} onChange={(val) => updateDiscoverCard(i, 'hoverBorderColor', val)} />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <button style={cmsAddButtonStyle} onClick={() => setDiscoverCards((prev) => [...prev, { ...defaultDiscoverCard }])}>
            Add Card
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
          <button
            style={cmsSaveButtonStyle}
            onClick={() => saveWithFeedback('discover_cards', { cards: discoverCards }, setDiscoverStatus, setDiscoverError)}
          >
            Save Changes
          </button>
          <SaveFeedback status={discoverStatus} />
          <SaveError message={discoverError} />
        </div>
      </CollapsibleSection>

      {/* Email Capture */}
      <CollapsibleSection title="Email Capture">
        <CmsInput label="Heading" value={emailCapture.heading} onChange={(val) => setEmailCapture((e) => ({ ...e, heading: val }))} placeholder="Main heading..." />
        <CmsInput label="Subheading" value={emailCapture.subheading} onChange={(val) => setEmailCapture((e) => ({ ...e, subheading: val }))} placeholder="Supporting text..." />
        <CmsInput label="Button Text" value={emailCapture.buttonText} onChange={(val) => setEmailCapture((e) => ({ ...e, buttonText: val }))} placeholder="Subscribe" />

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
          <button
            style={cmsSaveButtonStyle}
            onClick={() =>
              saveWithFeedback(
                'email_capture',
                { heading: emailCapture.heading, subheading: emailCapture.subheading, buttonText: emailCapture.buttonText },
                setEmailStatus,
                setEmailError,
              )
            }
          >
            Save Changes
          </button>
          <SaveFeedback status={emailStatus} />
          <SaveError message={emailError} />
        </div>
      </CollapsibleSection>
    </div>
  );
}

const adminStyles = `
.admin-drop-zone {
  border: 2px dashed rgba(255,215,0,0.3);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}
.admin-drop-zone:hover,
.admin-drop-zone.drag-over {
  border-color: var(--color-gold);
  background: rgba(255,215,0,0.05);
  box-shadow: 0 0 30px rgba(255,215,0,0.1);
}
.admin-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(20,20,40,0.6);
  border: 1px solid rgba(184,131,74,0.2);
  border-radius: 8px;
  color: var(--color-sand-light);
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}
.admin-input:focus {
  border-color: var(--color-gold);
}
.admin-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(20,20,40,0.8);
  border: 1px solid rgba(184,131,74,0.2);
  border-radius: 8px;
  color: var(--color-sand-light);
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}
.admin-select:focus {
  border-color: var(--color-gold);
}
.admin-btn {
  padding: 0.75rem 2rem;
  background: var(--color-gold);
  color: var(--color-obsidian);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.admin-btn:hover {
  background: var(--color-gold-dim);
  transform: translateY(-2px);
}
.admin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.admin-btn-danger {
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: var(--color-scarlet);
  border: 1px solid rgba(139,26,26,0.4);
  border-radius: 6px;
  font-family: var(--font-display);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
}
.admin-btn-danger:hover {
  background: rgba(139,26,26,0.15);
  border-color: var(--color-scarlet);
}
.admin-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}
.admin-image-card {
  background: rgba(20,20,40,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,215,0,0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}
.admin-image-card:hover {
  border-color: rgba(255,215,0,0.3);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}
.admin-progress-bar {
  height: 4px;
  background: rgba(255,215,0,0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1rem;
}
.admin-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-gold-dim), var(--color-gold));
  border-radius: 2px;
  transition: width 0.3s ease;
}
.category-badge {
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
@media (max-width: 640px) {
  .admin-image-grid {
    grid-template-columns: 1fr;
  }
  .cms-side-by-side {
    grid-template-columns: 1fr !important;
  }
}
`;

export function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('gallery');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GalleryImage['category']>('misc');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      const col = collection(db, 'gallery_images');
      const q = query(col, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      const imgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as GalleryImage[];
      setImages(imgs);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (jpg, png, webp, gif).');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [title]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_PRESET);

      setUploadProgress(30);

      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Cloudinary upload failed');

      const data = await res.json();
      const secureUrl: string = data.secure_url;

      setUploadProgress(70);

      // Save to Firestore
      await addDoc(collection(db, 'gallery_images'), {
        url: secureUrl,
        title: title.trim(),
        category,
        uploadedAt: Date.now(),
      });

      setUploadProgress(100);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setCategory('misc');

      // Refresh list
      await fetchImages();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Delete this image from the gallery?')) return;
    try {
      await deleteDoc(doc(db, 'gallery_images', imageId));
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete image.');
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <style>{adminStyles}</style>
      <div
        style={{
          minHeight: '100vh',
          padding: '6rem 1.5rem 4rem',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              color: 'var(--color-gold)',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
            }}
          >
            Admin Panel
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-sand-dark)',
            }}
          >
            Manage gallery and site content
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: '#222',
            borderRadius: '4px 4px 0 0',
            marginBottom: '2rem',
            borderBottom: '1px solid #333',
          }}
        >
          {([
            { key: 'gallery' as AdminTab, label: 'Gallery' },
            { key: 'site-content' as AdminTab, label: 'Site Content' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '3px solid #E88A1A' : '3px solid transparent',
                color: activeTab === tab.key ? '#E88A1A' : '#999',
                fontFamily: "'Roboto Condensed', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Tab Content */}
        {activeTab === 'gallery' && (
          <>
            {/* Upload Section */}
            <div
              style={{
                background: 'rgba(20,20,40,0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,215,0,0.1)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '3rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  color: 'var(--color-gold)',
                  letterSpacing: '0.08em',
                  marginBottom: '1.5rem',
                }}
              >
                Upload New Image
              </h2>

              {/* Drop zone */}
              <div
                className={`admin-drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                {previewUrl ? (
                  <div>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        objectFit: 'cover',
                      }}
                    />
                    <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand)', fontSize: '0.9rem' }}>
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                      <path
                        d="M24 8 L24 32 M16 16 L24 8 L32 16"
                        stroke="var(--color-gold)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 28 L8 36 C8 38.2 9.8 40 12 40 L36 40 C38.2 40 40 38.2 40 36 L40 28"
                        stroke="var(--color-gold)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-sand)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      Drag & drop an image here, or click to browse
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Accepts JPG, PNG, WebP, GIF
                    </p>
                  </div>
                )}

                {uploading && (
                  <div className="admin-progress-bar">
                    <div className="admin-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              {/* Form fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--color-sand-dark)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Title
                  </label>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="Image title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--color-sand-dark)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Category
                  </label>
                  <select
                    className="admin-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GalleryImage['category'])}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button
                  className="admin-btn"
                  onClick={handleUpload}
                  disabled={!selectedFile || !title.trim() || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </div>

            {/* Image Management Grid */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  color: 'var(--color-gold)',
                  letterSpacing: '0.08em',
                  marginBottom: '1.5rem',
                }}
              >
                Gallery Images ({images.length})
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div
                    className="sphinx-pulse"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, var(--color-gold), var(--color-gold-dim))',
                      margin: '0 auto 1rem',
                    }}
                  />
                  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)' }}>Loading images...</p>
                </div>
              ) : images.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-sand-dark)', fontSize: '1rem' }}>
                    No images uploaded yet. Upload your first artwork above.
                  </p>
                </div>
              ) : (
                <div className="admin-image-grid">
                  {images.map((img) => (
                    <div key={img.id} className="admin-image-card">
                      <div
                        style={{
                          width: '100%',
                          height: '180px',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
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
                          <span className="category-badge">{img.category}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.75rem',
                              color: 'var(--color-sand-dark)',
                            }}
                          >
                            {formatDate(img.uploadedAt)}
                          </span>
                          <button className="admin-btn-danger" onClick={() => handleDelete(img.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Site Content Tab */}
        {activeTab === 'site-content' && <SiteContentEditor />}
      </div>
    </>
  );
}
