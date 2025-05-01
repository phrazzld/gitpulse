/**
 * Storybook preview mocks setup for Next.js
 * This file sets up mocks for Next.js features in Storybook to allow components to render correctly
 */

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className, style, ...props }: any) => {
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
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  __esModule: true,
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
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  __esModule: true,
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
}));