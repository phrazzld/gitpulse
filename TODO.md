# TODO

## Add GitHub Actions and Pre-commit Hooks

- [x] **T001:** Install Required Dev Dependencies

  - **Action:** Execute `npm install --save-dev husky lint-staged eslint-config-prettier` to add these packages as development dependencies. Verify the installation and ensure project builds correctly afterward.
  - **Depends On:** None
  - **AC Ref:** Success Criteria 1, 2

- [x] **T002:** Update package.json with prepare script

  - **Action:** Modify the `scripts` section in `package.json` to include `"prepare": "husky"` to automatically install Git hooks when developers run `npm install`.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1

- [x] **T003:** Initialize Husky

  - **Action:** Run `npx husky init` to create the `.husky` directory and set up the Git hooks infrastructure.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1

- [x] **T004:** Create pre-commit hook

  - **Action:** Create/update the `.husky/pre-commit` hook with the following script:

    ```sh
    #!/usr/bin/env sh
    . "$(dirname -- "$0")/_/husky.sh"

    npx lint-staged
    ```

    Ensure the script is executable with `chmod +x .husky/pre-commit`.

  - **Depends On:** [T003, T005]
  - **AC Ref:** Success Criteria 1

- [x] **T005:** Add lint-staged configuration to package.json

  - **Action:** Add a `lint-staged` section to `package.json` with the following configuration:
    ```json
    "lint-staged": {
      "*.{ts,tsx}": [
        "eslint --fix",
        "tsc --noEmit"
      ],
      "*.{js,jsx,json,md,css}": [
        "prettier --write"
      ]
    }
    ```
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T006:** Review and update ESLint configuration

  - **Action:** Ensure `.eslintrc.js` is properly configured with TypeScript support. It should extend `next/core-web-vitals`, `plugin:@typescript-eslint/recommended`, and `prettier`. Add the rule `"@typescript-eslint/no-explicit-any": "error"` and identify any additional rules from DEVELOPMENT_PHILOSOPHY.md that should be enforced.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T016:** Add file size warnings to pre-commit hook

  - **Action:** Update the lint-staged configuration in `package.json` to include a script that checks file line count and warns when files exceed a reasonable threshold (e.g., 300 lines). Create a simple script in `scripts/check-file-size.js` that will:
    ```js
    // 1. Count lines in staged files
    // 2. When a file exceeds the threshold, print a warning message but allow the commit
    // 3. Include statistics about the largest files in the codebase
    ```
    Then update the lint-staged configuration to invoke this script for relevant file types.
  - **Depends On:** [T005]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T007:** Verify TypeScript strict mode

  - **Action:** Confirm that `tsconfig.json` has `"strict": true` enabled and add other appropriate strictness flags as needed.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T008:** Verify/create npm scripts for CI

  - **Action:** Ensure `package.json` contains the necessary scripts referenced in the CI workflow: `lint`, `typecheck`, and `test`. Create or update them if needed.
  - **Depends On:** [T006, T007]
  - **AC Ref:** Success Criteria 2

- [ ] **T009:** Create GitHub Actions workflow directory

  - **Action:** Create the directory structure `.github/workflows/` if it doesn't exist.
  - **Depends On:** None
  - **AC Ref:** Success Criteria 2

- [ ] **T010:** Implement GitHub Actions workflow

  - **Action:** Create `.github/workflows/ci.yml` with the configuration specified in the implementation plan, including code quality checks (typecheck, lint) and tests for both push and pull request events to main/master branches.
  - **Depends On:** [T008, T009]
  - **AC Ref:** Success Criteria 2, 3

- [ ] **T011:** Update README with code quality documentation

  - **Action:** Add a "Code Quality" section to `README.md` explaining the pre-commit hooks and CI checks as specified in the implementation plan.
  - **Depends On:** [T004, T010]
  - **AC Ref:** Success Criteria 4

- [ ] **T012:** Test pre-commit hook with type error

  - **Action:** Introduce a type error in a TypeScript file, stage the changes, and attempt to commit. Verify the pre-commit hook catches the error and prevents the commit.
  - **Depends On:** [T004, T007]
  - **AC Ref:** Success Criteria 1

- [ ] **T013:** Test pre-commit hook with lint error

  - **Action:** Introduce a linting error in a TypeScript file, stage the changes, and attempt to commit. Verify the pre-commit hook catches the error and prevents the commit.
  - **Depends On:** [T004, T006]
  - **AC Ref:** Success Criteria 1

- [ ] **T014:** Push changes to GitHub and verify CI workflow

  - **Action:** Commit all configuration changes and push to GitHub. Create a PR if applicable. Verify the GitHub Actions workflow runs successfully with the push.
  - **Depends On:** [T010, T011, T012, T013]
  - **AC Ref:** Success Criteria 2, 3

- [ ] **T015:** Test CI workflow failure
  - **Action:** Temporarily introduce an error that would pass the pre-commit hooks but fail in CI (e.g., disable the pre-commit hooks with `--no-verify` and push a failing change). Verify the workflow fails as expected.
  - **Depends On:** [T014]
  - **AC Ref:** Success Criteria 2, 3

## [!] CLARIFICATIONS NEEDED / ASSUMPTIONS

- [ ] **Assumption:** The project already has basic ESLint, Prettier, and TypeScript setup that we're enhancing.

  - **Context:** Implementation Steps 4 assumes `.eslintrc.js` and `tsconfig.json` exist.

- [ ] **Assumption:** The project has a functional test suite that can be run with `npm run test`.

  - **Context:** The CI workflow includes a test job that assumes this script exists and works.

- [ ] **Assumption:** The primary branch is named either `main` or `master`.
  - **Context:** The GitHub Actions workflow is configured to trigger on both names. This may need adjustment based on actual repository configuration.
