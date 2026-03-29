import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Lore } from './pages/Lore';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Admin } from './pages/Admin';
import { Gallery } from './pages/Gallery';

const LOGO_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/image0_1_avuytq.png';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/chat', label: 'The Sphinx' },
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
   SearchIcon
   ---------------------------------------------------------------- */
function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ----------------------------------------------------------------
   AnimatedRoutes — page transitions
   ---------------------------------------------------------------- */
function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionClass, setTransitionClass] = useState('page-transition-active');

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
      <Routes location={displayLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/lore" element={<Lore />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

/* ----------------------------------------------------------------
   Footer — Clean Marvel-style
   ---------------------------------------------------------------- */
function Footer() {
  const [footerEmail, setFooterEmail] = useState('');
  const [footerState, setFooterState] = useState<'idle' | 'done'>('idle');

  const handleFooterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (footerEmail.trim() && footerEmail.includes('@')) {
      setFooterState('done');
      setFooterEmail('');
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
            <div style={{ backgroundColor: '#111111', display: 'inline-block', marginBottom: '12px' }}>
              <img
                src={LOGO_URL}
                alt="War of the Sphinx"
                style={{ width: '100px', display: 'block', mixBlendMode: 'multiply' }}
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

          {/* Col 3: Social + email signup */}
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
              Connect
            </h4>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <a href="#" aria-label="X / Twitter" style={{ color: '#666666', transition: 'color 200ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
              >
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.4L20 4h-2l-5.2 6.4L8 4H4z" />
                </svg>
              </a>
              <a href="#" aria-label="Discord" style={{ color: '#666666', transition: 'color 200ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
              >
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
                  <path d="M5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3M8 8c1-0.5 2.5-1 4-1s3 .5 4 1M6 9l-1 7 3.5 3h7l3.5-3-1-7" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" style={{ color: '#666666', transition: 'color 200ms' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
              >
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>
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
                    cursor: 'pointer',
                    transition: 'background 200ms',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F59E2E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#E88A1A'; }}
                >
                  Join
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
            &copy; 2026 War of the Sphinx. All rights reserved.
          </p>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* ---- NAVBAR ---- */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 50,
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
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', backgroundColor: '#151515' }}>
            <img src={LOGO_URL} alt="War of the Sphinx" style={{ height: '45px', mixBlendMode: 'multiply' }} />
          </Link>

          {/* Desktop nav links */}
          <div
            style={{
              display: 'flex',
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
            {/* Search icon */}
            <button
              aria-label="Search"
              style={{
                background: 'none',
                border: 'none',
                color: '#999999',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 200ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#999999'; }}
            >
              <SearchIcon />
            </button>
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
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </nav>

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
