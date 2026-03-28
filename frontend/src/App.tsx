import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Lore } from './pages/Lore';
import { Home } from './pages/Home';

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`no-underline transition-colors font-[var(--font-display)] text-sm tracking-wider uppercase ${
        active
          ? 'text-[var(--color-sphinx-gold)]'
          : 'text-[var(--color-sand-light)]/70 hover:text-[var(--color-sphinx-gold)]'
      }`}
    >
      {children}
    </Link>
  );
}

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-[var(--color-sand-dark)]/20 bg-[var(--color-obsidian)]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
          <Link to="/" className="text-lg md:text-xl font-bold text-[var(--color-sphinx-gold)] no-underline tracking-widest font-[var(--font-display)]">
            War of the Sphinx
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/chat">The Sphinx</NavLink>
            <NavLink to="/lore">The World</NavLink>
            <NavLink to="/about">About</NavLink>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[var(--color-sand-light)] hover:text-[var(--color-sphinx-gold)] transition-colors"
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-4 px-4 pb-4 border-t border-[var(--color-sand-dark)]/10 bg-[var(--color-obsidian)]/95">
            <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/chat" onClick={() => setMenuOpen(false)}>The Sphinx</NavLink>
            <NavLink to="/lore" onClick={() => setMenuOpen(false)}>The World</NavLink>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/lore" element={<Lore />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer className="border-t border-[var(--color-sand-dark)]/15 bg-[var(--color-obsidian-deep)]">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 text-center">
          <p className="text-[var(--color-sphinx-gold)]/60 font-[var(--font-display)] tracking-widest text-sm mb-2">
            War of the Sphinx
          </p>
          <p className="text-xs text-[var(--color-sand-dark)] mb-4">
            A world forged in riddles. The Sphinx speaks, and the world listens.
          </p>
          <div className="flex justify-center gap-6 mb-4">
            <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-sphinx-gold)] transition-colors p-1" aria-label="Twitter / X">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.4L20 4h-2l-5.2 6.4L8 4H4z" />
              </svg>
            </a>
            <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-sphinx-gold)] transition-colors p-1" aria-label="Discord">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
                <path d="M5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3M8 8c1-0.5 2.5-1 4-1s3 .5 4 1M6 9l-1 7 3.5 3h7l3.5-3-1-7" />
              </svg>
            </a>
            <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-sphinx-gold)] transition-colors p-1" aria-label="Instagram">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-[var(--color-sand-dark)]/50">
            © 2026 War of the Sphinx. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide mb-6">
        About the Project
      </h2>
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--color-sphinx-gold)]/50 to-transparent mx-auto mb-8" />
      <div className="text-left space-y-6 text-[var(--color-sand-light)]/80 leading-relaxed">
        <p>
          <strong className="text-[var(--color-sphinx-gold)] font-[var(--font-display)]">War of the Sphinx</strong> is
          an epic worldbuilding project — a seven-volume saga where ancient civilization collides with
          modern power, and a single enigmatic voice shapes the fate of all who listen.
        </p>
        <p>
          Volume 1 is currently in development. The world is being built from the ground up — its history,
          geography, people, and the mysteries that bind them. Every detail is crafted with intention.
        </p>
        <p>
          This platform is your gateway into that world. Speak with the Sphinx. Uncover fragments
          of lore as they surface. Be part of the story before the first volume arrives.
        </p>
        <h3 className="text-xl font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide pt-2">
          The Vision
        </h3>
        <p>
          Seven volumes. One world. A story that rewards those who arrived early and paid attention.
          The Seekers who join now will have access to lore, updates, and early content that won't
          be available once the gates fully open.
        </p>
        <h3 className="text-xl font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide pt-2">
          Follow the Journey
        </h3>
        <p>
          War of the Sphinx will launch via Kickstarter. Join the email list on the homepage to be
          notified first. Follow us on social media for world teasers and development updates.
        </p>
        <p className="text-[var(--color-sand-dark)] italic">
          The Sphinx remembers those who arrived before the war began.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
