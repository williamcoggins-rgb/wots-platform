import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Chat } from './pages/Chat';
import { Lore } from './pages/Lore';
import { Home } from './pages/Home';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-sand-dark)]/30">
          <Link to="/" className="text-xl font-bold text-[var(--color-sphinx-gold)] no-underline tracking-wider">
            ⚔ War of the Sphinx
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-[var(--color-sand-light)] no-underline hover:text-[var(--color-sphinx-gold)] transition-colors">
              Home
            </Link>
            <Link to="/chat" className="text-[var(--color-sand-light)] no-underline hover:text-[var(--color-sphinx-gold)] transition-colors">
              The Sphinx
            </Link>
            <Link to="/lore" className="text-[var(--color-sand-light)] no-underline hover:text-[var(--color-sphinx-gold)] transition-colors">
              Lore
            </Link>
          </div>
        </nav>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/lore" element={<Lore />} />
          </Routes>
        </main>
        <footer className="text-center py-4 text-sm text-[var(--color-sand-dark)] border-t border-[var(--color-sand-dark)]/30">
          War of the Sphinx © 2026 — Powered by Claude
        </footer>
      </div>
    </BrowserRouter>
  );
}
