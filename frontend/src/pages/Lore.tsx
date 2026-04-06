import { useState, useEffect } from 'react';
import { getContent } from '../api';
import type { ContentItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  lore: 'Ancient Lore',
  quest: 'Quests',
  character: 'Characters',
  location: 'Locations',
};

const TYPE_COLORS: Record<string, string> = {
  lore: '#E88A1A',
  quest: '#2BA5A5',
  character: '#F5C542',
  location: '#666666',
};

const loreStyles = `
.lore-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 16px;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999999;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.lore-tab:hover {
  color: #FFFFFF;
}
.lore-tab-active {
  color: #E88A1A !important;
  border-bottom-color: #E88A1A !important;
}
.lore-card {
  background: rgba(34,34,34,0.85);
  border-radius: 4px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.lore-card:hover {
  transform: translateY(-2px);
}
`;

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

  const filterTabs = [
    { key: '', label: 'All' },
    { key: 'lore', label: 'Ancient Lore' },
    { key: 'quest', label: 'Quests' },
    { key: 'character', label: 'Characters' },
    { key: 'location', label: 'Locations' },
  ];

  return (
    <>
      <style>{loreStyles}</style>
      <div
        style={{
                    minHeight: '100vh',
          paddingTop: 80,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 16px 80px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#FFFFFF',
                fontSize: 36,
                margin: 0,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
              }}
            >
              THE WORLD
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#999999',
                fontSize: 16,
                margin: '8px 0 0',
              }}
            >
              Fragments of forgotten knowledge.
            </p>
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              marginBottom: 36,
              flexWrap: 'wrap',
              borderBottom: '1px solid #333333',
            }}
          >
            {filterTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`lore-tab ${filter === key ? 'lore-tab-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content area */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: '#666666',
                  fontSize: 16,
                }}
              >
                Loading...
              </p>
            </div>
          ) : items.length === 0 ? (
            /* Empty / locked state */
            <div>
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  marginBottom: 32,
                }}
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: 'rgba(26,26,26,0.85)',
                      borderRadius: 4,
                      padding: '40px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {/* Lock icon */}
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="#666666"
                      strokeWidth="1.5"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "'Roboto Condensed', sans-serif",
                        color: '#666666',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}
                    >
                      Coming in Volume 1
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#999999',
                    fontSize: 15,
                    marginBottom: 8,
                  }}
                >
                  Content will surface as the world unfolds.
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: '#666666',
                    fontSize: 14,
                  }}
                >
                  Consult the Sphinx to begin uncovering secrets.
                </p>
              </div>
            </div>
          ) : (
            /* Content cards */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item) => {
                const isExpanded = expanded === item.id;
                const borderColor = TYPE_COLORS[item.type] || '#666666';
                return (
                  <div
                    key={item.id}
                    className="lore-card"
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    style={{
                      borderLeft: `3px solid ${borderColor}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Roboto Condensed', sans-serif",
                          color: '#FFFFFF',
                          fontSize: 18,
                          margin: 0,
                          fontWeight: 700,
                        }}
                      >
                        {item.title}
                      </h3>
                      <span
                        style={{
                          fontFamily: "'Roboto Condensed', sans-serif",
                          fontSize: 11,
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: borderColor,
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </div>
                    <div
                      style={{
                        overflow: 'hidden',
                        maxHeight: isExpanded ? 1000 : 48,
                        transition: 'max-height 0.4s ease',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: '#999999',
                          whiteSpace: isExpanded ? 'pre-wrap' : undefined,
                        }}
                      >
                        {isExpanded ? item.body : `${item.body.substring(0, 150)}...`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sealed section when items exist */}
          {!loading && items.length > 0 && (
            <div style={{ marginTop: 60 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    color: '#FFFFFF',
                    fontSize: 20,
                    margin: 0,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: -0.5,
                  }}
                >
                  MORE COMING SOON
                </h3>
              </div>
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: 'rgba(26,26,26,0.85)',
                      borderRadius: 4,
                      padding: '40px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="#666666"
                      strokeWidth="1.5"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "'Roboto Condensed', sans-serif",
                        color: '#666666',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}
                    >
                      Coming in Volume 1
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
