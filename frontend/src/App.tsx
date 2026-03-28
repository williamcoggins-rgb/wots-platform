import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Lore } from './pages/Lore';
import { Home } from './pages/Home';
import { About } from './pages/About';

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[100]"
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--color-gold-dim), var(--color-gold), var(--color-amber))',
        transition: 'width 50ms linear',
      }}
    />
  );
}

const PARTICLE_ANIMATIONS = [
  'particleFloat1', 'particleFloat2', 'particleFloat3', 'particleFloat4', 'particleFloat5',
];

const particles = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${20 + Math.random() * 70}%`,
  size: 2 + Math.random() * 2,
  animation: PARTICLE_ANIMATIONS[i % PARTICLE_ANIMATIONS.length],
  duration: 15 + Math.random() * 15,
  delay: Math.random() * 20,
  opacity: 0.15 + Math.random() * 0.15,
}));

function ParticleField() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.id % 3 === 0
              ? 'var(--color-gold)'
              : p.id % 3 === 1
                ? 'var(--color-sand)'
                : 'var(--color-sand-light)',
            opacity: p.opacity,
            animation: `${p.animation} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative no-underline transition-colors font-[var(--font-display)] text-sm tracking-wider uppercase group"
      style={{
        color: active ? 'var(--color-gold)' : 'rgba(232, 201, 160, 0.7)',
      }}
    >
      <span className="relative z-10 transition-colors duration-200 group-hover:text-[var(--color-gold)]">
        {children}
      </span>
      <span
        className="absolute -bottom-1 left-0 h-[2px] transition-all duration-300 ease-out"
        style={{
          width: active ? '100%' : '0%',
          background: 'linear-gradient(90deg, var(--color-gold), var(--color-amber))',
          opacity: active ? 1 : 0,
        }}
      />
      {!active && (
        <span className="absolute -bottom-1 left-1/2 h-[2px] w-0 group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out bg-[var(--color-gold)]/40" />
      )}
    </Link>
  );
}

