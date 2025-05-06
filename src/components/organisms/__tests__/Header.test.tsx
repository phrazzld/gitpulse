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

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={props.src} alt={props.alt} width={props.width} height={props.height} className={props.className} />;
  },
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
    expect(screen.getByAltText(userName)).toBeInTheDocument();
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