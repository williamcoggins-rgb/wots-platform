import { useState, useEffect } from 'react';
import { getContent } from '../api';
import type { ContentItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  lore: 'Ancient Lore',
  quest: 'Quests',
  character: 'Characters',
  location: 'Locations',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  lore: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14l-8-4-8 4z" />
    </svg>
  ),
  quest: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5z" />
    </svg>
  ),
  character: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
};

const FILTER_ICONS: Record<string, React.ReactNode> = {
  '': (
    <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" />
      <line x1="10" y1="5" x2="10" y2="15" />
      <line x1="5" y1="10" x2="15" y2="10" />
    </svg>
  ),
  lore: TYPE_ICONS.lore,
  quest: TYPE_ICONS.quest,
  character: TYPE_ICONS.character,
  location: TYPE_ICONS.location,
};

export function Lore() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getContent(filter || undefined, 'published')
      .then((res) => {
        if (res.success && res.data) setItems(res.data);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-16">
      <div className="text-center mb-10 mt-4">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide">
          The World of Neo-Nubia
        </h2>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-[var(--color-sphinx-gold)]/50 to-transparent mx-auto my-4" />
        <p className="text-[var(--color-sand-dark)] max-w-lg mx-auto">
          Fragments of knowledge gathered from across the realms.
        </p>
      </div>

      {/* Filter tabs with SVG icons */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {[{ key: '', label: 'All' }, ...Object.entries(TYPE_LABELS).map(([key, label]) => ({ key, label }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all font-[var(--font-display)] tracking-wide ${
              filter === key
                ? 'bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)]'
                : 'border border-[var(--color-sand-dark)]/20 text-[var(--color-sand)] hover:bg-[var(--color-sand)]/10 hover:border-[var(--color-sand-dark)]/40'
            }`}
          >
            {FILTER_ICONS[key]}
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--color-sand-dark)]">
          <p className="sphinx-pulse text-lg italic font-[var(--font-body)]">Consulting the ancient texts...</p>
        </div>
      ) : items.length === 0 ? (
        /* ── EMPTY STATE with fog ── */
        <div className="fog-container text-center py-20 rounded-lg border border-[var(--color-sand-dark)]/10 bg-[var(--color-obsidian-light)]/50">
          <div className="fog-layer" />
          <div className="relative z-10">
            {/* Locked scroll SVG icon */}
            <svg viewBox="0 0 64 64" className="w-20 h-20 mx-auto mb-6 text-[var(--color-sand-dark)]/50" fill="none" stroke="currentColor" strokeWidth="1.2">
              {/* Scroll body */}
              <rect x="16" y="8" width="32" height="42" rx="2" />
              {/* Scroll top curl */}
              <path d="M14 10 C14 6, 18 4, 22 4 L42 4 C46 4, 50 6, 50 10" />
              {/* Scroll bottom curl */}
              <path d="M14 48 C14 52, 18 54, 22 54 L42 54 C46 54, 50 52, 50 48" />
              {/* Text lines */}
              <line x1="22" y1="18" x2="42" y2="18" opacity="0.4" />
              <line x1="22" y1="24" x2="38" y2="24" opacity="0.3" />
              <line x1="22" y1="30" x2="40" y2="30" opacity="0.2" />
              {/* Lock */}
              <rect x="26" y="35" width="12" height="10" rx="1" fill="currentColor" opacity="0.15" />
              <path d="M29 35 V32 C29 29, 35 29, 35 32 V35" />
              <circle cx="32" cy="40" r="1.5" fill="currentColor" opacity="0.3" />
            </svg>
            <p className="text-lg text-[var(--color-sand)] italic font-[var(--font-body)] mb-2">
              "The first fragments surface when the Sphinx speaks."
            </p>
            <p className="text-sm text-[var(--color-sand-dark)]">
              Consult the Sphinx to begin uncovering the world's secrets.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="card-hover p-5 rounded-lg border border-[var(--color-sand-dark)]/15 bg-[var(--color-obsidian-light)] cursor-pointer hover:border-[var(--color-sphinx-gold)]/30"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[var(--color-sphinx-gold)] font-[var(--font-display)] tracking-wide">
                  {item.title}
                </h3>
                <span className="flex items-center text-xs px-2.5 py-1 rounded bg-[var(--color-sand-dark)]/15 text-[var(--color-sand)]">
                  {TYPE_ICONS[item.type]}
                  {TYPE_LABELS[item.type] || item.type}
                </span>
              </div>
              {expanded === item.id ? (
                <p className="text-[var(--color-sand-light)] text-sm leading-relaxed whitespace-pre-wrap">{item.body}</p>
              ) : (
                <p className="text-[var(--color-sand-dark)] text-sm">{item.body.substring(0, 150)}...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