function MobileNavLink({ to, children, onClick, index }: { to: string; children: React.ReactNode; onClick: () => void; index: number }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className="no-underline font-[var(--font-display)] text-3xl tracking-widest uppercase transition-all duration-300"
      style={{
        color: active ? 'var(--color-gold)' : 'var(--color-sand-light)',
        animation: `fadeInUp 0.4s ease-out ${index * 0.1}s forwards`,
        opacity: 0,
      }}
    >
      {children}
    </Link>
  );
}

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
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  const barClass = "block absolute left-0 h-[2px] w-6 bg-current transition-all duration-300 ease-out";
  return (
    <div className="relative w-6 h-5">
      <span
        className={barClass}
        style={{
          top: open ? '9px' : '0px',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
        }}
      />
      <span
        className={barClass}
        style={{
          top: '9px',
          opacity: open ? 0 : 1,
          transform: open ? 'translateX(8px)' : 'translateX(0)',
        }}
      />
      <span
        className={barClass}
        style={{
          top: open ? '9px' : '18px',
          transform: open ? 'rotate(-45deg)' : 'rotate(0)',
        }}
      />
    </div>
  );
}

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
    <footer className="relative border-t border-[var(--color-gold)]/10 overflow-hidden bg-[var(--color-obsidian)]">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hieroglyph" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <ellipse cx="20" cy="16" rx="6" ry="8" fill="none" stroke="var(--color-gold)" strokeWidth="1" />
              <line x1="20" y1="24" x2="20" y2="44" stroke="var(--color-gold)" strokeWidth="1" />
              <line x1="12" y1="32" x2="28" y2="32" stroke="var(--color-gold)" strokeWidth="1" />
              <ellipse cx="60" cy="20" rx="10" ry="5" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
              <circle cx="60" cy="20" r="2.5" fill="var(--color-gold)" opacity="0.3" />
              <polyline points="10,60 18,52 26,60 34,52 42,60" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
              <line x1="60" y1="50" x2="60" y2="72" stroke="var(--color-gold)" strokeWidth="0.8" />
              <path d="M56 56 Q60 50 64 56" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
              <path d="M56 64 Q60 58 64 64" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hieroglyph)" />
        </svg>
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-12">
          <div>
            <h4 className="font-[var(--font-display)] text-[var(--color-gold)] text-lg tracking-wider mb-4">About</h4>
            <p className="text-[var(--color-sand)]/80 text-sm leading-relaxed mb-3">
              A seven-volume saga where ancient civilization collides with modern power.
            </p>
            <p className="text-[var(--color-sand-dark)] text-xs italic">A world forged in riddles.</p>
          </div>
          <div>
            <h4 className="font-[var(--font-display)] text-[var(--color-gold)] text-lg tracking-wider mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/chat', label: 'The Sphinx' },
                { to: '/lore', label: 'The World' },
                { to: '/about', label: 'About' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-[var(--color-sand)]/70 hover:text-[var(--color-gold)] transition-colors text-sm no-underline font-[var(--font-display)] tracking-wide uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <h4 className="font-[var(--font-display)] text-[var(--color-gold)] text-lg tracking-wider mb-4">Connect</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-gold)] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.4)] p-1" aria-label="Twitter / X">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.4L20 4h-2l-5.2 6.4L8 4H4z" />
                </svg>
              </a>
              <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-gold)] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.4)] p-1" aria-label="Discord">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
                  <path d="M5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3M8 8c1-0.5 2.5-1 4-1s3 .5 4 1M6 9l-1 7 3.5 3h7l3.5-3-1-7" />
                </svg>
              </a>
              <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-gold)] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.4)] p-1" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>
            {footerState === 'done' ? (
              <p className="text-[var(--color-gold)] text-sm font-[var(--font-display)] tracking-wide">The Archive remembers you.</p>
            ) : (
              <form onSubmit={handleFooterSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 min-w-0 px-3 py-2 rounded bg-[var(--color-obsidian-light)] border border-[var(--color-sand-dark)]/20 text-[var(--color-sand-light)] placeholder-[var(--color-sand-dark)]/50 text-sm focus:outline-none focus:border-[var(--color-gold)]/40 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-obsidian)] font-[var(--font-display)] text-xs tracking-wider uppercase rounded hover:bg-[var(--color-gold-dim)] transition-colors font-semibold whitespace-nowrap"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-[var(--color-gold)]/10 pt-6 text-center">
          <p className="text-[var(--color-gold)]/50 font-[var(--font-display)] tracking-[0.2em] text-sm mb-2">War of the Sphinx</p>
          <p className="text-xs text-[var(--color-sand-dark)]/40">&copy; 2026 War of the Sphinx. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'eye' | 'text' | 'fadeout' | 'done'>('eye');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800);
    const t2 = setTimeout(() => setPhase('fadeout'), 2000);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'var(--color-obsidian)',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: phase === 'fadeout' ? 'none' : 'auto',
      }}
    >
      <div style={{ animation: 'loadingEyeScale 1s ease-out forwards' }}>
        <svg viewBox="0 0 120 80" className="w-28 h-20 md:w-36 md:h-24">
          <ellipse cx="60" cy="40" rx="50" ry="25" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="60" cy="40" rx="42" ry="20" fill="none" stroke="var(--color-gold)" strokeWidth="0.5" opacity="0.3" />
          <defs>
            <radialGradient id="irisGrad">
              <stop offset="0%" stopColor="var(--color-gold)" />
              <stop offset="60%" stopColor="var(--color-gold-dim)" />
              <stop offset="100%" stopColor="var(--color-sand-dark)" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="40" r="14" fill="url(#irisGrad)" opacity="0.9">
            <animate attributeName="r" values="14;15;14" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="40" r="5" fill="var(--color-obsidian)">
            <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
          </circle>
          {[0, 30, -30, 60, -60].map((angle) => (
            <line key={`t${angle}`} x1="60" y1={angle === 0 ? 5 : 8} x2="60" y2={angle === 0 ? 12 : 14} stroke="var(--color-gold)" strokeWidth="0.8" opacity="0.4" transform={`rotate(${angle} 60 40)`} />
          ))}
          {[0, 30, -30, 60, -60].map((angle) => (
            <line key={`b${angle}`} x1="60" y1={angle === 0 ? 75 : 72} x2="60" y2={angle === 0 ? 68 : 66} stroke="var(--color-gold)" strokeWidth="0.8" opacity="0.4" transform={`rotate(${angle} 60 40)`} />
          ))}
        </svg>
      </div>
      <p
        className="font-[var(--font-display)] text-[var(--color-gold)] text-lg tracking-[0.3em] uppercase mt-6"
        style={{
          opacity: phase === 'eye' ? 0 : 1,
          transform: phase === 'eye' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        War of the Sphinx
      </p>
    </div>
  );
}

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollProgress />
      <ParticleField />

      <nav ref={navRef} className="sticky top-0 z-50 glass-heavy border-b border-[var(--color-gold)]/8">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-lg md:text-xl font-bold no-underline tracking-[0.15em] font-[var(--font-display)] group relative">
            <span className="text-[var(--color-gold)] group-hover:text-shimmer transition-all duration-500">War of the Sphinx</span>
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/chat">The Sphinx</NavLink>
            <NavLink to="/lore">The World</NavLink>
            <NavLink to="/about">About</NavLink>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[var(--color-sand-light)] hover:text-[var(--color-gold)] transition-colors relative z-[60]"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </nav>

      <div
        className="fixed inset-0 z-[55] md:hidden flex flex-col items-center justify-center gap-8 transition-all duration-300"
        style={{
          background: 'rgba(10, 10, 20, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        <svg viewBox="0 0 80 40" className="w-16 h-8 mb-4 opacity-30" aria-hidden="true">
          <ellipse cx="40" cy="20" rx="35" ry="16" fill="none" stroke="var(--color-gold)" strokeWidth="1" />
          <circle cx="40" cy="20" r="6" fill="var(--color-gold)" opacity="0.4" />
          <circle cx="40" cy="20" r="2.5" fill="var(--color-obsidian)" />
        </svg>
        <MobileNavLink to="/" onClick={() => setMenuOpen(false)} index={0}>Home</MobileNavLink>
        <MobileNavLink to="/chat" onClick={() => setMenuOpen(false)} index={1}>The Sphinx</MobileNavLink>
        <MobileNavLink to="/lore" onClick={() => setMenuOpen(false)} index={2}>The World</MobileNavLink>
        <MobileNavLink to="/about" onClick={() => setMenuOpen(false)} index={3}>About</MobileNavLink>
      </div>

      <main className="flex-1 relative z-[2]">
        <AnimatedRoutes />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const handleLoadComplete = useCallback(() => setLoaded(true), []);

  return (
    <BrowserRouter>
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease-out' }}>
        <Layout />
      </div>
    </BrowserRouter>
  );
}
