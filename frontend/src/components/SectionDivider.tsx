export function SectionDivider({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ padding: '0 2rem', margin: '3rem auto', maxWidth: '1200px' }}>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #333, transparent)' }} />
    </div>
  );
}

export default SectionDivider;
