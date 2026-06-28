// Glifo de marca de Taluna (mismo trazo que usa el Organizador).
export default function TalunaGlyph({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.32)}
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 60V30" />
      <path d="M3 35l6-8 6 8" />
      <path d="M3.5 44l5.5-7 5.5 7" />
      <path d="M24 60V13" />
      <path d="M16.5 23l7.5-10 7.5 10" />
      <path d="M17 33l7-9 7 9" />
      <path d="M39 60V37" />
      <path d="M33 43l6-8 6 8" />
    </svg>
  );
}
