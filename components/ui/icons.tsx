/**
 * The mockup's two inline icons. Both draw in currentColor and are aria-hidden: they decorate
 * text that already says what they mean. Colour them with a text-* class on the icon or parent.
 */
type IconProps = { size?: number; className?: string };

/** Warning triangle (.disclose, .note, the risks list). */
export function WarnIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" d="M8 1.5 15 14H1L8 1.5Zm-.75 4.5v4h1.5V6h-1.5Zm0 5.2v1.5h1.5v-1.5h-1.5Z" />
    </svg>
  );
}

/** Check in a circle (the benefits list). */
export function CheckCircleIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={className}>
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 10.5l2.6 2.5L14 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
