# todo

## component library setup

- [x] **T001 · chore · p1: create component library directory structure**

  - **context:** Detailed Build Steps #1
  - **action:**
    1. Create `src/components/library/` directory
    2. Create `src/components/library/__tests__/` directory
    3. Create `src/components/library/utils/` directory
  - **done‑when:**
    1. Directory structure exists and is correctly organized
  - **depends‑on:** none

- [x] **T002 · feature · p1: implement class name merging utility**
  - **context:** Detailed Build Steps #2
  - **action:**
    1. Create `src/components/library/utils/cn.ts`
    2. Implement the `cn` function using `clsx` and `tailwind-merge` libraries
    3. Add necessary type definitions and exports
  - **done‑when:**
    1. Utility function works correctly for merging Tailwind classes
    2. Function is exported and can be imported by components
  - **depends‑on:** [T001]

## button component

- [x] **T003 · feature · p1: implement base button component**

  - **context:** Detailed Build Steps #3, Public Interfaces/Contracts
  - **action:**
    1. Create `src/components/library/Button.tsx`
    2. Define `ButtonProps` interface with children, onClick, disabled, variant, size, and type props
    3. Implement component with basic functionality and styling
  - **done‑when:**
    1. Button component renders correctly with children
    2. Component handles click events correctly
    3. TypeScript compilation passes with no errors
  - **depends‑on:** [T001, T002]

- [x] **T004 · feature · p2: implement button variants and styling**

  - **context:** Detailed Build Steps #3 (variants and styling)
  - **action:**
    1. Implement primary, secondary, and danger variants
    2. Implement sm, md, and lg size variants
    3. Style different states (normal, hover, focus, disabled)
  - **done‑when:**
    1. All variants render with correct styling
    2. Different sizes display correctly
    3. Interactive states work properly (hover, focus, etc.)
  - **depends‑on:** [T003]

- [x] **T005 · test · p1: create unit tests for button component**
  - **context:** Detailed Build Steps #7, Testing Strategy
  - **action:**
    1. Create `src/components/library/__tests__/Button.test.tsx`
    2. Test rendering with different variants, sizes, and states
    3. Test click handler functionality and disabled state
  - **done‑when:**
    1. All tests pass
    2. Code coverage meets 90%+ target
  - **depends‑on:** [T004]

## input component

- [x] **T006 · feature · p1: implement base input component**

  - **context:** Detailed Build Steps #4, Public Interfaces/Contracts
  - **action:**
    1. Create `src/components/library/Input.tsx`
    2. Define `InputProps` interface with value, onChange, placeholder, disabled, type, error, and ariaLabel props
    3. Implement component with basic functionality
  - **done‑when:**
    1. Input component renders correctly
    2. Component handles value changes correctly
    3. TypeScript compilation passes with no errors
  - **depends‑on:** [T001, T002]

- [x] **T007 · feature · p2: implement input variants and states**

  - **context:** Detailed Build Steps #4 (states and types)
  - **action:**
    1. Implement different input types (text, password, email)
    2. Implement error and disabled states
    3. Add proper ARIA attributes for accessibility
  - **done‑when:**
    1. Different input types function correctly
    2. Error state displays correctly (styling + aria-invalid)
    3. Disabled state works properly
  - **depends‑on:** [T006]

- [x] **T008 · test · p1: create unit tests for input component**
  - **context:** Detailed Build Steps #7, Testing Strategy
  - **action:**
    1. Create `src/components/library/__tests__/Input.test.tsx`
    2. Test rendering with different types and states
    3. Test onChange handler and value updates
  - **done‑when:**
    1. All tests pass
    2. Code coverage meets 90%+ target
  - **depends‑on:** [T007]

## card component

- [x] **T009 · feature · p2: implement card component**

  - **context:** Detailed Build Steps #5, Public Interfaces/Contracts
  - **action:**
    1. Create `src/components/library/Card.tsx`
    2. Define `CardProps` interface with children and className props
    3. Implement basic container styling using Tailwind classes
  - **done‑when:**
    1. Card component renders children correctly
    2. Component applies proper styling (padding, border, shadow)
    3. Component allows className customization
  - **depends‑on:** [T001, T002]

- [x] **T010 · test · p2: create unit tests for card component**
  - **context:** Detailed Build Steps #7, Testing Strategy
  - **action:**
    1. Create `src/components/library/__tests__/Card.test.tsx`
    2. Test rendering with different children
    3. Test className prop application
  - **done‑when:**
    1. All tests pass
    2. Code coverage meets 90%+ target
  - **depends‑on:** [T009]

## documentation and integration

- [x] **T011 · feature · p2: add TSDoc comments to all components**

  - **context:** Detailed Build Steps #8, Documentation
  - **action:**
    1. Add comprehensive TSDoc comments to all interfaces and props
    2. Add JSDoc comments to component implementations
    3. Document rationales for design decisions
  - **done‑when:**
    1. All components have proper documentation
    2. All props and interfaces are documented
  - **depends‑on:** [T004, T007, T009]

- [x] **T012 · chore · p2: create barrel file for component exports**

  - **context:** Detailed Build Steps #6
  - **action:**
    1. Create `src/components/library/index.ts`
    2. Export all components and their prop interfaces
  - **done‑when:**
    1. Components can be imported from `src/components/library`
    2. TypeScript compilation passes with no errors
  - **depends‑on:** [T004, T007, T009]

- [x] **T013 · test · p2: create integration tests for component composition**

  - **context:** Testing Strategy (Integration Tests)
  - **action:**
    1. Create `src/components/library/__tests__/composition.test.tsx`
    2. Test combinations like Button inside Card
    3. Verify correct rendering and styling isolation
  - **done‑when:**
    1. All tests pass
    2. Components work correctly when composed together
  - **depends‑on:** [T005, T008, T010]

- [ ] **T014 · docs · p2: create component documentation markdown**

  - **context:** Detailed Build Steps #8, Documentation
  - **action:**
    1. Create `docs/components.md`
    2. Add sections for each component with usage examples
    3. Include prop tables and explanations
  - **done‑when:**
    1. Documentation file exists and is comprehensive
    2. Examples show how to use each component
  - **depends‑on:** [T011]

- [ ] **T015 · docs · p2: update README with component library reference**

  - **context:** Detailed Build Steps #8, Documentation
  - **action:**
    1. Add section about component library to main README.md
    2. Link to component documentation
  - **done‑when:**
    1. README references component library
    2. Link to component docs works correctly
  - **depends‑on:** [T014]

- [ ] **T016 · chore · p2: configure CI for component testing**
  - **context:** Detailed Build Steps #9
  - **action:**
    1. Ensure linting and type checking covers component files
    2. Verify tests are run in CI pipeline
  - **done‑when:**
    1. CI successfully runs component tests
    2. Linting and type checking pass for component files
  - **depends‑on:** [T013]

### clarifications & assumptions

- [x] **issue:** confirm location of CSS variables used for styling

  - **context:** Data Flow Diagram (refers to tokens.css)
  - **blocking?:** yes
  - **resolution:** Found CSS variables in `/src/styles/tokens.css` with comprehensive design tokens

- [ ] **issue:** decide whether to add more complex components in this iteration

  - **context:** Open Questions
  - **blocking?:** no

- [ ] **issue:** determine if dark/light theming should be supported

  - **context:** Open Questions
  - **blocking?:** no

- [ ] **issue:** decide if Storybook should be integrated for visual documentation
  - **context:** Open Questions
  - **blocking?:** no
