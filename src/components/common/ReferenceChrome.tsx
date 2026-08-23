import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import defaultHero from '../../assets/images/hero/singa-pen-hero.png';

interface PortalHeroProps {
  active?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  copy?: string;
  children?: React.ReactNode;
  compact?: boolean;
  image?: string;
  mobileImage?: string;
  imagePosition?: string;
  mobileImagePosition?: string;
  mobileImageWidth?: string;
  showText?: boolean;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  title,
  subtitle,
  copy,
  children,
  compact = false,
  image,
  mobileImage,
  imagePosition,
  mobileImagePosition,
  mobileImageWidth,
  showText = false,
}) => {
  const artStyle = {
    ...(imagePosition ? { objectPosition: imagePosition } : {}),
    '--reference-mobile-position': mobileImagePosition || '57% center',
    '--reference-mobile-width': mobileImageWidth || '100%',
  } as React.CSSProperties;

  return (
    <section
      className={`reference-hero ${!showText ? 'reference-hero--art-only' : ''}`}
    >
      <div className="reference-hero__inner">
        {showText && (
          <div className="reference-hero__copy">
            <h1>{title}</h1>
            {subtitle && (
              <div className="reference-hero__subtitle">{subtitle}</div>
            )}
            {copy && <p>{copy}</p>}
            {children}
          </div>
        )}

        {!showText && (
          <div className="sr-only">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
            {copy && <p>{copy}</p>}
          </div>
        )}

        <div
          className={`reference-hero__figure ${
            compact ? 'reference-hero__figure--compact' : ''
          }`}
          aria-hidden="true"
        >
          <picture className="reference-hero__picture">
            {mobileImage ? (
              <source
                media="(max-width: 767px)"
                srcSet={mobileImage}
              />
            ) : null}

            <img
              className="reference-hero__art"
              src={image || defaultHero}
              alt=""
              style={artStyle}
            />
          </picture>
        </div>
      </div>
    </section>
  );
};

interface SectionHeadingProps {
  icon?: React.ReactNode;
  title: string;
  caption?: string;
  actionLabel?: string;
  actionTo?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title, caption, actionLabel, actionTo }) => (
  <div className="reference-section-heading">
    <div className="reference-section-heading__title">
      {icon}
      <div>
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
    </div>
    {actionLabel && actionTo && (
      <Link to={actionTo} className="reference-text-link">
        <span>{actionLabel}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

export const MetricStrip: React.FC<{ metrics: { icon: React.ReactNode; value: string; label: string }[] }> = ({ metrics }) => (
  <div className="reference-metric-strip">
    {metrics.map((metric) => (
      <div key={metric.label} className="reference-metric">
        <span>{metric.icon}</span>
        <strong>{metric.value}</strong>
        <small>{metric.label}</small>
      </div>
    ))}
  </div>
);
