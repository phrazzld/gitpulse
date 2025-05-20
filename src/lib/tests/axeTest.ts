import { axe, toHaveNoViolations } from 'jest-axe';
// We use any here because AxeResults is not exported from jest-axe
// eslint-disable-next-line
type AxeResults = any;
import { RenderResult } from '@testing-library/react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Configuration options for axe testing
 */
export interface AxeTestOptions {
  /**
   * Rules to include in the test (overrides the default set of rules)
   */
  includeRules?: string[];
  
  /**
   * Rules to exclude from the test
   */
  excludeRules?: string[];
  
  /**
   * Custom failure message
   */
  customFailureMessage?: string;
}

/**
 * Helper function to test a component for accessibility
 * 
 * @param renderResult - The result from a React Testing Library render function
 * @param options - Optional configuration options for axe testing
 * @returns Promise that resolves to the axe results
 * 
 * @example
 * ```tsx
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   await assertAccessible(container);
 * });
 * ```
 */
export async function assertAccessible(
  renderResult: RenderResult | HTMLElement, 
  options?: AxeTestOptions
): Promise<AxeResults> {
  const container = 'container' in renderResult 
    ? renderResult.container 
    : renderResult;
  
  const axeOptions: any = {};
  
  if (options?.includeRules || options?.excludeRules) {
    axeOptions.rules = {};
    
    if (options.includeRules) {
      options.includeRules.forEach(rule => {
        axeOptions.rules[rule] = { enabled: true };
      });
    }
    
    if (options.excludeRules) {
      options.excludeRules.forEach(rule => {
        axeOptions.rules[rule] = { enabled: false };
      });
    }
  }

  const results = await axe(container, axeOptions);
  
  try {
    expect(results).toHaveNoViolations();
  } catch (error: unknown) {
    if (options?.customFailureMessage && error instanceof Error) {
      throw new Error(`${options.customFailureMessage}\n${error.message}`);
    }
    throw error;
  }
  
  return results;
}

/**
 * Helper function to test common component states for accessibility
 * 
 * @param renderFn - Function that renders the component in different states
 * @param states - An object mapping state names to render props
 * @returns Promise that resolves when all tests are complete
 * 
 * @example
 * ```tsx
 * await testAccessibilityForStates(
 *   (props) => render(<Button {...props} />),
 *   {
 *     default: { children: 'Click me' },
 *     disabled: { disabled: true, children: 'Disabled' },
 *     loading: { loading: true, children: 'Loading' },
 *   }
 * );
 * ```
 */
export async function testAccessibilityForStates<P>(
  renderFn: (props: P) => RenderResult,
  states: Record<string, P>
): Promise<void> {
  for (const [stateName, props] of Object.entries(states)) {
    const result = renderFn(props);
    await assertAccessible(result, {
      customFailureMessage: `Component in ${stateName} state has accessibility violations`
    });
    
    // Clean up
    result.unmount();
  }
}