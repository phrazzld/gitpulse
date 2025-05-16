/**
 * Next.js Image Component Mock
 * 
 * This mock implementation of Next.js Image component can be used in tests
 * without triggering ESLint @next/next/no-img-element warnings.
 */

import React from 'react';

// Define interface for Image props that matches Next/Image
export interface NextImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  placeholder?: string | 'blur';
  blurDataURL?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Mock implementation of Next.js Image component for testing
 * 
 * This implementation uses React's SVG rendering instead of an img element
 * to avoid ESLint warnings in test files.
 * 
 * @param props NextImageProps matching Next.js Image props
 * @returns React component
 */
const MockNextImage: React.FC<NextImageProps> = (props) => {
  const {
    src,
    alt,
    width = 100,
    height = 100,
    className,
    onClick,
    onLoad,
    onError,
    style
  } = props;

  // Use a data URL for the image to avoid network requests in tests
  const imageUrl = typeof src === 'string' ? src : '';
  
  // Handle onLoad callback
  React.useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  return (
    <svg
      data-testid="mock-image"
      role="img"
      aria-label={alt}
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      onError={onError}
      style={{
        ...style,
        maxWidth: '100%',
        height: 'auto',
        objectFit: 'contain',
      }}
    >
      <title>{alt}</title>
      <foreignObject width="100%" height="100%">
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Store the src as a data attribute for testing */}
          <div data-src={imageUrl}>
            {alt}
          </div>
        </div>
      </foreignObject>
    </svg>
  );
};

// Default export matching Next.js Image
export default MockNextImage;