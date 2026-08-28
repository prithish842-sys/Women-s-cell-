import React, { useEffect, useState } from 'react';
import { assignImageFallback, withResolvedImage } from '../../utils/imageFallback.js';

type ProgressiveImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string;
  fallbackSrc: string;
  resolveSrc?: boolean;
  wrapperClassName?: string;
  imageClassName?: string;
};

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  fallbackSrc,
  resolveSrc = true,
  wrapperClassName = '',
  imageClassName = '',
  alt,
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const resolvedSrc = resolveSrc ? withResolvedImage(src, fallbackSrc) : (src || fallbackSrc);

  useEffect(() => {
    setLoaded(false);
  }, [resolvedSrc]);

  return (
    <span className={`progressive-image ${loaded ? 'is-loaded' : ''} ${wrapperClassName}`}>
      <span className="progressive-image__placeholder" aria-hidden="true" />
      <img
        {...props}
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          assignImageFallback(event, fallbackSrc);
          setLoaded(true);
          onError?.(event);
        }}
        className={`progressive-image__img ${imageClassName}`}
      />
    </span>
  );
};
