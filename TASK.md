# TASK

strip the styling all the way down. utmost simplicity.

pretty much strictly shadcn. all custom styling should be nuked. globals.css should be dummy simple.

---

# Enhanced Specification

## Executive Summary

Complete styling overhaul to achieve maximum simplicity by:
- Removing ALL custom CSS and cyberpunk/neon theming
- Implementing strict shadcn/ui components with default styling
- Reducing globals.css to minimal Tailwind setup
- Supporting light/dark mode with shadcn's built-in theming
- Deleting all custom animations and styles immediately

## Research Findings

### Current State Analysis
- **267 lines of custom CSS** with elaborate cyberpunk theme in globals.css
- **646 occurrences** of inline styles across 26 component files
- **No shadcn/ui components** currently installed or configured
- **Heavy CSS variables** for custom theming (--neon-green, --electric-blue, etc.)
- **Custom component classes** (.btn, .card, etc.) that duplicate shadcn functionality

### Industry Best Practices (2025)
- **Component Ownership**: Copy shadcn components directly into codebase for maximum control
- **Zero Runtime Dependencies**: Eliminates version conflicts and reduces bundle size
- **CSS Variables + Tailwind**: Modern theming with minimal globals.css
- **JIT Compilation**: Tailwind v4 provides 5x faster builds with microsecond updates
- **Typical Results**: 80-90% CSS reduction, 3x faster page loads

### Technology Analysis
- **shadcn/ui**: Built on Radix UI primitives with excellent accessibility
- **Tailwind CSS v4**: CSS-first configuration, faster builds, better tree-shaking
- **Component Coverage**: shadcn provides replacements for all current custom components
- **Theming System**: Simple CSS variables for light/dark mode support

## Detailed Requirements

### Functional Requirements
- **Complete Style Migration**: Replace ALL custom styling with shadcn components
- **Dark Mode Support**: Implement light/dark toggle using shadcn theming
- **Component Replacement**: Convert all custom UI components to shadcn equivalents
- **Immediate Cleanup**: Delete old CSS files and styles upon successful migration

### Non-Functional Requirements
- **Simplicity**: Maximum code reduction, minimal configuration
- **Maintainability**: No custom CSS to maintain, only utility classes
- **Accessibility**: Leverage shadcn's built-in ARIA support
- **Performance**: Reduce CSS bundle from ~267 lines to <50 lines

## Architecture Decisions

### Technology Stack
- **Component Library**: shadcn/ui (copy components, not dependency)
- **Styling**: Tailwind CSS v4 with pure utility classes
- **Theming**: shadcn's CSS variable system for light/dark modes
- **No CSS-in-JS**: Pure Tailwind utilities only

### Design Patterns
- **Utility-First**: All styling through Tailwind classes
- **Component Variants**: Use shadcn's variant system for states
- **Theme Variables**: Minimal CSS variables for color theming only
- **No Custom Classes**: Zero custom CSS classes or animations

## Implementation Strategy

### Development Approach
1. **Initialize shadcn/ui** with CLI tool
2. **Configure Tailwind v4** with minimal setup
3. **Replace globals.css** with bare minimum configuration
4. **Migrate all components** to shadcn equivalents
5. **Delete all custom CSS** immediately after migration

### Component Migration Map
```
Custom Component → shadcn Replacement
--------------------------------------
Custom buttons → Button (variants: default, destructive, outline, ghost)
Custom cards → Card (with CardHeader, CardContent, CardFooter)
LoadMoreButton → Button (with loading state)
ModeSelector → RadioGroup or ToggleGroup
AuthLoadingScreen → Card + Skeleton components
Custom inputs → Input, Select, Textarea
Status displays → Badge component
Loading states → Skeleton component
```

### Minimal globals.css Target
```css
@import "tailwindcss";

/* Only if absolutely necessary for theme switching */
```

### Lost Functionality Notes
Document any features that may be impacted:
- Custom hover animations on buttons
- Cyberpunk glow effects
- Dynamic color calculations
- Complex loading animations
- Custom scrollbar styling

## Integration Requirements

### File Changes Required
- **Initialize**: Run `npx shadcn@latest init`
- **Configure**: Create components.json with shadcn settings
- **Update**: Modify tailwind.config.js for v4 best practices
- **Replace**: Convert all 26 component files with inline styles
- **Delete**: Remove AuthLoadingScreen.css and custom style files

### Component API Changes
- No backward compatibility required
- Simplify all component props to match shadcn patterns
- Remove all style-related props
- Use shadcn variant system for visual states

## Testing Strategy

### Manual Testing
- Verify all components render correctly
- Test light/dark mode toggle
- Check responsive behavior
- Validate accessibility features

### Cleanup Validation
- Ensure no inline styles remain
- Verify all custom CSS deleted
- Confirm only Tailwind utilities used
- Check bundle size reduction

## Success Criteria

### Acceptance Criteria
- ✅ Zero custom CSS classes in codebase
- ✅ globals.css under 50 lines
- ✅ All components use shadcn/ui
- ✅ Light/dark mode functional
- ✅ No inline style attributes
- ✅ All custom CSS files deleted

### Visual Changes
- Expect significant visual changes from cyberpunk to clean/minimal
- Default shadcn styling throughout
- Consistent spacing and borders
- Standard color palette

## Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Run `npx shadcn@latest init`
- [ ] Configure for Tailwind CSS v4
- [ ] Choose default theme
- [ ] Add dark mode support
- [ ] Install essential components

### Phase 2: Core Migration (2-3 hours)
- [ ] Replace globals.css with minimal version
- [ ] Convert Button components
- [ ] Convert Card components
- [ ] Convert form components (Input, Select, etc.)
- [ ] Convert layout components

### Phase 3: Cleanup (1 hour)
- [ ] Remove all inline styles
- [ ] Delete custom CSS files
- [ ] Remove unused imports
- [ ] Clean up component props
- [ ] Test all functionality

### Phase 4: Validation (30 min)
- [ ] Verify no custom CSS remains
- [ ] Test light/dark mode toggle
- [ ] Document any lost functionality
- [ ] Commit changes

## Future Enhancements

### Post-Migration Considerations
- Custom theming can be added later via CSS variables
- Additional shadcn components can be installed as needed
- Styling complexity can be gradually reintroduced if required
- Performance monitoring can be added once baseline established

### Deferred Features
- Custom animations (if needed)
- Brand colors (after establishing base)
- Advanced theming options
- Component customizations
