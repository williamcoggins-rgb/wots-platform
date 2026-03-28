import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Lore } from './pages/Lore';
import { Home } from './pages/Home';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
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
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-sand-dark)]/20 bg-[var(--color-obsidian)]/90 backdrop-blur-sm sticky top-0 z-50">
        <Link to="/" className="text-xl font-bold text-[var(--color-sphinx-gold)] no-underline tracking-widest font-[var(--font-display)]">
          War of the Sphinx
        </Link>
        <div className="flex gap-6">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/chat">The Sphinx</NavLink>
          <NavLink to="/lore">The World</NavLink>
          <NavLink to="/about">About</NavLink>
        </div>
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
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-[var(--color-sphinx-gold)]/60 font-[var(--font-display)] tracking-widest text-sm mb-3">
            War of the Sphinx
          </p>
          <p className="text-xs text-[var(--color-sand-dark)] mb-4">
            A world forged in riddles. The Sphinx speaks, and Neo-Nubia listens.
          </p>
          <div className="flex justify-center gap-6 mb-4">
            {/* Social placeholders */}
            <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-sphinx-gold)] transition-colors" aria-label="Twitter / X">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.4L20 4h-2l-5.2 6.4L8 4H4z" />
              </svg>
            </a>
            <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-sphinx-gold)] transition-colors" aria-label="Discord">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.5 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
                <path d="M5.5 16c1.5 2 4 3 6.5 3s5-1 6.5-3M8 8c1-0.5 2.5-1 4-1s3 .5 4 1M6 9l-1 7 3.5 3h7l3.5-3-1-7" />
              </svg>
            </a>
            <a href="#" className="text-[var(--color-sand-dark)] hover:text-[var(--color-sphinx-gold)] transition-colors" aria-label="Instagram">
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
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide mb-6">
        About the World
      </h2>
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--color-sphinx-gold)]/50 to-transparent mx-auto mb-8" />
      <div className="text-left space-y-6 text-[var(--color-sand-light)]/80 leading-relaxed">
        <p>
          <strong className="text-[var(--color-sphinx-gold)] font-[var(--font-display)]">War of the Sphinx</strong> is
          set in Neo-Nubia — a civilization where power, legitimacy, and knowledge flow from a single source: the Sphinx.
        </p>
        <p>
          The Sphinx is not a riddle-machine. It is the griot — the living memory of a civilization,
          the voice that determines who rules and who falls. Those who hold the Sphinx's Mandate hold
          the right to shape the world.
        </p>
        <p>
          Beneath the Five Realms — from the Sandstone Citadel to the Shadow Veil — factions maneuver
          for control. The Order guards ancient traditions. The Council seeks new power. And figures like
          the Fist, the Phantom, the Warden, and Menkh carry their own designs into the struggle.
        </p>
        <p>
          Above them all, the Hidden Ones watch. Their cosmology binds mortal ambition to forces
          older than memory itself.
        </p>
        <p className="text-[var(--color-sand-dark)] italic">
          The world awakens soon. Join the Seekers to be among the first.
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
