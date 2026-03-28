import { useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeEmail } from '../api';

const REALM_CARDS = [
  {
    title: 'Five Realms',
    desc: 'From the sunlit spires of the Sandstone Citadel to the whispering depths of the Shadow Veil — five realms shape the fate of Neo-Nubia.',
    accent: 'from-amber-700/20 to-yellow-900/10',
    border: 'hover:border-[var(--color-sand)]',
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="24,4 44,18 38,40 10,40 4,18" strokeLinejoin="round" />
        <line x1="24" y1="4" x2="24" y2="40" />
        <line x1="4" y1="18" x2="38" y2="40" />
        <line x1="44" y1="18" x2="10" y2="40" />
      </svg>
    ),
  },
  {
    title: 'The Hidden Ones',
    desc: 'Ancient powers move unseen. The cosmology of Neo-Nubia binds mortal ambition to forces older than memory.',
    accent: 'from-emerald-800/20 to-emerald-950/10',
    border: 'hover:border-[var(--color-emerald)]',
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="24" r="18" />
        <circle cx="24" cy="24" r="10" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <line x1="24" y1="6" x2="24" y2="2" />
        <line x1="24" y1="46" x2="24" y2="42" />
        <line x1="6" y1="24" x2="2" y2="24" />
        <line x1="46" y1="24" x2="42" y2="24" />
      </svg>
    ),
  },
  {
    title: 'The Mandate',
    desc: 'The Sphinx does not merely speak — it legitimizes. Those who hold the Mandate hold the right to rule.',
    accent: 'from-purple-900/20 to-indigo-950/10',
    border: 'hover:border-[var(--color-amethyst)]',
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M24 4 L28 16 L40 16 L30 24 L34 36 L24 28 L14 36 L18 24 L8 16 L20 16 Z" strokeLinejoin="round" />
        <circle cx="24" cy="42" r="3" />
        <line x1="24" y1="39" x2="24" y2="36" />
      </svg>
    ),
  },
];

export function Home() {
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return;

    setSubmitState('loading');
    try {
      const res = await subscribeEmail(trimmed);
      if (res.success) {
        setSubmitState('success');
        setSubmitMessage(res.data?.message || 'Welcome, Seeker.');
        setEmail('');
      } else {
        setSubmitState('error');
        setSubmitMessage(res.error || 'The archive rejects this offering.');
      }
    } catch {
      setSubmitState('error');
      setSubmitMessage('The connection to the archive has been severed.');
    }
  };

  return (
    <div className="grain-overlay">
      {/* ── HERO SECTION ── */}
      <section className="relative sandstone-texture overflow-hidden">
        {/* Geometric decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-8 left-8 w-24 h-24 border border-[var(--color-sphinx-gold)]/10 rotate-45" />
          <div className="absolute top-12 left-12 w-16 h-16 border border-[var(--color-sand-dark)]/10 rotate-45" />
          <div className="absolute bottom-8 right-8 w-32 h-32 border border-[var(--color-sphinx-gold)]/8 rotate-12" />
          <div className="absolute top-1/4 right-16 w-px h-32 bg-gradient-to-b from-transparent via-[var(--color-sphinx-gold)]/15 to-transparent" />
          <div className="absolute bottom-1/4 left-16 w-px h-24 bg-gradient-to-b from-transparent via-[var(--color-sand)]/10 to-transparent" />
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center relative z-10">
          <p className="text-xs tracking-[0.4em] uppercase text-[var(--color-sand-dark)] mb-6 font-[var(--font-display)]">
            A World Forged in Riddles
          </p>
          <h1 className="text-shimmer text-5xl md:text-7xl font-bold mb-6 tracking-wide font-[var(--font-display)]">
            War of the Sphinx
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--color-sphinx-gold)] to-transparent mb-6" />
          <p className="text-xl md:text-2xl text-[var(--color-sand-light)] max-w-2xl mb-10 leading-relaxed">
            The Sphinx speaks, and Neo-Nubia listens. Enter a civilization of ancient power,
            buried wisdom, and the struggle for the Mandate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/chat"
              className="px-8 py-3.5 bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)] font-semibold rounded-lg no-underline hover:bg-[var(--color-sphinx-gold-dim)] transition-all font-[var(--font-display)] tracking-wider text-sm uppercase"
            >
              Consult the Sphinx
            </Link>
            <Link
              to="/lore"
              className="px-8 py-3.5 border border-[var(--color-sand)]/40 text-[var(--color-sand)] rounded-lg no-underline hover:bg-[var(--color-sand)]/10 hover:border-[var(--color-sand)] transition-all font-[var(--font-display)] tracking-wider text-sm uppercase"
            >
              Explore the World
            </Link>
          </div>
        </div>
      </section>

      {/* ── EMAIL CAPTURE ── */}
      <section className="relative geo-border-top">
        <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
          <svg viewBox="0 0 48 48" className="w-10 h-10 mx-auto mb-4 text-[var(--color-sphinx-gold)]" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="14" width="36" height="24" rx="2" />
            <path d="M6 14 L24 28 L42 14" />
            <line x1="18" y1="8" x2="30" y2="8" />
            <line x1="22" y1="4" x2="26" y2="4" />
          </svg>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-sphinx-gold)] mb-3 font-[var(--font-display)]">
            Enter the Archive
          </h2>
          <p className="text-[var(--color-sand)] mb-8 max-w-md mx-auto leading-relaxed">
            The Seekers gather knowledge before the world awakens.
            Leave your mark — be among the first to know when the gates open.
          </p>

          {submitState === 'success' ? (
            <div className="py-4 px-6 rounded-lg border border-[var(--color-sphinx-gold)]/30 bg-[var(--color-sphinx-gold)]/5">
              <p className="text-[var(--color-sphinx-gold)] font-[var(--font-display)]">
                {submitMessage}
              </p>
              <p className="text-sm text-[var(--color-sand-dark)] mt-2">The Archive remembers you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto email-glow rounded-lg">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubmitState('idle'); }}
                placeholder="your.name@realm.com"
                required
                className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-obsidian-light)] border border-[var(--color-sand-dark)]/30 text-[var(--color-sand-light)] placeholder-[var(--color-sand-dark)]/60 focus:outline-none focus:border-[var(--color-sphinx-gold)]/50 font-[var(--font-body)]"
              />
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="px-6 py-3 bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)] font-semibold rounded-lg hover:bg-[var(--color-sphinx-gold-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[var(--font-display)] tracking-wider text-sm uppercase whitespace-nowrap"
              >
                {submitState === 'loading' ? 'Inscribing...' : 'Join the Seekers'}
              </button>
            </form>
          )}
          {submitState === 'error' && (
            <p className="text-red-400 text-sm mt-3">{submitMessage}</p>
          )}
        </div>
      </section>

      {/* ── FEATURE / REALM CARDS ── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {REALM_CARDS.map((card) => (
            <div
              key={card.title}
              className={`card-hover geo-border p-7 rounded-lg bg-gradient-to-br ${card.accent} bg-[var(--color-obsidian-light)] ${card.border} transition-colors text-[var(--color-sand)]`}
            >
              {card.icon}
              <h3 className="text-lg font-bold text-[var(--color-sphinx-gold)] mb-2 font-[var(--font-display)] tracking-wide">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-sand-light)]/80">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
