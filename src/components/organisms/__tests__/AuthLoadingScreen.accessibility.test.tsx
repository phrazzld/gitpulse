import React from 'react';
import { render } from '@testing-library/react';
import AuthLoadingScreen from '../AuthLoadingScreen';
import { assertAccessible } from '@/lib/tests/axeTest';

describe('AuthLoadingScreen Accessibility', () => {
  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<AuthLoadingScreen />);
    await assertAccessible(container);
  });

  it('should have no accessibility violations with custom messages', async () => {
    const { container } = render(
      <AuthLoadingScreen
        message="Initializing Secure Session"
        subMessage="Establishing encrypted connection..."
        statusMessage="Contacting authorization server..."
        footerMessage="CONNECTION SECURED VIA TLS 1.3"
      />
    );
    await assertAccessible(container);
  });

  it('should have appropriate ARIA attributes for screen readers', () => {
    const customMessage = "Verifying GitHub credentials";
    const { getByRole } = render(
      <AuthLoadingScreen message={customMessage} />
    );
    
    // Test that the correct role and attributes are used
    const alertElement = getByRole('alert');
    expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    expect(alertElement).toHaveAttribute('aria-busy', 'true');
    expect(alertElement).toHaveAttribute('aria-label', customMessage);
  });

  it('should announce status message to screen readers', () => {
    const statusMessage = "Accessing GitHub API...";
    const { getByText } = render(
      <AuthLoadingScreen statusMessage={statusMessage} />
    );
    
    // In the StatusDisplay component, the status message has "> " prefixed
    const statusElement = getByText(new RegExp(statusMessage));
    expect(statusElement).toBeInTheDocument();
    
    // The StatusDisplay component should make this visible to screen readers
    // (no aria-hidden attribute on the paragraph containing the status)
    expect(statusElement).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('should be visible when using high contrast mode', async () => {
    // This is a simple test to ensure elements have sufficient styling
    // to be visible in high contrast mode. Real testing would need to be done
    // with specialized tools or manual testing.
    
    const { container } = render(<AuthLoadingScreen />);
    
    // Verify key elements have explicit border colors which aid visibility in high contrast mode
    const cardElement = container.querySelector('.border-2');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveStyle('border-color: var(--auth-primary-color)');
    
    // Verify elements have text with explicit colors 
    const headingElement = container.querySelector('h2');
    expect(headingElement).toHaveStyle('color: var(--auth-primary-color)');
    
    await assertAccessible(container);
  });
  
  it('should respect prefers-reduced-motion setting', () => {
    const { container } = render(<AuthLoadingScreen />);
    
    // Check that the component uses Tailwind's motion-safe class 
    // which conditionally applies effects based on user preferences
    const cardElement = container.querySelector('.motion-safe\\:backdrop-blur-md');
    expect(cardElement).toBeInTheDocument();
  });
});