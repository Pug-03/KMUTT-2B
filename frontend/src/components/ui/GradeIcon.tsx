import { Grade } from '@/contexts/AppContext';

interface GradeIconProps {
  grade: Grade;
  size?: number;
  className?: string;
}

/**
 * Minimalist SVG icons for each grade. All icons use currentColor so
 * the parent sets the hue. 16×16 viewBox, crisp at any size.
 */
export default function GradeIcon({ grade, size = 14, className = '' }: GradeIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `inline-block shrink-0 ${className}`,
  };

  switch (grade) {
    // Grade A — premium sparkle (filled star)
    case 'gradeA':
      return (
        <svg {...common}>
          <path
            d="M8 1.5l1.76 4.03 4.4.39-3.33 2.9 1 4.28L8 10.85 4.17 13.1l1-4.28L1.84 5.92l4.4-.39L8 1.5z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );

    // Grade B — standard (filled circle with subtle ring)
    case 'gradeB':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.5" fill="currentColor" stroke="none" />
          <circle cx="8" cy="8" r="7" strokeWidth={1.2} opacity={0.35} />
        </svg>
      );

    // Grade C — economy (filled triangle)
    case 'gradeC':
      return (
        <svg {...common}>
          <path
            d="M8 2.2L14.2 13H1.8L8 2.2z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      );

    // Unripe — hollow circle with a leaf tip (not ready)
    case 'unripe':
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="5.2" />
          <path d="M8 3.8c0-1.4 1-2.3 2.2-2.3-.1 1.2-.9 2.1-2.2 2.3z" fill="currentColor" stroke="none" />
        </svg>
      );

    // Rotten — circle with X (reject)
    case 'rotten':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" strokeWidth={1.8} />
        </svg>
      );

    // Wilted — diamond outline (damaged)
    case 'wilted':
      return (
        <svg {...common}>
          <path d="M8 1.8L14.2 8 8 14.2 1.8 8 8 1.8z" />
          <path d="M5.5 8L8 10.5 10.5 8" strokeWidth={1.4} />
        </svg>
      );
  }
}
