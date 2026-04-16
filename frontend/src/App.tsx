import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { subscribeEmail, trackVisit } from './api';
import { trackAnalyticsEvent } from './firebase';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Chat = lazy(() => import('./pages/Chat').then(m => ({ default: m.Chat })));
const Lore = lazy(() => import('./pages/Lore').then(m => ({ default: m.Lore })));
const Gallery = lazy(() => import('./pages/Gallery').then(m => ({ default: m.Gallery })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));

const PAGE_NAMES: Record<string, string> = {
  '/': 'home',
  '/chat': 'chat',
  '/lore': 'lore',
  '/gallery': 'gallery',
  '/about': 'about',
  '/admin': 'admin',
};

const LOGO_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/q_auto/f_auto/v1775484956/image0_2_om8az4.png';
const SITE_BG_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/q_auto/f_auto/v1775489586/image2_gpapbe.jpg';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/chat', label: 'The Griot' },
  { to: '/lore', label: 'The World' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
] as const;

/* ----------------------------------------------------------------
   NavLink — Desktop
   ---------------------------------------------------------------- */
function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        textDecoration: 'none',
        fontFamily: 'var(--font-display)',
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '-0.5px',
        color: active ? '#E88A1A' : '#999999',
        transition: 'color 200ms ease',
        position: 'relative',
        padding: '4px 0',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = '#999999';
      }}
    >
      {children}
      {active && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: 0,
            width: '100%',
            height: '2px',
            background: '#E88A1A',
          }}
        />
      )}
    </Link>
  );
}

/* ----------------------------------------------------------------
   MobileNavLink
   ---------------------------------------------------------------- */
