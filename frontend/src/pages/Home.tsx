import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-5xl font-bold text-[var(--color-sphinx-gold)] mb-6 tracking-wide">
        War of the Sphinx
      </h1>
      <p className="text-xl text-[var(--color-sand-light)] max-w-2xl mb-8 leading-relaxed">
        Enter a world of ancient riddles, mythical realms, and forgotten lore.
        The Sphinx awaits — are you worthy of its wisdom?
      </p>
      <div className="flex gap-4">
        <Link
          to="/chat"
          className="px-8 py-3 bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)] font-semibold rounded-lg no-underline hover:bg-[var(--color-sphinx-gold-dim)] transition-colors"
        >
          Consult the Sphinx
        </Link>
        <Link
          to="/lore"
          className="px-8 py-3 border border-[var(--color-sand)] text-[var(--color-sand)] rounded-lg no-underline hover:bg-[var(--color-sand)]/10 transition-colors"
        >
          Explore Lore
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        {[
          { title: 'Five Realms', desc: 'Explore the Sandstone Citadel, Obsidian Depths, Emerald Canopy, Crystal Spire, and Shadow Veil.' },
          { title: 'Ancient Riddles', desc: 'Test your wit against the Sphinx. Solve riddles to unlock hidden knowledge and quests.' },
          { title: 'Living World', desc: 'New lore, quests, and characters are woven into the world daily by ancient magic.' },
        ].map((card) => (
          <div key={card.title} className="p-6 rounded-lg border border-[var(--color-sand-dark)]/30 bg-[var(--color-obsidian-light)]">
            <h3 className="text-lg font-semibold text-[var(--color-sphinx-gold)] mb-2">{card.title}</h3>
            <p className="text-[var(--color-sand-light)] text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
