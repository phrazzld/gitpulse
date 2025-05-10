/**
 * Tests for the Header component
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(actual: any): any;
declare namespace jest {
  function fn(implementation?: (...args: any[]) => any): any;
  function mock(moduleName: string, factory?: () => any): void;
  function clearAllMocks(): void;
}

interface MockElement {
  textContent: string;
  alt?: string;
  onClick?: () => void;
}

// Tests now use @testing-library/react instead of mock implementation

// Import component to test
// Use @testing-library/react for testing
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn()
}));

// Mock the next/image component with an inline implementation
jest.mock('next/image', () => ({
  __esModule: true,
  default: function Image({ src, alt, width, height, className }: { 
    src: string; 
    alt: string; 
    width?: number | string; 
    height?: number | string; 
    className?: string;
  }) {
    // Using a div instead of img to avoid ESLint warnings
    return (
      <div 
        data-testid="mock-image"
        aria-label={alt}
        data-alt={alt}
        style={{ 
          display: 'inline-block', 
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height
        }}
        className={className}
      >
        <div data-src={src}>{alt}</div>
      </div>
    );
  }
}));

// Import the mocked signOut function
import { signOut } from 'next-auth/react';

describe('Header component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the header with app name', () => {
    render(<Header />);
    expect(screen.getByText('PULSE')).toBeInTheDocument();
  });

  it('should render with user information when provided', () => {
    const userName = 'Test User';
    const userImage = 'https://example.com/avatar.png';
    
    render(<Header userName={userName} userImage={userImage} />);
    
    expect(screen.getByText(`USER: ${userName.toUpperCase()}`)).toBeInTheDocument();
    // Use getByTestId instead of getByAltText to find the image
    const mockImage = screen.getByTestId('mock-image');
    expect(mockImage).toBeInTheDocument();
    expect(mockImage).toHaveAttribute('aria-label', userName);
  });

  it('should not display user section when userImage is not provided', () => {
    const userName = 'Test User';
    
    render(<Header userName={userName} />);
    
    expect(screen.queryByText(`USER: ${userName.toUpperCase()}`)).not.toBeInTheDocument();
    expect(screen.queryByText('DISCONNECT')).not.toBeInTheDocument();
  });

  it('should call signOut with correct callback URL when disconnect button is clicked', () => {
    const userImage = 'https://example.com/avatar.png';
    const customCallbackUrl = '/custom-callback';
    
    render(<Header userImage={userImage} signOutCallbackUrl={customCallbackUrl} />);
    
    // Simulate click on the disconnect button
    fireEvent.click(screen.getByText('DISCONNECT'));
    
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: customCallbackUrl });
  });

  it('should use default callback URL when not specified', () => {
    const userImage = 'https://example.com/avatar.png';
    
    render(<Header userImage={userImage} />);
    
    // Simulate click on the disconnect button
    fireEvent.click(screen.getByText('DISCONNECT'));
    
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('should show command terminal label by default', () => {
    render(<Header />);
    expect(screen.getByText('COMMAND TERMINAL')).toBeInTheDocument();
  });

  it('should hide command terminal label when showCommandTerminal is false', () => {
    render(<Header showCommandTerminal={false} />);
    expect(screen.queryByText('COMMAND TERMINAL')).not.toBeInTheDocument();
  });
});