function MobileNavLink({ to, children, onClick, index }: { to: string; children: React.ReactNode; onClick: () => void; index: number }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        textDecoration: 'none',
        fontFamily: 'var(--font-display)',
        fontSize: '2rem',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.5px',
        color: active ? '#E88A1A' : '#FFFFFF',
        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s forwards`,
        opacity: 0,
        transition: 'color 200ms ease',
      }}
    >
      {children}
    </Link>
  );
}

/* ----------------------------------------------------------------
   HamburgerIcon
   ---------------------------------------------------------------- */
function HamburgerIcon({ open }: { open: boolean }) {
  const barStyle: React.CSSProperties = {
    display: 'block',
    position: 'absolute',
    left: 0,
    height: '2px',
    width: '24px',
    background: 'currentColor',
    transition: 'all 300ms ease-out',
  };
  return (
    <div style={{ position: 'relative', width: '24px', height: '20px' }}>
      <span
        style={{
          ...barStyle,
          top: open ? '9px' : '0px',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}
      />
      <span
        style={{
          ...barStyle,
          top: '9px',
          opacity: open ? 0 : 1,
          transform: open ? 'translateX(8px)' : 'translateX(0)',
        }}
      />
      <span
        style={{
          ...barStyle,
          top: open ? '9px' : '18px',
          transform: open ? 'rotate(-45deg)' : 'rotate(0)',
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------
   AnimatedRoutes — page transitions
   ---------------------------------------------------------------- */
function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionClass, setTransitionClass] = useState('page-transition-active');
  const lastTrackedPath = useRef<string | null>(null);

  // Fire page_view + track-visit on every route change (including first load)
  useEffect(() => {
    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

    const pageName = PAGE_NAMES[location.pathname] || location.pathname;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    trackAnalyticsEvent('page_view', { page_name: pageName, referrer });
    trackVisit(location.pathname, referrer);

    // Specific lore_viewed event on top of page_view
    if (location.pathname === '/lore') {
      trackAnalyticsEvent('lore_viewed');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionClass('page-transition-exit');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionClass('page-transition-enter');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionClass('page-transition-active');
          });
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div className={transitionClass}>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#E88A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <Routes location={displayLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/lore" element={<Lore />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </Suspense>
    </div>
  );
}

/* ----------------------------------------------------------------
   Footer — Clean Marvel-style
   ---------------------------------------------------------------- */
function Footer() {
  const [footerEmail, setFooterEmail] = useState('');
  const [footerState, setFooterState] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleFooterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = footerEmail.trim();
    if (!trimmed || !trimmed.includes('@') || footerState === 'loading') return;
    setFooterState('loading');
    try {
      const res = await subscribeEmail(trimmed, 'footer');
      if (res.success) {
        trackAnalyticsEvent('email_signup', { source_page: 'footer' });
        setFooterState('done');
        setFooterEmail('');
      } else {
        setFooterState('idle');
      }
    } catch {
      setFooterState('idle');
    }
  };

  return (
    <footer
      style={{
        background: '#111111',
        borderTop: '1px solid #333333',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px 0',
        }}
      >
        {/* Three column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Col 1: Logo + tagline */}
          <div>
            <div style={{ display: 'inline-block', marginBottom: '12px' }}>
              <img
                src={LOGO_URL}
                alt="War of The Griot"
                style={{ width: '100px', display: 'block' }}
              />
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: '#999999',
                lineHeight: '1.5',
                margin: 0,
              }}
            >
              A seven-volume saga where ancient civilization collides with modern power.
            </p>
          </div>

          {/* Col 2: Quick links */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                marginBottom: '16px',
                marginTop: 0,
              }}
            >
              Quick Links
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    textDecoration: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: '#999999',
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E88A1A'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#999999'; }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3: Email signup */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                marginBottom: '16px',
                marginTop: 0,
              }}
            >
              Stay Updated
            </h4>
            {/* Mini email signup */}
            {footerState === 'done' ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#E88A1A', margin: 0 }}>
                You're subscribed. Stay tuned.
              </p>
            ) : (
              <form onSubmit={handleFooterSubscribe} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: '#1A1A1A',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border-color 200ms',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#E88A1A'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#333333'; }}
                />
                <button
                  type="submit"
                  disabled={footerState === 'loading'}
                  style={{
                    padding: '8px 16px',
                    background: '#E88A1A',
                    color: '#151515',
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: footerState === 'loading' ? 'not-allowed' : 'pointer',
                    opacity: footerState === 'loading' ? 0.6 : 1,
                    transition: 'background 200ms, opacity 200ms',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { if (footerState !== 'loading') (e.currentTarget as HTMLElement).style.background = '#F59E2E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#E88A1A'; }}
                >
                  {footerState === 'loading' ? '…' : 'Join'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid #222222',
            padding: '20px 0',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: '#666666',
              margin: 0,
            }}
          >
            &copy; 2026 War of The Griot. All rights reserved.
          </p>
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
            }}
          >
            <Link
              to="/privacy"
              style={{ textDecoration: 'none', color: '#888888', transition: 'color 200ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E88A1A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#888888'; }}
            >
              Privacy
            </Link>
            <span style={{ color: '#333333' }}>·</span>
            <Link
              to="/terms"
              style={{ textDecoration: 'none', color: '#888888', transition: 'color 200ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E88A1A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#888888'; }}
            >
              Terms
            </Link>
            <span style={{ color: '#333333' }}>·</span>
            <Link
              to="/admin"
              style={{ textDecoration: 'none', color: '#444444', transition: 'color 200ms ease', fontSize: '11px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------
   Layout — Navbar + content + footer
   ---------------------------------------------------------------- */
function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(21,21,21,0.45) 50%, rgba(10,10,10,0.6) 100%), url(${SITE_BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundAttachment: 'fixed' }}>
      {/* ---- HEADER + NAVBAR ---- */}
      <header>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 60,
          background: '#151515',
          borderBottom: '1px solid #333333',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src={LOGO_URL} alt="War of The Griot" style={{ height: '45px' }} />
          </Link>

          {/* Desktop nav links */}
          <div
            style={{
              alignItems: 'center',
              gap: '32px',
            }}
            className="hidden md:flex"
          >
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
            style={{
              background: 'none',
              border: 'none',
              color: menuOpen ? '#FFFFFF' : '#999999',
              cursor: 'pointer',
              padding: '8px',
              position: 'relative',
              zIndex: 60,
              alignItems: 'center',
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </nav>
      </header>

      {/* ---- MOBILE MENU OVERLAY ---- */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 55,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          background: 'rgba(21, 21, 21, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 300ms ease, visibility 300ms ease',
        }}
      >
        {NAV_LINKS.map((link, i) => (
          <MobileNavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)} index={i}>
            {link.label}
          </MobileNavLink>
        ))}
      </div>

      {/* ---- MAIN CONTENT ---- */}
      <main style={{ flex: 1, position: 'relative', zIndex: 2, marginTop: '60px' }}>
        <AnimatedRoutes />
      </main>

      {/* ---- FOOTER ---- */}
      <Footer />
    </div>
  );
}

/* ----------------------------------------------------------------
   App — Root
   ---------------------------------------------------------------- */
export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
