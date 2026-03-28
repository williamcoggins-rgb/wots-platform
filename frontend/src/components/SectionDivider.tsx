/**
 * SectionDivider — Egyptian-inspired geometric SVG divider
 * Reusable component for separating page sections.
 */
export function SectionDivider({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ width: '100%', overflow: 'hidden', lineHeight: 0, padding: 0 }}
    >
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '40px', display: 'block' }}
      >
        <defs>
          <pattern id="egyptDividerPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <polygon
              points="30,5 55,30 30,55 5,30"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="0.5"
              opacity="0.25"
            />
            <polygon
              points="30,15 45,30 30,45 15,30"
              fill="none"
              stroke="var(--color-sand-dark)"
              strokeWidth="0.5"
              opacity="0.15"
            />
            <path
              d="M30 5 Q35 15 30 25 Q25 15 30 5"
              fill="var(--color-gold)"
              opacity="0.06"
            />
            <circle cx="30" cy="30" r="2" fill="var(--color-gold)" opacity="0.2" />
            <circle cx="0" cy="0" r="1" fill="var(--color-sand-dark)" opacity="0.12" />
            <circle cx="60" cy="0" r="1" fill="var(--color-sand-dark)" opacity="0.12" />
            <circle cx="0" cy="60" r="1" fill="var(--color-sand-dark)" opacity="0.12" />
            <circle cx="60" cy="60" r="1" fill="var(--color-sand-dark)" opacity="0.12" />
          </pattern>
          <linearGradient id="dividerFadeEdges" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-obsidian)" stopOpacity="1" />
            <stop offset="15%" stopColor="var(--color-obsidian)" stopOpacity="0" />
            <stop offset="85%" stopColor="var(--color-obsidian)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--color-obsidian)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="60" fill="url(#egyptDividerPattern)" />
        <rect width="1200" height="60" fill="url(#dividerFadeEdges)" />
        <line
          x1="80"
          y1="30"
          x2="1120"
          y2="30"
          stroke="var(--color-gold)"
          strokeWidth="0.5"
          opacity="0.12"
        />
        <path
          d="M590 24 L600 18 L610 24 M590 36 L600 42 L610 36"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="0.8"
          opacity="0.3"
        />
        <circle cx="600" cy="30" r="1.5" fill="var(--color-gold)" opacity="0.25" />
      </svg>
    </div>
  );
}

export default SectionDivider;
