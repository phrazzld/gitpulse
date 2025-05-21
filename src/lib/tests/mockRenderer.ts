/**
 * Mock Renderer Utility
 * 
 * This module provides a simplified React renderer for testing component structures
 * without requiring the full React Testing Library or Enzyme.
 */

import React from 'react';

/**
 * Interface for the rendered element structure
 */
export interface MockElement {
  type: string;
  props: Record<string, any>;
  children?: MockElement[] | string | number;
}

/**
 * Interface for the mock renderer
 */
export interface MockRenderer {
  render: (component: React.ReactElement) => MockElement;
}

/**
 * Creates a mock renderer for components with proper TypeScript typing
 * 
 * @returns A MockRenderer object with a render method
 */
export function createMockRenderer(): MockRenderer {
  // Create a renderer that can process React elements
  const renderer: MockRenderer = {
    render: (component: React.ReactElement): MockElement => {
      // Extract type and props from component
      const type = component.type;
      const props = component.props as Record<string, any>;
      
      // Determine the rendered type name
      let renderedType = '';
      if (typeof type === 'string') {
        renderedType = type;
      } else if (typeof type === 'function') {
        // For function components, use the name
        renderedType = type.name || 'Unknown';
      } else {
        renderedType = 'Unknown';
      }
      
      // Process children if they exist
      let children: MockElement[] | string | number | undefined;
      
      // Handle children prop recursively
      if (props.children) {
        if (Array.isArray(props.children)) {
          // Handle array of children
          children = props.children.map((child: any) => {
            if (React.isValidElement(child)) {
              return renderer.render(child);
            }
            return child;
          });
        } else if (React.isValidElement(props.children)) {
          // Handle single React element child
          children = [renderer.render(props.children)];
        } else {
          // Handle string, number, or other primitive child
          children = props.children;
        }
      }
      
      // Create the rendered element
      const renderedElement: MockElement = {
        type: renderedType,
        props: { ...props, children: undefined },
      };
      
      if (children !== undefined) {
        renderedElement.children = children;
      }
      
      return renderedElement;
    }
  };
  
  return renderer;
}