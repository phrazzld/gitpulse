import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthLoadingScreen from '../AuthLoadingScreen';

describe('AuthLoadingScreen', () => {
  it('renders with default props', () => {
    render(<AuthLoadingScreen />);
    
    // Check that main elements are rendered
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Verifying Authentication')).toBeInTheDocument();
    expect(screen.getByText(/System access verification in progress/)).toBeInTheDocument();
    expect(screen.getByText(/Please wait while we verify your credentials/)).toBeInTheDocument();
    expect(screen.getByText('SECURE CONNECTION ESTABLISHED')).toBeInTheDocument();
  });

  it('renders with custom messages', () => {
    const customProps = {
      message: 'Custom Message',
      subMessage: 'Custom Sub Message',
      statusMessage: 'Custom Status Message',
      footerMessage: 'Custom Footer Message',
    };
    
    render(<AuthLoadingScreen {...customProps} />);
    
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
    expect(screen.getByText(/Custom Status Message/)).toBeInTheDocument();
    expect(screen.getByText(/Custom Sub Message/)).toBeInTheDocument();
    expect(screen.getByText('Custom Footer Message')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AuthLoadingScreen className="custom-class" />);
    
    const container = screen.getByRole('alert');
    expect(container).toHaveClass('auth-loading-screen');
    expect(container).toHaveClass('custom-class');
  });

  it('has the correct accessibility attributes', () => {
    render(<AuthLoadingScreen message="Testing Accessibility" />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveAttribute('aria-busy', 'true');
    expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    expect(alertElement).toHaveAttribute('aria-label', 'Testing Accessibility');
  });
});