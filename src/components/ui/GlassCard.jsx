export default function GlassCard({ children, className = '', glow = false, style = {} }) {
  return (
    <div
      className={`${glow ? 'glass-card-glow' : 'glass-card'} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
