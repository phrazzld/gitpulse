# GitPulse Component Library

This documentation provides a comprehensive overview of the GitPulse component library, including detailed information about each component, their props, variants, and usage examples.

## Table of Contents

- [Installation and Import](#installation-and-import)
- [Components](#components)
  - [Button](#button)
  - [Input](#input)
  - [Card](#card)
- [Layout Components](#layout-components)
  - [Header](#header)
  - [Footer](#footer)
  - [NavigationMenu](#navigationmenu)
  - [MobileMenuToggle](#mobilemenutoggle)
- [Utilities](#utilities)
  - [cn (Class Name Utility)](#cn-class-name-utility)
- [Composition Examples](#composition-examples)
- [Design Tokens](#design-tokens)

## Installation and Import

The component library is part of the GitPulse project and is built using React, TypeScript, and Tailwind CSS. The components are designed to work with the design token system defined in `/src/styles/tokens.css`.

### Importing Components

You can import components from the library using the barrel file:

```tsx
// Import single component
import { Button } from "@/components/library";

// Import multiple components
import { Button, Input, Card } from "@/components/library";

// Import component with its prop interface
import { Button, ButtonProps } from "@/components/library";

// Import utility function
import { cn } from "@/components/library";
```

## Components

### Button

A flexible button component that adapts to different use cases through variants and sizes. Supports all standard HTML button attributes plus custom styling options.

#### Basic Usage

```tsx
import { Button } from '@/components/library';

// Primary button (default)
<Button onClick={handleClick}>Submit</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Danger button for destructive actions
<Button variant="danger">Delete</Button>
```

#### Button Variants

The Button component supports three variants:

```tsx
// Primary - Default green button for main actions
<Button variant="primary">Primary Action</Button>

// Secondary - Neutral button for secondary actions
<Button variant="secondary">Secondary Action</Button>

// Danger - Red button for destructive actions
<Button variant="danger">Destructive Action</Button>
```

#### Button Sizes

The Button component supports three sizes:

```tsx
// Small button
<Button size="sm">Small</Button>

// Medium button (default)
<Button size="md">Medium</Button>

// Large button
<Button size="lg">Large</Button>
```

#### Disabled State

```tsx
// Disabled button
<Button disabled>Disabled Button</Button>
```

#### Button Types

```tsx
// Regular button (default)
<Button type="button">Click Me</Button>

// Form submission button
<Button type="submit">Submit Form</Button>

// Form reset button
<Button type="reset">Reset Form</Button>
```

#### Custom Styling

```tsx
// Using className for custom styling
<Button className="w-full mt-4">Full Width Button</Button>
```

#### Props

| Prop        | Type                                            | Default     | Description                                   |
| ----------- | ----------------------------------------------- | ----------- | --------------------------------------------- |
| `children`  | `React.ReactNode`                               | Required    | Content to render inside the button           |
| `onClick`   | `React.MouseEventHandler<HTMLButtonElement>`    | -           | Button click handler function                 |
| `disabled`  | `boolean`                                       | `false`     | Disables the button when true                 |
| `variant`   | `"primary" \| "secondary" \| "danger"`          | `"primary"` | Visual style variant of the button            |
| `size`      | `"sm" \| "md" \| "lg"`                          | `"md"`      | Button size variant                           |
| `type`      | `"button" \| "submit" \| "reset"`               | `"button"`  | HTML button type attribute                    |
| `className` | `string`                                        | -           | Additional CSS classes to apply to the button |
| `...rest`   | `React.ButtonHTMLAttributes<HTMLButtonElement>` | -           | Any other HTML button attributes              |

### Input

A flexible input component that adapts to different use cases through variants, sizes, and states. Supports all standard HTML input attributes plus custom styling options and accessibility features.

#### Basic Usage

```tsx
import { Input } from '@/components/library';

// Basic input
<Input
  value={value}
  onChange={handleChange}
  placeholder="Enter text"
/>

// Input with error state
<Input
  value={email}
  onChange={handleEmailChange}
  type="email"
  error={!isValidEmail}
  errorMessage="Please enter a valid email address"
/>

// Filled variant with large size
<Input variant="filled" size="lg" placeholder="Search..." type="search" />
```

#### Input Variants

```tsx
// Outlined variant (default)
<Input variant="outlined" placeholder="Outlined input" />

// Filled variant
<Input variant="filled" placeholder="Filled input" />
```

#### Input Sizes

```tsx
// Small input
<Input size="sm" placeholder="Small input" />

// Medium input (default)
<Input size="md" placeholder="Medium input" />

// Large input
<Input size="lg" placeholder="Large input" />
```

#### Input Types

```tsx
// Text input (default)
<Input type="text" placeholder="Text input" />

// Password input
<Input type="password" placeholder="Password" />

// Email input
<Input type="email" placeholder="Email address" />

// Number input
<Input type="number" placeholder="Number input" />

// Tel input
<Input type="tel" placeholder="Phone number" />

// URL input
<Input type="url" placeholder="Website URL" />

// Search input
<Input type="search" placeholder="Search..." />

// Date input
<Input type="date" />
```

#### Input States

```tsx
// With error
<Input
  error={true}
  errorMessage="This field is required"
  placeholder="Input with error"
/>

// Disabled input
<Input disabled placeholder="Disabled input" />

// Read-only input
<Input readOnly value="Read-only value" />
```

#### Accessibility Features

```tsx
// With ARIA label (for inputs without a visible label)
<Input ariaLabel="Email address" placeholder="Email" />

// With describedby for additional description
<Input
  id="username-input"
  ariaDescribedby="username-description"
  placeholder="Username"
/>
<p id="username-description">Username must be 3-16 characters long.</p>
```

#### Props

| Prop              | Type                                                                                  | Default        | Description                                     |
| ----------------- | ------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------- |
| `value`           | `string`                                                                              | -              | Current value of the input field                |
| `onChange`        | `React.ChangeEventHandler<HTMLInputElement>`                                          | -              | Handler for value changes                       |
| `placeholder`     | `string`                                                                              | -              | Placeholder text                                |
| `disabled`        | `boolean`                                                                             | `false`        | Disables the input when true                    |
| `readOnly`        | `boolean`                                                                             | `false`        | Makes the input read-only                       |
| `type`            | `"text" \| "password" \| "email" \| "number" \| "tel" \| "url" \| "search" \| "date"` | `"text"`       | Input type                                      |
| `error`           | `boolean \| string`                                                                   | -              | Error state indicator                           |
| `errorMessage`    | `string`                                                                              | -              | Error message to display                        |
| `ariaLabel`       | `string`                                                                              | -              | ARIA label for accessibility                    |
| `ariaDescribedby` | `string`                                                                              | -              | ID of element that describes this input         |
| `size`            | `"sm" \| "md" \| "lg"`                                                                | `"md"`         | Size variant for visual styling                 |
| `htmlSize`        | `number`                                                                              | -              | HTML size attribute (character width)           |
| `variant`         | `"outlined" \| "filled"`                                                              | `"outlined"`   | Visual style variant                            |
| `className`       | `string`                                                                              | -              | Additional CSS classes                          |
| `id`              | `string`                                                                              | Auto-generated | Input ID attribute                              |
| `...rest`         | `React.InputHTMLAttributes<HTMLInputElement>`                                         | -              | Any other HTML input attributes (except "size") |

### Card

A versatile container component that can be used to group related content with consistent styling. Customizable padding, corner radius, and shadow depth allow for flexible usage in different UI contexts.

#### Basic Usage

```tsx
import { Card } from '@/components/library';

// Basic card
<Card>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>

// Card with custom styling
<Card padding="lg" radius="sm" shadow="lg" className="max-w-md">
  <h2>Custom Card</h2>
  <p>This card has large padding, small radius, and large shadow.</p>
</Card>

// Card with no padding
<Card padding="none">
  <img src="image.jpg" alt="Full width image" />
  <div className="p-md">
    <p>Content with custom padding</p>
  </div>
</Card>
```

#### Card Padding Variants

```tsx
// No padding
<Card padding="none">No padding card content</Card>

// Small padding
<Card padding="sm">Small padding card content</Card>

// Medium padding (default)
<Card padding="md">Medium padding card content</Card>

// Large padding
<Card padding="lg">Large padding card content</Card>
```

#### Card Border Radius Variants

```tsx
// No border radius (square corners)
<Card radius="none">Square corners</Card>

// Small border radius
<Card radius="sm">Slightly rounded corners</Card>

// Medium border radius (default)
<Card radius="md">Medium rounded corners</Card>

// Large border radius
<Card radius="lg">Highly rounded corners</Card>
```

#### Card Shadow Variants

```tsx
// No shadow
<Card shadow="none">No shadow</Card>

// Small shadow
<Card shadow="sm">Subtle shadow</Card>

// Medium shadow (default)
<Card shadow="md">Medium shadow</Card>

// Large shadow
<Card shadow="lg">Pronounced shadow</Card>
```

#### Card with HTML Attributes

```tsx
// Card with HTML attributes
<Card id="info-card" role="region" aria-label="Information" className="my-4">
  <p>Card with HTML attributes</p>
</Card>
```

#### Props

| Prop        | Type                                   | Default  | Description                       |
| ----------- | -------------------------------------- | -------- | --------------------------------- |
| `children`  | `React.ReactNode`                      | Required | Content to render inside the card |
| `padding`   | `"none" \| "sm" \| "md" \| "lg"`       | `"md"`   | Padding size applied to the card  |
| `radius`    | `"none" \| "sm" \| "md" \| "lg"`       | `"md"`   | Border radius applied to the card |
| `shadow`    | `"none" \| "sm" \| "md" \| "lg"`       | `"md"`   | Shadow depth applied to the card  |
| `className` | `string`                               | -        | Additional CSS classes            |
| `...rest`   | `React.HTMLAttributes<HTMLDivElement>` | -        | Any other HTML div attributes     |

## Layout Components

GitPulse includes a set of layout components designed to create consistent application layouts across the application. These components are built on top of the core component library and provide responsive behavior out of the box.

### Header

A comprehensive header component that displays the application logo, navigation menu, and user authentication UI. Features a responsive design that adapts between desktop and mobile screen sizes with a mobile menu toggle for smaller viewports.

#### Basic Usage

```tsx
import { Header } from '@/components/layout';
import { NavLink } from '@/types/navigation';

// Define navigation links
const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { label: "Settings", href: "/settings", requiresAuth: true },
  { label: "About", href: "/about" }
];

// Basic usage with session from NextAuth
<Header
  navLinks={navLinks}
  session={session}
/>

// With custom logo and styling
<Header
  navLinks={navLinks}
  session={session}
  logoText="MyApp"
  logoImageUrl="/custom-logo.svg"
  className="bg-primary/10"
/>
```

#### Mobile Responsiveness

The Header component adapts its display based on viewport size:

- **Desktop View**: Full navigation links are displayed horizontally, along with user information or sign-in button.
- **Mobile View**: Navigation links are hidden behind a mobile menu toggle that reveals an overlay menu when clicked.

```tsx
// The mobile menu toggle is automatically shown on small screens
// Header component handles viewport size detection internally
<Header navLinks={navLinks} session={session} />
```

#### Props

| Prop           | Type              | Default      | Description                                 |
| -------------- | ----------------- | ------------ | ------------------------------------------- |
| `navLinks`     | `NavLink[]`       | Required     | Array of navigation links to display        |
| `session`      | `Session \| null` | -            | User session from NextAuth.js               |
| `className`    | `string`          | -            | Additional CSS classes for header container |
| `logoText`     | `string`          | `"GitPulse"` | Text to display as the app logo             |
| `logoImageUrl` | `string`          | -            | URL for a custom logo image                 |

### Footer

A flexible footer component that displays copyright information and optional navigation links in a responsive layout. The footer is positioned at the bottom of the layout and spans the full width.

#### Basic Usage

```tsx
import { Footer } from "@/components/layout";
import { NavLink } from "@/types/navigation";

// Basic usage with copyright text only
<Footer copyrightText="© 2025 GitPulse. All rights reserved." />;

// With navigation links
const footerLinks: NavLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "About", href: "/about" },
];

<Footer
  links={footerLinks}
  copyrightText="© 2025 GitPulse. All rights reserved."
/>;
```

#### Mobile Responsiveness

The Footer component adapts its layout based on viewport size:

- **Desktop View**: Copyright text is aligned to the left and navigation links to the right in a horizontal layout.
- **Mobile View**: Both sections stack vertically with copyright text on top and navigation links below.

#### Props

| Prop            | Type        | Default  | Description                                    |
| --------------- | ----------- | -------- | ---------------------------------------------- |
| `links`         | `NavLink[]` | `[]`     | Array of navigation links to display in footer |
| `copyrightText` | `string`    | Required | Copyright text to display in the footer        |

### NavigationMenu

A comprehensive navigation component that can be used in headers, sidebars, or mobile menus. Supports both horizontal and vertical layouts with fully accessible keyboard navigation support and ARIA attributes.

#### Basic Usage

```tsx
import { NavigationMenu } from '@/components/layout';
import { NavLink } from '@/types/navigation';

// Define navigation links
const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/settings" }
];

// Basic horizontal navigation (default)
<NavigationMenu
  links={navLinks}
  currentPath={pathname}
/>

// Vertical navigation for mobile menu or sidebar
<NavigationMenu
  links={navLinks}
  currentPath={pathname}
  orientation="vertical"
  ariaLabel="Mobile Navigation"
  className="w-full"
/>
```

#### Orientation Variants

The NavigationMenu supports two orientation variants:

```tsx
// Horizontal orientation (default) - good for headers
<NavigationMenu
  links={navLinks}
  currentPath={pathname}
  orientation="horizontal"
/>

// Vertical orientation - good for mobile menus or sidebars
<NavigationMenu
  links={navLinks}
  currentPath={pathname}
  orientation="vertical"
/>
```

#### Accessibility Features

The NavigationMenu includes several accessibility features:

- Proper ARIA roles and attributes for screen readers
- Keyboard navigation support (arrow keys, home/end)
- Focus management for keyboard users
- Active link indication both visually and via aria-current

```tsx
// NavigationMenu with enhanced accessibility
<NavigationMenu
  links={navLinks}
  currentPath={pathname}
  ariaLabel="Main Navigation"
  id="main-nav"
/>
```

#### Props

| Prop              | Type                         | Default             | Description                               |
| ----------------- | ---------------------------- | ------------------- | ----------------------------------------- |
| `links`           | `NavLink[]`                  | Required            | Array of navigation links to display      |
| `currentPath`     | `string`                     | Required            | Current path for highlighting active link |
| `orientation`     | `"horizontal" \| "vertical"` | `"horizontal"`      | Layout orientation of the navigation      |
| `className`       | `string`                     | -                   | Additional CSS classes                    |
| `ariaLabel`       | `string`                     | `"Main Navigation"` | Accessible name for screen readers        |
| `id`              | `string`                     | Auto-generated      | ID for the navigation element             |
| `userId`          | `string`                     | -                   | User ID for logging navigation events     |
| `isAuthenticated` | `boolean`                    | -                   | Authentication state for logging          |

### MobileMenuToggle

A toggle button designed for mobile navigation menus that switches between open and closed states. Features smooth transitions, proper accessibility attributes, and support for custom styling and icons.

#### Basic Usage

```tsx
import { MobileMenuToggle } from "@/components/layout";
import { useState } from "react";

// Component with state for toggle
const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleToggle = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <MobileMenuToggle isOpen={isMenuOpen} onToggle={handleToggle} />

      {isMenuOpen && <div id="mobile-menu">{/* Mobile menu content */}</div>}
    </>
  );
};
```

#### With Accessibility Features

```tsx
// Improved accessibility with menu ID relationship
<MobileMenuToggle
  isOpen={isMenuOpen}
  onToggle={handleToggle}
  menuId="mobile-nav-menu"
  ariaLabel="Toggle navigation menu"
/>;

{
  isMenuOpen && <div id="mobile-nav-menu">{/* Mobile menu content */}</div>;
}
```

#### With Custom Icons

```tsx
// Using custom icons instead of the default hamburger/X
<MobileMenuToggle
  isOpen={isMenuOpen}
  onToggle={handleToggle}
  openIcon={<CloseIcon />}
  closedIcon={<MenuIcon />}
  className="custom-toggle"
/>
```

#### Props

| Prop         | Type              | Default                | Description                                 |
| ------------ | ----------------- | ---------------------- | ------------------------------------------- |
| `isOpen`     | `boolean`         | Required               | Current state of the mobile menu            |
| `onToggle`   | `() => void`      | Required               | Callback function when toggle is clicked    |
| `className`  | `string`          | -                      | Additional CSS classes                      |
| `menuId`     | `string`          | -                      | ID of the menu element this toggle controls |
| `ariaLabel`  | `string`          | `"Toggle mobile menu"` | Accessible name for screen readers          |
| `id`         | `string`          | Auto-generated         | ID for the toggle button element            |
| `openIcon`   | `React.ReactNode` | -                      | Custom icon for the open state              |
| `closedIcon` | `React.ReactNode` | -                      | Custom icon for the closed state            |

## Layout Integration

The layout components are designed to work together to create a consistent application layout. Here's how they can be integrated into Next.js pages and layouts:

```tsx
// src/app/layout.tsx
import { Header, Footer } from "@/components/layout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/apiAuth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session for authentication status
  const session = await getServerSession(authOptions);

  // Define navigation links
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard", requiresAuth: true },
    { label: "Settings", href: "/settings", requiresAuth: true },
    { label: "About", href: "/about" },
  ];

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header navLinks={navLinks} session={session} />
        <main className="flex-1 container mx-auto px-sm md:px-md py-lg">
          {children}
        </main>
        <Footer
          copyrightText="© 2025 GitPulse. All rights reserved."
          links={[
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
            { label: "About", href: "/about" },
          ]}
        />
      </body>
    </html>
  );
}
```

## Utilities

### cn (Class Name Utility)

A utility function for merging Tailwind CSS class names. It combines the functionality of `clsx` for conditional class names and `tailwind-merge` for resolving Tailwind utility conflicts.

#### Basic Usage

```tsx
import { cn } from "@/components/library";

// Merging multiple classes
const classes = cn("flex items-center", "p-4", "text-primary");

// With conditional classes
const classes = cn(
  "px-4 py-2",
  isActive && "bg-primary",
  isDisabled && "opacity-50",
);

// Resolving conflicts (last one wins)
const classes = cn("px-2", "px-4"); // => "px-4"
```

## Composition Examples

Components can be composed together to create more complex UI elements.

### Button in Card

```tsx
import { Button, Card } from "@/components/library";

<Card className="max-w-md">
  <h2 className="text-xl font-bold mb-2">Confirmation</h2>
  <p className="mb-4">Are you sure you want to proceed?</p>
  <div className="flex justify-end gap-2">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </div>
</Card>;
```

### Form with Input and Button

```tsx
import { Button, Card, Input } from "@/components/library";

<Card className="max-w-md">
  <h2 className="text-xl font-bold mb-4">Login Form</h2>
  <form onSubmit={handleSubmit}>
    <div className="mb-3">
      <label htmlFor="email" className="block mb-1">
        Email
      </label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="mb-2"
      />
    </div>
    <div className="mb-4">
      <label htmlFor="password" className="block mb-1">
        Password
      </label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      />
    </div>
    <Button type="submit" className="w-full">
      Login
    </Button>
  </form>
</Card>;
```

### Nested Cards

```tsx
import { Button, Card } from "@/components/library";

<Card>
  <h2 className="text-xl font-bold mb-2">Main Content</h2>
  <p className="mb-4">This is the main content area.</p>

  <Card radius="sm" shadow="sm" className="mb-4 bg-gray-50">
    <h3 className="text-lg font-semibold mb-2">Featured Item</h3>
    <p>This is a nested card with different styling.</p>
    <Button size="sm" className="mt-2">
      View Details
    </Button>
  </Card>

  <Button variant="secondary">Back</Button>
</Card>;
```

### Layout Components Composition

Layout components can be composed with core components to create complete page layouts:

```tsx
import { Header, Footer } from "@/components/layout";
import { Card, Button } from "@/components/library";

// Dashboard layout with Card components for content sections
const DashboardPage = ({ session, data }) => {
  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard", requiresAuth: true },
    { label: "Settings", href: "/settings", requiresAuth: true },
  ];

  return (
    <>
      <Header navLinks={navLinks} session={session} />

      <main className="container mx-auto px-md py-lg">
        <h1 className="text-2xl font-bold mb-lg">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Summary Card */}
          <Card className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-sm">Overview</h2>
            <p>Welcome back! Here's your activity summary.</p>
            <div className="flex justify-end mt-md">
              <Button size="sm">View Details</Button>
            </div>
          </Card>

          {/* Activity Card */}
          <Card>
            <h2 className="text-xl font-semibold mb-sm">Recent Activity</h2>
            <ul className="space-y-sm">
              <li>Commit: Updated README.md</li>
              <li>Pull Request: Fix navigation bug</li>
              <li>Issue: Add new feature</li>
            </ul>
          </Card>

          {/* Stats Card */}
          <Card>
            <h2 className="text-xl font-semibold mb-sm">Statistics</h2>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-foreground/70">Commits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-foreground/70">PRs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-foreground/70">Issues</div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer copyrightText="© 2025 GitPulse. All rights reserved." />
    </>
  );
};
```

## Design Tokens

The component library uses a design token system defined in `/src/styles/tokens.css`. These tokens are CSS variables that are referenced by Tailwind CSS utility classes.

### Color Tokens

```css
/* Core palette colors */
--dark-slate: 200 30% 15%; /* #1b2b34 */
--neon-green: 156 100% 50%; /* #00ff87 */
--electric-blue: 210 82% 57%; /* #3b8eea */
--luminous-yellow: 40 100% 67%; /* #ffc857 */
--crimson-red: 3 100% 59%; /* #ff3b30 */

/* Semantic tokens */
--primary: var(--neon-green);
--background: 0 0% 100%;
--foreground: var(--dark-slate);
--background-secondary: 210 30% 98%;
```

### Spacing Tokens

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Typography Tokens

```css
/* Font Sizes */
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 28px;
```

### Animation Tokens

```css
/* Transitions */
--transition-fast: 150ms;
--transition-normal: 250ms;
--transition-slow: 500ms;

/* Easings */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Layout Tokens

```css
/* Z-index layers */
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-modal-backdrop: 40;
--z-modal: 50;
--z-toast: 60;
--z-tooltip: 70;
```

For more details on the design token system, see the [Styling System](#styling-system) section in the README.
