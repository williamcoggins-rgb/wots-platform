import { useState, useEffect } from 'react';
import { getContent } from '../api';
import type { ContentItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  lore: 'Ancient Lore',
  quest: 'Quests',
  character: 'Characters',
  location: 'Locations',
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
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-sphinx-gold)]">World Lore</h2>
        <p className="text-sm text-[var(--color-sand-dark)]">Fragments of knowledge gathered from across the realms.</p>
      </div>

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            !filter ? 'bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)]' : 'border border-[var(--color-sand-dark)]/30 text-[var(--color-sand)] hover:bg-[var(--color-sand)]/10'
          }`}
        >
          All
        </button>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === key ? 'bg-[var(--color-sphinx-gold)] text-[var(--color-obsidian)]' : 'border border-[var(--color-sand-dark)]/30 text-[var(--color-sand)] hover:bg-[var(--color-sand)]/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--color-sand-dark)]">
          <p className="animate-pulse">Consulting the ancient texts...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-sand-dark)]">
          <p>No lore has been uncovered yet. The world's secrets remain hidden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-lg border border-[var(--color-sand-dark)]/20 bg-[var(--color-obsidian-light)] cursor-pointer hover:border-[var(--color-sphinx-gold)]/30 transition-colors"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[var(--color-sphinx-gold)]">{item.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-[var(--color-sand-dark)]/20 text-[var(--color-sand)]">
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
