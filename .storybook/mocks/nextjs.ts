/**
 * This file contains mocks for Next.js features used in components
 * These mocks allow components that use Next.js features to render correctly in Storybook
 */

// Mock for next/image
const ImageMock = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  ...props
}: any) => {
  return (
    <img
      src={typeof src === 'object' ? '/placeholder.svg' : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      {...props}
    />
  );
};

// Mock for next/navigation
const navigationMock = {
  push: (route: string) => console.log(`Navigation push to: ${route}`),
  back: () => console.log('Navigation back'),
  replace: (route: string) => console.log(`Navigation replace to: ${route}`),
  prefetch: (route: string) => console.log(`Prefetch route: ${route}`),
  useRouter: () => ({
    push: (route: string) => console.log(`Router push to: ${route}`),
    replace: (route: string) => console.log(`Router replace to: ${route}`),
    back: () => console.log('Router back'),
    prefetch: (route: string) => console.log(`Router prefetch: ${route}`),
    pathname: '/dashboard',
    query: {},
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(''),
};

// Mock for next-auth 
const nextAuthMock = {
  getSession: async () => ({ user: { name: 'Storybook User', email: 'user@example.com' } }),
  signIn: async () => ({ ok: true, error: null }),
  signOut: async () => ({}),
  useSession: () => ({ 
    data: { 
      user: { name: 'Storybook User', email: 'user@example.com' },
      expires: new Date(Date.now() + 86400000).toISOString()
    }, 
    status: 'authenticated',
    update: () => Promise.resolve(null)
  }),
};

export { ImageMock, navigationMock, nextAuthMock };