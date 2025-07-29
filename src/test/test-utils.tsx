import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';

// Add any providers that your app needs
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="gitpulse-theme">
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Utility to test component variants
export const testVariants = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  variants: Record<string, any>,
  baseProps: T
) => {
  const results: Record<string, any> = {};
  
  Object.entries(variants).forEach(([variantName, variantValue]) => {
    const { container } = render(
      <Component {...baseProps} {...{ [variantName]: variantValue }} />
    );
    results[`${variantName}-${variantValue}`] = container.firstChild;
  });
  
  return results;
};