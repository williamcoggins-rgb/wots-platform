export function SectionDivider() {
  return (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, padding: '0' }}>
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '40px', display: 'block' }}
      >
        {/* Egyptian geometric repeating pattern */}
        <defs>
          <pattern id="egyptPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* Diamond */}
            <polygon
              points="30,5 55,30 30,55 5,30"
              fill="none"
              stroke="var(--color-sphinx-gold)"
              strokeWidth="0.5"
              opacity="0.3"
            />
            {/* Inner diamond */}
            <polygon
              points="30,15 45,30 30,45 15,30"
              fill="none"
              stroke="var(--color-sand-dark)"
              strokeWidth="0.5"
              opacity="0.2"
            />
            {/* Center dot */}
            <circle cx="30" cy="30" r="2" fill="var(--color-sphinx-gold)" opacity="0.2" />
            {/* Corner dots */}
            <circle cx="0" cy="0" r="1" fill="var(--color-sand-dark)" opacity="0.15" />
            <circle cx="60" cy="0" r="1" fill="var(--color-sand-dark)" opacity="0.15" />
            <circle cx="0" cy="60" r="1" fill="var(--color-sand-dark)" opacity="0.15" />
            <circle cx="60" cy="60" r="1" fill="var(--color-sand-dark)" opacity="0.15" />
          </pattern>
          <linearGradient id="fadeEdges" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-obsidian)" stopOpacity="1" />
            <stop offset="15%" stopColor="var(--color-obsidian)" stopOpacity="0" />
            <stop offset="85%" stopColor="var(--color-obsidian)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--color-obsidian)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="60" fill="url(#egyptPattern)" />
        <rect width="1200" height="60" fill="url(#fadeEdges)" />
        {/* Center horizontal line */}
        <line
          x1="100"
          y1="30"
          x2="1100"
          y2="30"
          stroke="var(--color-sphinx-gold)"
          strokeWidth="0.5"
          opacity="0.15"
        />
      </svg>
    </div>
  );
}
