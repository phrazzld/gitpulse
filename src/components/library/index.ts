/**
 * Component Library Barrel File
 *
 * This file re-exports all components and interfaces from the component library,
 * allowing consumers to import from a single path rather than individual files.
 *
 * @example
 * // Import multiple components with a single import statement
 * import { Button, Card, Input, Form } from '@/components/library';
 *
 * @example
 * // Import components and their interfaces
 * import { Button, ButtonProps, Card, CardProps } from '@/components/library';
 */

// Re-export Button component and its interface
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// Re-export Input component and its interface
export { Input } from "./Input";
export type { InputProps } from "./Input";

// Re-export Card component and its interface
export { Card } from "./Card";
export type { CardProps } from "./Card";

// Re-export Form component and its context hook
export { Form, useFormContext } from "./Form";

// Re-export utility functions
export { cn } from "./utils/cn";
