import { useId } from 'react';

type BrandLogoProps = {
  className?: string;
  stacked?: boolean;
  showTagline?: boolean;
};

export function BrandLogo({ className = '', stacked = false, showTagline = true }: BrandLogoProps) {
  const gradientId = useId().replace(/:/g, '');
  const classes = ['brandLogo', stacked ? 'isStacked' : 'isInline', className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      <span className="brandIcon" aria-hidden="true">
        <svg className="brandIconSvg" viewBox="0 0 180 180">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-soft)" />
              <stop offset="100%" stopColor="var(--gold-deep)" />
            </linearGradient>
          </defs>
          <path
            d="M25 66 90 14l65 52"
            fill="none"
            stroke="var(--forest)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="11"
          />
          <text
            x="56"
            y="118"
            fill="var(--forest)"
            fontFamily="var(--font-display), serif"
            fontSize="82"
            fontWeight="600"
          >
            J
          </text>
          <text
            x="94"
            y="120"
            fill={`url(#${gradientId})`}
            fontFamily="var(--font-display), serif"
            fontSize="78"
            fontWeight="600"
          >
            B
          </text>
        </svg>
      </span>
      <span className="brandWordmark">
        {stacked ? (
          <>
            <span className="brandWordTop">ASESORÍA</span>
            <strong>INMOBILIARIA JB</strong>
          </>
        ) : (
          <>
            <strong>Asesoría Inmobiliaria JB</strong>
            {showTagline ? <small>Espacios para vivir</small> : null}
          </>
        )}
      </span>
    </span>
  );
}