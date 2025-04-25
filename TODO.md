# Todo

## Jest Testing Framework
- [x] **T001 · Chore · P1: install jest and related dependencies**
    - **Context:** Jest Testing Framework Implementation > Modules / Packages
    - **Action:**
        1. Run `npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/jest-dom`
    - **Done-when:**
        1. Dependencies are added to `devDependencies` in `package.json`
        2. `node_modules` contains the installed packages
    - **Depends-on:** none

- [x] **T002 · Chore · P1: create jest configuration file**
    - **Context:** Jest Testing Framework Implementation > Configuration Files > jest.config.js
    - **Action:**
        1. Create `jest.config.js` at the project root
        2. Implement the configuration using `next/jest` preset with the structure in the implementation plan
        3. Configure essential settings: `testEnvironment`, `setupFilesAfterEnv`, and `moduleNameMapper`
    - **Done-when:**
        1. `jest.config.js` exists and exports configuration using `next/jest`
        2. File passes validation with `npx jest --showConfig`
        3. Key settings are properly configured for Next.js compatibility
    - **Depends-on:** [T001]

- [ ] **T003 · Chore · P1: configure coverage settings**
    - **Context:** Jest Testing Framework Implementation > Coverage Targets
    - **Action:**
        1. Add coverage-related settings to `jest.config.js`: `collectCoverageFrom`, `coverageThreshold`, and `coverageReporters`
        2. Set global threshold to 70% for branches, functions, lines, and statements
    - **Done-when:**
        1. `jest.config.js` includes properly configured coverage settings
        2. Settings match the specifications in the implementation plan
    - **Depends-on:** [T002]

- [x] **T004 · Chore · P1: create setup file**
    - **Context:** Jest Testing Framework Implementation > Configuration Files > jest.setup.js
    - **Action:**
        1. Create `jest.setup.js` at the project root
        2. Import `@testing-library/jest-dom` to extend Jest with DOM matchers
    - **Done-when:**
        1. `jest.setup.js` exists with the correct imports
        2. File is properly referenced in `jest.config.js`
    - **Depends-on:** [T002]

- [x] **T005 · Chore · P1: add test scripts**
    - **Context:** Jest Testing Framework Implementation > Detailed Build Steps
    - **Action:**
        1. Add scripts for test execution: `"test": "jest"`, `"test:watch": "jest --watch"`, and `"test:coverage": "jest --coverage"`
    - **Done-when:**
        1. Scripts are added to `package.json`
        2. Scripts execute without errors
    - **Depends-on:** [T001]

- [ ] **T006 · Test · P1: create verification test**
    - **Context:** Jest Testing Framework Implementation > Detailed Build Steps
    - **Action:**
        1. Create the directory `src/lib/__tests__` if it doesn't exist
        2. Create a file named `example.test.ts` with a basic test case that verifies Jest is working
    - **Done-when:**
        1. Test file exists with the specified test case
        2. Directory structure follows project conventions
    - **Depends-on:** [T004]

- [ ] **T007 · Test · P1: execute verification test**
    - **Context:** Jest Testing Framework Implementation > Detailed Build Steps
    - **Action:**
        1. Run `npm test` to verify Jest discovers and executes tests
        2. Address any configuration or discovery issues
    - **Done-when:**
        1. Tests run without configuration errors
        2. Example test passes
        3. Test output is displayed correctly in the console
    - **Depends-on:** [T005, T006]

- [ ] **T008 · Test · P1: validate coverage reporting**
    - **Context:** Jest Testing Framework Implementation > Detailed Build Steps
    - **Action:**
        1. Run `npm run test:coverage` to generate a coverage report
        2. Verify coverage metrics and thresholds are properly applied
    - **Done-when:**
        1. Coverage report is generated without errors
        2. Report includes the metrics defined in the configuration
        3. Current coverage meets or is baselined against the thresholds
    - **Depends-on:** [T003, T007]

- [ ] **T009 · Chore · P2: document testing procedures**
    - **Context:** Jest Testing Framework Implementation > Documentation
    - **Action:**
        1. Add a "Testing" section to `README.md`
        2. Document how to run tests, watch mode, and coverage reporting
    - **Done-when:**
        1. README contains clear instructions for running tests
        2. Documentation follows project conventions
    - **Depends-on:** [T007, T008]

### Clarifications & Assumptions
- [x] **Issue:** resolve installation dependencies
    - **Context:** Jest Testing Framework Implementation > Modules / Packages lists `@types/jest`, ensuring it's included in installation
    - **Blocking?:** yes

- [x] **Issue:** decide on test configuration structure
    - **Context:** Jest Testing Framework Implementation > Open Questions about separate vs. unified configs
    - **Blocking?:** no (Implementation plan recommends unified to start)

- [ ] **Issue:** prioritize coverage areas
    - **Context:** Jest Testing Framework Implementation > Open Questions about coverage prioritization
    - **Blocking?:** no (Implementation plan suggests src/lib as initial focus)

- [ ] **Issue:** plan for CI integration
    - **Context:** Jest Testing Framework Implementation > Open Questions about CI configuration
    - **Blocking?:** no (Future consideration)