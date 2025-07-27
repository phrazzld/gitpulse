# TODO - Styling Cleanup Remaining Work

## Active Tasks

### High Priority - Complete Styling Migration

- [x] **Remove custom cyber styling from RepositorySection component**
  - Replace `bg-black/30`, `border-blue-500`, shadow effects
  - Standardize all text colors (remove `text-[color]-500` classes)
  - Use shadcn Card/Badge components consistently
  - Files: src/components/dashboard/RepositorySection.tsx
  
  ### Complexity: SIMPLE
  ### Started: 2025-07-27 10:45
  
  ### Context Discovery
  - Single file change: src/components/dashboard/RepositorySection.tsx
  - Component already uses shadcn Card and Badge components
  - Need to remove all custom color classes and cyber theme remnants
  
  ### Execution Log
  [10:46] Started removing custom styling from component
  [10:47] Replaced text-blue-500 with text-muted-foreground
  [10:48] Removed cyber Card styling (bg-black/30, border-blue-500, shadows)
  [10:49] Fixing badge variants and removing custom colors
  [10:50] Standardized stats grid to use default borders
  [10:51] Fixed organization headers and repository indicators
  [10:52] Task completed - all custom colors removed
  
  ### Results
  - ✓ Removed all custom color classes (verified with grep)
  - ✓ Replaced colored status dots with neutral indicators
  - ✓ Used standard Badge variants (secondary, destructive, outline)
  - ✓ Card now uses default shadcn styling
  - ✓ All text uses semantic colors (foreground, muted-foreground, destructive)

- [x] **Remove custom styling from GroupedResultsView component**
  - Remove `bg-slate-900/70`, `backdrop-blur-sm`
  - Replace colored borders with default Card styling
  - Standardize badge variants
  - Files: src/components/GroupedResultsView.tsx
  
  ### Complexity: SIMPLE
  ### Started: 2025-07-27 10:55
  
  ### Context Discovery
  - Single file change: src/components/GroupedResultsView.tsx
  - Component uses Card and Badge from shadcn
  - Need to remove custom background colors and effects
  
  ### Execution Log
  [10:56] Started removing custom styling from component
  [10:57] Identified all custom color classes and effects to remove
  [10:58] Removed bg-slate-900/70 and backdrop-blur-sm from Card
  [10:59] Fixed all text-[color]-500 classes to use semantic colors
  [11:00] Standardized all Badge variants to use secondary/outline
  [11:01] Fixed custom backgrounds (bg-black/30) in badges
  [11:02] Task completed - all custom styling removed
  
  ### Results
  - ✓ Removed bg-slate-900/70 backdrop-blur-sm from Card
  - ✓ Fixed all colored borders (border-[color]-500) 
  - ✓ Replaced all text-[color]-500 with text-muted-foreground
  - ✓ Standardized Badge variants (secondary for metrics, outline for repos)
  - ✓ Removed all bg-[color]/10 and bg-black/30 classes
  - ✓ Verified with grep - no custom colors remaining

### Medium Priority - Final Cleanup

- [x] **Remove remaining custom color classes from all components**
  - Target files: AccountSelector, OrganizationPicker, FilterPanel, SummaryDetails, SummaryView, ActivityFeed, AuthError, OperationsPanel
  - Replace `text-[color]-500` with appropriate shadcn semantic colors
  - Use Badge variants for status indicators
  
  ### Complexity: MEDIUM
  ### Started: 2025-07-27 12:04
  
  ### Context Discovery
  - 8 target files with custom color classes to migrate
  - Pattern analysis shows extensive use of blue-500, green-500, red-500
  - Established patterns: text-foreground, text-muted-foreground, text-destructive
  - Badge variants for status: secondary (success), destructive (error), outline (neutral)
  
  ### Execution Log
  [12:05] Analyzing color usage across all target components
  [12:06] Identified replacement patterns from completed components
  [12:07] Starting with AuthError - replacing red-50/500/600/700/800 with destructive variants
  [12:08] AuthError complete - all red colors replaced with destructive/muted-foreground
  [12:09] AccountSelector - replacing blue-500/green-500 with semantic colors
  [12:10] AccountSelector complete - using primary, accent/50, and default variants
  [12:11] OrganizationPicker - removing slate-900/70, blue-500, green-500
  [12:12] OrganizationPicker complete - removed custom backgrounds, using semantic colors
  [12:13] FilterPanel - removing slate-900/70, shadows, blue-500, green-500
  [12:14] FilterPanel complete - all custom styling removed, using primary/foreground
  [12:15] Batch processing remaining files: SummaryDetails, SummaryView, ActivityFeed, OperationsPanel
  [12:16] SummaryDetails complete - replaced all blue/green-500 with semantic colors
  [12:17] SummaryView complete - fixed badge and pulse indicator colors
  [12:18] ActivityFeed complete - using primary for animations, foreground for text
  [12:19] OperationsPanel complete - replaced conditional colors with muted variants
  
  ### Results
  - ✓ All 8 target components migrated to semantic colors
  - ✓ Zero custom color classes remaining (verified)
  - ✓ Consistent use of shadcn color system throughout
  - ✓ Theme-responsive design with light/dark mode support
  - ✓ Final verification: grep returns 0 custom color classes
  - ✓ Additional files cleaned: AuthLoadingCard, DateRangePicker, Header

- [x] **Fix TypeScript errors in test files**
  - Fix import/export mismatches in component test files
  - Add proper type definitions for test props
  - Files created during priming that need fixes
  
  ### Complexity: SIMPLE
  ### Started: 2025-07-27 12:20
  
  ### Execution Log
  [12:20] Running typecheck to identify TypeScript errors
  [12:21] TypeScript compilation passes without errors
  [12:21] ESLint also passes with no warnings or errors
  [12:22] All test files compile successfully
  
  ### Results
  - ✓ No TypeScript errors found
  - ✓ All test files have proper type definitions
  - ✓ Both `npm run typecheck` and `npm run lint` pass successfully

## Success Criteria

- Zero custom color classes (`text-[color]-500`, `bg-[color]`, `border-[color]-500`)
- All components use shadcn default styling
- No cyber/neon theme remnants
- TypeScript compilation passes without errors
- All tests can be added to git without pre-commit hook failures

## Notes

- Follow patterns from successfully migrated components (DateRangePicker, FilterPanel headers)
- Use default shadcn colors: foreground, muted-foreground, destructive, etc.
- Badges should use standard variants: default, secondary, destructive, outline
- Keep functionality intact while removing custom styling