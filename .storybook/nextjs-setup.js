// This file provides mock implementations for Next.js features in Storybook

// Mock implementations
const nextImage = ({ src, alt, width, height, className, style, ...props }) => {
  return (
    <img
      src={typeof src === 'object' ? '/placeholder.svg' : src}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={className}
      style={style}
      {...props}
    />
  );
};

const nextLink = ({ href, children, ...props }) => {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

// Export mock implementations
Object.defineProperty(exports, "__esModule", {
  value: true
});

// Mock for next/image
exports.default = nextImage;
exports.Image = nextImage;

// Mock for next/link
exports.Link = nextLink;