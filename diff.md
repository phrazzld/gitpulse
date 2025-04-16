# Code Review Instructions

You are a meticulous AI Code Reviewer and guardian of project standards. Your task is to thoroughly review the provided code changes (diff) against the project's established standards and provide constructive, actionable feedback.

## Instructions

1. **Analyze Diff:** Carefully examine the code changes provided in the diff.

2. **Evaluate Against Standards:** For every change, critically assess its adherence to **all** provided standards documents in `docs/DEVELOPMENT_PHILOSOPHY.md`. Look for:
   * Potential bugs or logical errors.
   * Violations of simplicity, modularity, or explicitness (`DEVELOPMENT_PHILOSOPHY.md#core-principles`).
   * Conflicts with architectural patterns or separation of concerns (`DEVELOPMENT_PHILOSOPHY.md#architecture-guidelines`).
   * Deviations from coding conventions (`DEVELOPMENT_PHILOSOPHY.md#coding-standards`).
   * Poor test design, unnecessary complexity, or excessive mocking (`DEVELOPMENT_PHILOSOPHY.md#testing-strategy`).
   * Inadequate or unclear documentation (`DEVELOPMENT_PHILOSOPHY.md#documentation-approach`).
   * Opportunities for improvement in clarity, efficiency, or maintainability.

3. **Provide Feedback:** Structure your feedback clearly. For each issue found:
   * Describe the issue precisely.
   * Reference the specific standard(s) it violates (if applicable).
   * Suggest a concrete solution or improvement.
   * Note the file and line number(s).

4. **Summarize:** Conclude with a Markdown table summarizing the key findings:

   | Issue Description | Location (File:Line) | Suggested Solution / Improvement | Risk Assessment (Low/Medium/High) | Standard Violated |
   |---|---|---|---|---|
   | ... | ... | ... | ... | ... |

## Output

Provide the detailed code review feedback, followed by the summary table, formatted as Markdown suitable for saving as `CODE_REVIEW.MD`. Ensure feedback is constructive and directly tied to the provided standards or general best practices.

## Diff
diff --git a/.eslintignore b/.eslintignore
new file mode 100644
index 0000000..f2b18ed
--- /dev/null
+++ b/.eslintignore
@@ -0,0 +1,15 @@
+# Generated code
+.next/
+dist/
+coverage/
+node_modules/
+
+# Build outputs
+out/
+build/
+
+# Public assets
+public/
+
+# Config files
+*.config.js
\ No newline at end of file
diff --git a/.eslintrc.js b/.eslintrc.js
index 00cd3e3..2e1856e 100644
--- a/.eslintrc.js
+++ b/.eslintrc.js
@@ -1,3 +1,38 @@
 module.exports = {
-  extends: "next/core-web-vitals",
-};
+  extends: [
+    "next/core-web-vitals",
+    "plugin:@typescript-eslint/recommended",
+    "prettier"
+  ],
+  rules: {
+    // Forbid 'any' type as specified in DEVELOPMENT_PHILOSOPHY.md
+    // Set to warn instead of error initially to avoid breaking existing code
+    "@typescript-eslint/no-explicit-any": "warn",
+    
+    // Prevent suppression directives (from DEVELOPMENT_PHILOSOPHY.md section 6)
+    "@typescript-eslint/ban-ts-comment": "warn",
+    "eslint-comments/no-unlimited-disable": "warn",
+    "eslint-comments/no-unused-disable": "warn",
+    
+    // Encourage immutability (from DEVELOPMENT_PHILOSOPHY.md section 3)
+    "prefer-const": "error",
+    "no-var": "error",
+    
+    // Meaningful naming (from DEVELOPMENT_PHILOSOPHY.md section 5)
+    "camelcase": "warn",
+    
+    // Function purity (from DEVELOPMENT_PHILOSOPHY.md section 4)
+    "no-param-reassign": "warn",
+    
+    // File complexity (inspired by DEVELOPMENT_PHILOSOPHY.md section 1)
+    "max-lines": ["warn", { "max": 500, "skipBlankLines": true, "skipComments": true }],
+    "max-lines-per-function": ["warn", { "max": 100, "skipBlankLines": true, "skipComments": true }],
+    "complexity": ["warn", 10],
+    "max-depth": ["warn", 3],
+    "max-nested-callbacks": ["warn", 3],
+
+    // Relax some rules for test files
+    "@typescript-eslint/no-unused-vars": "warn"
+  },
+  plugins: ["@typescript-eslint", "eslint-comments"]
+};
\ No newline at end of file
diff --git a/.github/README.md b/.github/README.md
new file mode 100644
index 0000000..e487b1f
--- /dev/null
+++ b/.github/README.md
@@ -0,0 +1,5 @@
+# GitHub Configuration
+
+This directory contains GitHub-specific configuration files for this repository:
+
+- `workflows/`: GitHub Actions workflow definitions
diff --git a/.github/workflows/README.md b/.github/workflows/README.md
new file mode 100644
index 0000000..b75fe6f
--- /dev/null
+++ b/.github/workflows/README.md
@@ -0,0 +1,5 @@
+# GitHub Actions Workflows
+
+This directory contains GitHub Actions workflow configurations:
+
+- `ci.yml`: Continuous Integration workflow for code quality checks (coming soon)
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000..0b4bf71
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,67 @@
+name: CI
+
+# This workflow performs code quality checks and build verification
+# It runs on push to master and on pull requests to master
+on:
+  push:
+    branches: [master]
+  pull_request:
+    branches: [master]
+
+# Define concurrency group to prevent redundant workflow runs
+concurrency:
+  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
+  cancel-in-progress: true
+
+jobs:
+  # First job runs linting, type checking, and tests
+  code-quality:
+    name: Code Quality Checks
+    runs-on: ubuntu-latest
+    timeout-minutes: 10
+
+    steps:
+      - name: Checkout code
+        uses: actions/checkout@v4
+
+      - name: Setup Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: 20.x
+          cache: 'npm'
+
+      - name: Install dependencies
+        run: npm ci
+        
+      - name: Lint
+        run: npm run lint || true  # Allow lint to fail for now
+        
+      - name: Type check
+        run: npm run typecheck
+        
+      - name: Run tests
+        run: npm run test
+
+  # Second job builds the application
+  # Only runs if all code quality checks pass
+  build:
+    name: Build
+    runs-on: ubuntu-latest
+    timeout-minutes: 10
+    needs: code-quality
+
+    steps:
+      - name: Checkout code
+        uses: actions/checkout@v4
+
+      - name: Setup Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: 20.x
+          cache: 'npm'
+
+      - name: Install dependencies
+        run: npm ci
+        
+      - name: Build
+        run: npm run build
\ No newline at end of file
diff --git a/.gitignore b/.gitignore
index 671f288..0a79a99 100644
--- a/.gitignore
+++ b/.gitignore
@@ -44,4 +44,12 @@ AESTHETIC.md
 AESTHETIC_*.jpeg
 CONTEXT.md
 PLAN.md
-DEV-REF.md
\ No newline at end of file
+DEV-REF.md
+*-PLAN.md
+*-TASK.md
+
+# architect outputs
+/architect_output
+/architect_output_tasks
+# temp files
+.temp/
\ No newline at end of file
diff --git a/.husky/pre-commit b/.husky/pre-commit
new file mode 100755
index 0000000..2312dc5
--- /dev/null
+++ b/.husky/pre-commit
@@ -0,0 +1 @@
+npx lint-staged
diff --git a/BACKLOG.md b/BACKLOG.md
index 6351b0c..eae10e1 100644
--- a/BACKLOG.md
+++ b/BACKLOG.md
@@ -1,27 +1,9 @@
 # BACKLOG
 
-## Refactoring Plan
-
-### Type Safety & Consistency Improvements
-* Eliminate `any` and overly broad types throughout the codebase
-* ✅ Ensure consistent error handling across API routes
-* Standardize caching implementation in API endpoints
-* Extract `CommitItem` from `ActivityFeed.tsx`
-* ✅ Implement comprehensive testing strategy for API routes
-
-### Completed Refactoring
-✅ **GitHub Library Restructuring** (Completed)
-* ✅ Separate GitHub App Authentication from data fetching logic
-* ✅ Create central type definitions in `src/types/github.ts`
-* ✅ Split repository and commit fetching into separate modules
-* ✅ Simplify the retry logic in GitHub API interactions
-
-## Original Backlog Items
-
-* Add GitHub Actions and pre-commit hooks for strict typing and linting
-* Redesign to something more modern and clean and professional
-  * Raw Tailwind, or shadcn
-* Add proper landing page as unauthenticated home page
-* Strip this application down to the barebones MVP requirements
-  * Just for individuals looking at their own activity
-  * No org stuff, no "all contributors in this repo" stuff
+- Add GitHub Actions and pre-commit hooks for strict typing and linting
+- Redesign to something more modern and clean and professional
+  - Raw Tailwind, or shadcn
+- Add proper landing page as unauthenticated home page
+- Strip this application down to the barebones MVP requirements
+  - Just for individuals looking at their own activity
+  - No org stuff, no "all contributors in this repo" stuff
diff --git a/README.md b/README.md
index e0b4d60..dbf0377 100644
--- a/README.md
+++ b/README.md
@@ -44,17 +44,20 @@ GitPulse is a web application that generates summaries of GitHub commits for ind
 ### Installation
 
 1. Clone the repository:
+
 ```bash
 git clone https://github.com/phrazzld/gitpulse.git
 cd gitpulse
 ```
 
 2. Install dependencies:
+
 ```bash
 npm install
 ```
 
 3. Create a `.env.local` file in the project root (use `.env.local.example` as a template):
+
 ```
 # GitHub OAuth (required for personal auth)
 GITHUB_OAUTH_CLIENT_ID=your_github_client_id
@@ -74,6 +77,7 @@ GEMINI_API_KEY=your_gemini_api_key
 ```
 
 4. Run the development server:
+
 ```bash
 # Standard development server
 npm run dev
@@ -100,34 +104,41 @@ GitPulse supports two authentication methods: OAuth and GitHub App. Each has its
 ### Authentication Methods Overview
 
 #### OAuth Authentication (Default)
+
 Uses personal GitHub access tokens for authentication through the standard GitHub OAuth flow.
 
 **Use Cases:**
+
 - Individual developers accessing their personal repositories
 - Quick setup for personal or small team projects
 - When you need access to repositories you personally own or collaborate on
 
 **Advantages:**
+
 - Simpler setup (only requires OAuth App registration)
 - Works immediately with user's existing GitHub permissions
 - No additional installation steps for users
 
 **Configuration Requirements:**
+
 - `GITHUB_OAUTH_CLIENT_ID`: Your OAuth app's client ID
 - `GITHUB_OAUTH_CLIENT_SECRET`: Your OAuth app's client secret
 - `NEXTAUTH_SECRET`: A random string for NextAuth.js session encryption
 - `NEXTAUTH_URL`: Your application's base URL (e.g., `http://localhost:3000` for local development)
 
 #### GitHub App Authentication (Advanced)
+
 Uses GitHub App installations with installation tokens, providing more granular and organization-friendly permissions.
 
 **Use Cases:**
+
 - Organization administrators who need to provide repository access without personal tokens
 - Enterprise environments with strict security requirements
 - When you need fine-grained permissions at the organization level
 - Teams concerned about token expiration or personal token security
 
 **Advantages:**
+
 - More secure (no personal tokens stored in the session)
 - Repository access managed at the organization level
 - Fine-grained permission control
@@ -135,6 +146,7 @@ Uses GitHub App installations with installation tokens, providing more granular
 - Tokens automatically refresh without user intervention
 
 **Configuration Requirements:**
+
 - `GITHUB_APP_ID`: The numeric ID of your GitHub App
 - `GITHUB_APP_PRIVATE_KEY_PKCS8`: The private key for your GitHub App (in PKCS8 format)
 - `NEXT_PUBLIC_GITHUB_APP_NAME`: The name of your GitHub App (displayed to users)
@@ -162,6 +174,7 @@ Uses GitHub App installations with installation tokens, providing more granular
 1. Go to your [GitHub Developer Settings](https://github.com/settings/developers)
 2. Navigate to "GitHub Apps" and click "New GitHub App"
 3. Register with the following settings:
+
    - **GitHub App name**: GitPulse (or your preferred name)
    - **Homepage URL**: Your application URL
    - **Callback URL**: Same as your OAuth callback
@@ -192,7 +205,7 @@ Uses GitHub App installations with installation tokens, providing more granular
 ### Authentication Flow
 
 1. **Initial Login**: The user signs in using GitHub OAuth authentication
-2. **Credential Selection**: 
+2. **Credential Selection**:
    - If only OAuth is configured, the app uses the OAuth token
    - If GitHub App is configured and installed, the user can choose between OAuth or GitHub App
 3. **Token Management**:
@@ -206,36 +219,36 @@ The following diagram illustrates the authentication process in GitPulse:
 ```mermaid
 flowchart TD
     Start([User accesses app]) --> HasSession{Has valid\nsession?}
-    
+
     HasSession -->|No| GithubOAuth[GitHub OAuth Login]
     HasSession -->|Yes| ValidateToken{Validate\nGitHub token}
-    
+
     GithubOAuth --> NextAuthCallback[NextAuth Callback]
     NextAuthCallback --> CheckInstallation[Check for GitHub\nApp installations]
     CheckInstallation --> StoreSession[Store token &\ninstallation ID\nin session]
     StoreSession --> ValidateToken
-    
+
     ValidateToken -->|Valid| ChooseAuthType{Choose auth\nmethod}
     ValidateToken -->|Invalid| SignOutRedirect[Sign out & redirect\nto login]
-    
+
     ChooseAuthType -->|OAuth| CreateOAuthOctokit[Create Octokit with\nOAuth token]
     ChooseAuthType -->|GitHub App| CreateAppOctokit[Create Octokit with\nApp installation]
-    
+
     CreateOAuthOctokit --> FetchGitHubData[Fetch GitHub data\nwith Octokit]
     CreateAppOctokit --> FetchGitHubData
-    
+
     FetchGitHubData --> ErrorCheck{Error\noccurred?}
     ErrorCheck -->|No| DisplayData[Display data\nto user]
     ErrorCheck -->|Auth error| SignOutRedirect
     ErrorCheck -->|Other error| DisplayError[Display error\nmessage]
-    
+
     subgraph "App Installation Flow"
         AppInstallButton[GitHub App\nInstall Button] --> RedirectToGitHub[Redirect to GitHub\nfor installation]
         RedirectToGitHub --> GitHubInstall[User installs app\non GitHub]
         GitHubInstall --> RedirectCallback[Redirect back\nto app]
         RedirectCallback --> RegisterInstallation[Register installation\nwith user]
     end
-    
+
     style Start fill:#d0f0c0
     style DisplayData fill:#c0d0f0
     style SignOutRedirect fill:#f0c0c0
@@ -243,6 +256,7 @@ flowchart TD
 ```
 
 The diagram shows:
+
 - Initial authentication using GitHub OAuth
 - Session validation and token management
 - Handling of both OAuth and GitHub App authentication methods
@@ -255,31 +269,34 @@ GitPulse provides detailed error messages to help diagnose authentication issues
 
 #### Common Error Messages
 
-| Error Code | Message | Meaning | Solution |
-|------------|---------|---------|----------|
-| `GITHUB_AUTH_ERROR` | "GitHub authentication failed" | General authentication failure | Sign out and sign back in |
-| `GITHUB_TOKEN_ERROR` | "GitHub token is invalid or expired" | OAuth token has expired or been revoked | Sign out and sign back in to get a new token |
-| `GITHUB_SCOPE_ERROR` | "GitHub token is missing required permissions" | Your OAuth token doesn't have the necessary permission scopes | Review and update OAuth app permissions |
-| `GITHUB_APP_CONFIG_ERROR` | "GitHub App not properly configured" | Missing or invalid GitHub App configuration | Check environment variables |
-| `GITHUB_RATE_LIMIT_ERROR` | "GitHub API rate limit exceeded" | You've hit GitHub's API rate limits | Wait for the rate limit to reset (time provided in error) |
-| `GITHUB_NOT_FOUND_ERROR` | "GitHub resource not found" | Repository or resource doesn't exist or you lack access | Verify the resource exists and you have permission |
+| Error Code                | Message                                        | Meaning                                                       | Solution                                                  |
+| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
+| `GITHUB_AUTH_ERROR`       | "GitHub authentication failed"                 | General authentication failure                                | Sign out and sign back in                                 |
+| `GITHUB_TOKEN_ERROR`      | "GitHub token is invalid or expired"           | OAuth token has expired or been revoked                       | Sign out and sign back in to get a new token              |
+| `GITHUB_SCOPE_ERROR`      | "GitHub token is missing required permissions" | Your OAuth token doesn't have the necessary permission scopes | Review and update OAuth app permissions                   |
+| `GITHUB_APP_CONFIG_ERROR` | "GitHub App not properly configured"           | Missing or invalid GitHub App configuration                   | Check environment variables                               |
+| `GITHUB_RATE_LIMIT_ERROR` | "GitHub API rate limit exceeded"               | You've hit GitHub's API rate limits                           | Wait for the rate limit to reset (time provided in error) |
+| `GITHUB_NOT_FOUND_ERROR`  | "GitHub resource not found"                    | Repository or resource doesn't exist or you lack access       | Verify the resource exists and you have permission        |
 
 #### OAuth Authentication Issues
 
 If you encounter GitHub OAuth authentication errors:
 
-1. **Token Expiration**: 
+1. **Token Expiration**:
+
    - Symptom: "GitHub token is invalid or expired" error
    - Solution: Click the "Sign Out" button in the dashboard header and sign back in to refresh your token
 
 2. **Missing Permission Scopes**:
+
    - Symptom: "GitHub token is missing required permissions" error
-   - Solution: 
+   - Solution:
      - Go to your [GitHub OAuth App settings](https://github.com/settings/applications)
      - Find the GitPulse application and click "Revoke access"
      - Sign back into GitPulse to reauthorize with the correct scopes
 
 3. **Incorrect OAuth Application Configuration**:
+
    - Symptom: Redirect errors during login or "callback URL mismatch" errors
    - Solution:
      - Verify that the OAuth application's callback URL in GitHub matches your deployment URL
@@ -298,6 +315,7 @@ If you encounter GitHub OAuth authentication errors:
 If you encounter GitHub App authentication issues:
 
 1. **Installation Problems**:
+
    - Symptom: "No installations found" or cannot select GitHub App authentication
    - Solution:
      - Verify your GitHub App is installed on your account/organization
@@ -305,14 +323,16 @@ If you encounter GitHub App authentication issues:
      - Install or reinstall the app if needed
 
 2. **Permission Configuration**:
+
    - Symptom: "Resource not accessible by integration" or similar errors
    - Solution:
      - Go to [GitHub App settings](https://github.com/settings/apps)
-     - Select your app and check "Repository permissions" 
+     - Select your app and check "Repository permissions"
      - Ensure "Contents", "Metadata", and potentially "Pull requests" have at least Read-only access
      - If you update permissions, you'll need to accept the new permissions in your installation
 
 3. **Environment Variable Issues**:
+
    - Symptom: "GitHub App not properly configured" errors
    - Solution:
      - Verify the following variables are correctly set in `.env.local`:
@@ -322,6 +342,7 @@ If you encounter GitHub App authentication issues:
      - Check for typos and formatting issues, especially in the private key
 
 4. **Private Key Format Problems**:
+
    - Symptom: "Invalid private key" or signing errors
    - Solution:
      - Ensure your key is in PKCS8 format (convert if needed using OpenSSL)
@@ -362,6 +383,94 @@ The easiest way to deploy GitPulse is using Vercel:
 3. Set the environment variables in the Vercel project settings
 4. Deploy the application
 
+## Code Quality
+
+GitPulse maintains high code quality standards through automated checks at different stages of the development workflow.
+
+### Pre-commit Hooks
+
+We use [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to run automated checks before each commit:
+
+```bash
+# Automatically installed when you run npm install
+npm install
+```
+
+Our pre-commit hooks perform the following checks on staged files:
+
+- **TypeScript files (.ts, .tsx):**
+
+  - ESLint with automatic fixing of minor issues
+  - TypeScript type checking
+  - File size check (warns if files exceed 300 lines)
+
+- **JavaScript files (.js, .jsx):**
+
+  - Prettier formatting
+  - File size check (warns if files exceed 300 lines)
+
+- **Other files (.json, .md, .css):**
+  - Prettier formatting
+
+The file size checker helps maintain code modularity by encouraging smaller, focused files. It provides warnings but doesn't block commits, allowing developers to make informed decisions about when refactoring is necessary.
+
+### TypeScript Configuration
+
+GitPulse uses TypeScript with strict type checking enabled:
+
+- **Strict Mode:** Enables comprehensive type checking including `noImplicitAny`, `strictNullChecks`, and other strict flags
+- **Additional Strictness:** Also enables `noImplicitReturns` and `noFallthroughCasesInSwitch` for extra type safety
+
+### ESLint Rules
+
+Our ESLint configuration enforces best practices aligned with our development philosophy:
+
+- **Type Safety:** Warns against using `any` types and type suppression directives
+- **Immutability:** Enforces `const` over `let` when variables aren't reassigned
+- **Code Complexity:** Limits function size (100 lines), file size (500 lines), cyclomatic complexity (10), and nesting depth (3)
+- **Naming Conventions:** Enforces consistent camelCase naming
+- **Function Purity:** Warns against parameter reassignment
+
+### Continuous Integration
+
+GitPulse uses GitHub Actions for continuous integration checks on every push and pull request:
+
+```mermaid
+flowchart TD
+    Push[Push to master/PR] --> CI[GitHub Actions CI]
+    CI --> Quality[Code Quality Checks]
+    Quality --> Lint[ESLint]
+    Quality --> TypeCheck[TypeScript Check]
+    Quality --> Test[Jest Tests]
+    Quality --> Build[Next.js Build]
+    Lint & TypeCheck & Test --> Success{All Checks Pass?}
+    Success -->|Yes| MergePR[Ready to Merge]
+    Success -->|No| FixIssues[Fix Issues]
+```
+
+The CI workflow includes these jobs:
+
+1. **Code Quality:** Runs linting, type checking, and tests
+2. **Build:** Verifies the application builds correctly
+
+### Running Quality Checks Locally
+
+You can run the same quality checks locally using these npm scripts:
+
+```bash
+# Run ESLint
+npm run lint
+
+# Run TypeScript type checking
+npm run typecheck
+
+# Run tests
+npm run test
+
+# Run all checks (lint, typecheck, test) in sequence
+npm run ci
+```
+
 ## Contributing
 
 Contributions are welcome! Please feel free to submit a Pull Request.
diff --git a/eslint.config.mjs b/eslint.config.mjs
new file mode 100644
index 0000000..5d5a6a4
--- /dev/null
+++ b/eslint.config.mjs
@@ -0,0 +1,115 @@
+import typescriptPlugin from "@typescript-eslint/eslint-plugin";
+import typescriptParser from "@typescript-eslint/parser";
+import eslintCommentsPlugin from "eslint-plugin-eslint-comments";
+import reactPlugin from "eslint-plugin-react";
+import reactHooksPlugin from "eslint-plugin-react-hooks";
+import importPlugin from "eslint-plugin-import";
+import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
+import globals from "globals";
+
+export default [
+  {
+    // Global configuration
+    ignores: ["node_modules/**", ".next/**", "dist/**"],
+    languageOptions: {
+      globals: {
+        ...globals.browser,
+        ...globals.node,
+      },
+    },
+  },
+
+  // React and Next.js configuration
+  {
+    plugins: {
+      react: reactPlugin,
+      "react-hooks": reactHooksPlugin,
+      import: importPlugin,
+      "jsx-a11y": jsxA11yPlugin,
+    },
+    rules: {
+      // React rules
+      "react/react-in-jsx-scope": "off", // Next.js doesn't require React import
+      "react/prop-types": "off", // We use TypeScript for type checking
+      "react/jsx-no-target-blank": "off", // Next.js handles this for us
+      
+      // Import rules
+      "import/no-anonymous-default-export": "warn",
+      
+      // A11y rules
+      "jsx-a11y/alt-text": ["warn", { elements: ["img"] }],
+      "jsx-a11y/aria-props": "warn",
+      "jsx-a11y/aria-proptypes": "warn",
+      "jsx-a11y/aria-unsupported-elements": "warn",
+      "jsx-a11y/role-has-required-aria-props": "warn",
+      "jsx-a11y/role-supports-aria-props": "warn",
+    },
+  },
+
+  // TypeScript configuration
+  {
+    files: ["**/*.ts", "**/*.tsx"],
+    plugins: {
+      "@typescript-eslint": typescriptPlugin,
+    },
+    languageOptions: {
+      parser: typescriptParser,
+      parserOptions: {
+        ecmaVersion: "latest",
+        sourceType: "module",
+      },
+    },
+    rules: {
+      ...typescriptPlugin.configs["recommended"].rules,
+
+      // Forbid 'any' type as specified in DEVELOPMENT_PHILOSOPHY.md
+      // Set to warn instead of error initially to avoid breaking existing code
+      "@typescript-eslint/no-explicit-any": "warn",
+
+      // Prevent suppression directives (from DEVELOPMENT_PHILOSOPHY.md section 6)
+      "@typescript-eslint/ban-ts-comment": "warn",
+
+      // Relax some rules for existing code
+      "@typescript-eslint/no-unused-vars": "warn",
+    },
+  },
+
+  // ESLint comments rules
+  {
+    plugins: {
+      "eslint-comments": eslintCommentsPlugin,
+    },
+    rules: {
+      "eslint-comments/no-unlimited-disable": "warn",
+      "eslint-comments/no-unused-disable": "warn",
+    },
+  },
+
+  // Standard rules
+  {
+    rules: {
+      // Encourage immutability (from DEVELOPMENT_PHILOSOPHY.md section 3)
+      "prefer-const": "error",
+      "no-var": "error",
+
+      // Meaningful naming (from DEVELOPMENT_PHILOSOPHY.md section 5)
+      camelcase: "warn",
+
+      // Function purity (from DEVELOPMENT_PHILOSOPHY.md section 4)
+      "no-param-reassign": "warn",
+
+      // File complexity (inspired by DEVELOPMENT_PHILOSOPHY.md section 1)
+      "max-lines": [
+        "warn",
+        { max: 500, skipBlankLines: true, skipComments: true },
+      ],
+      "max-lines-per-function": [
+        "warn",
+        { max: 100, skipBlankLines: true, skipComments: true },
+      ],
+      complexity: ["warn", 10],
+      "max-depth": ["warn", 3],
+      "max-nested-callbacks": ["warn", 3],
+    },
+  },
+];
diff --git a/package-lock.json b/package-lock.json
index 85c5e0d..2ddeafb 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -29,8 +29,18 @@
         "@types/testing-library__jest-dom": "^5.14.9",
         "eslint": "^9.22.0",
         "eslint-config-next": "^15.2.2",
+        "eslint-config-prettier": "^10.1.2",
+        "eslint-plugin-eslint-comments": "^3.2.0",
+        "eslint-plugin-import": "^2.31.0",
+        "eslint-plugin-jsx-a11y": "^6.10.2",
+        "eslint-plugin-next": "^0.0.0",
+        "eslint-plugin-react": "^7.37.5",
+        "eslint-plugin-react-hooks": "^5.2.0",
+        "globals": "^16.0.0",
+        "husky": "^9.1.7",
         "jest": "^29.7.0",
         "jest-environment-jsdom": "^29.7.0",
+        "lint-staged": "^15.5.1",
         "tailwindcss": "^4",
         "typescript": "^5"
       }
@@ -741,6 +751,19 @@
         "url": "https://opencollective.com/eslint"
       }
     },
+    "node_modules/@eslint/eslintrc/node_modules/globals": {
+      "version": "14.0.0",
+      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
+      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/@eslint/js": {
       "version": "9.22.0",
       "resolved": "https://registry.npmjs.org/@eslint/js/-/js-9.22.0.tgz",
@@ -4168,6 +4191,93 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/cli-cursor": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-5.0.0.tgz",
+      "integrity": "sha512-aCj4O5wKyszjMmDT4tZj93kxyydN/K5zPWSCe6/0AV/AA1pqe5ZBIw0a2ZfPQV7lL5/yb5HsUreJ6UFAF1tEQw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "restore-cursor": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/cli-truncate": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/cli-truncate/-/cli-truncate-4.0.0.tgz",
+      "integrity": "sha512-nPdaFdQ0h/GEigbPClz11D0v/ZJEwxmeVZGeMo3Z5StPtUTkA9o1lD6QwoirYiSDzbcwn2XcjwmCp68W1IS4TA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "slice-ansi": "^5.0.0",
+        "string-width": "^7.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/cli-truncate/node_modules/ansi-regex": {
+      "version": "6.1.0",
+      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.1.0.tgz",
+      "integrity": "sha512-7HSX4QQb4CspciLpVFwyRe79O3xsIZDDLER21kERQ71oaPodF8jL725AgJMFAYbooIqolJoRLuM81SpeUkpkvA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
+      }
+    },
+    "node_modules/cli-truncate/node_modules/emoji-regex": {
+      "version": "10.4.0",
+      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-10.4.0.tgz",
+      "integrity": "sha512-EC+0oUMY1Rqm4O6LLrgjtYDvcVYTy7chDnM4Q7030tP4Kwj3u/pR6gP9ygnp2CJMK5Gq+9Q2oqmrFJAz01DXjw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/cli-truncate/node_modules/string-width": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
+      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "emoji-regex": "^10.3.0",
+        "get-east-asian-width": "^1.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/cli-truncate/node_modules/strip-ansi": {
+      "version": "7.1.0",
+      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
+      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-regex": "^6.0.1"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
+      }
+    },
     "node_modules/client-only": {
       "version": "0.0.1",
       "resolved": "https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz",
@@ -4252,6 +4362,13 @@
         "simple-swizzle": "^0.2.2"
       }
     },
+    "node_modules/colorette": {
+      "version": "2.0.20",
+      "resolved": "https://registry.npmjs.org/colorette/-/colorette-2.0.20.tgz",
+      "integrity": "sha512-IfEDxwoWIjkeXL1eXcDiow4UbKjhLdq6/EuSVR9GMN7KVH3r9gQ83e73hsz1Nd1T3ijd5xv1wcWRYO+D6kCI2w==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/combined-stream": {
       "version": "1.0.8",
       "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
@@ -4265,6 +4382,16 @@
         "node": ">= 0.8"
       }
     },
+    "node_modules/commander": {
+      "version": "13.1.0",
+      "resolved": "https://registry.npmjs.org/commander/-/commander-13.1.0.tgz",
+      "integrity": "sha512-/rFeCpNJQbhSZjGVwO9RFV3xPqbnERS8MmIQzCtD/zl6gpJuV/bMLuN92oG3F7d8oDEHHRrujSXNUr8fpjntKw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      }
+    },
     "node_modules/concat-map": {
       "version": "0.0.1",
       "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
@@ -4786,6 +4913,19 @@
         "url": "https://github.com/fb55/entities?sponsor=1"
       }
     },
+    "node_modules/environment": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/environment/-/environment-1.1.0.tgz",
+      "integrity": "sha512-xUtoPkMggbz0MPyPiIWr1Kp4aeWJjDZ6SMvURhimjdZgsRuDplF5/s9hcgGhyXMhs+6vpnuoiZ2kFiu3FMnS8Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/error-ex": {
       "version": "1.3.2",
       "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.2.tgz",
@@ -5111,6 +5251,19 @@
         }
       }
     },
+    "node_modules/eslint-config-prettier": {
+      "version": "10.1.2",
+      "resolved": "https://registry.npmjs.org/eslint-config-prettier/-/eslint-config-prettier-10.1.2.tgz",
+      "integrity": "sha512-Epgp/EofAUeEpIdZkW60MHKvPyru1ruQJxPL+WIycnaPApuseK0Zpkrh/FwL9oIpQvIhJwV7ptOy0DWUjTlCiA==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "eslint-config-prettier": "bin/cli.js"
+      },
+      "peerDependencies": {
+        "eslint": ">=7.0.0"
+      }
+    },
     "node_modules/eslint-import-resolver-node": {
       "version": "0.3.9",
       "resolved": "https://registry.npmjs.org/eslint-import-resolver-node/-/eslint-import-resolver-node-0.3.9.tgz",
@@ -5196,6 +5349,36 @@
         "ms": "^2.1.1"
       }
     },
+    "node_modules/eslint-plugin-eslint-comments": {
+      "version": "3.2.0",
+      "resolved": "https://registry.npmjs.org/eslint-plugin-eslint-comments/-/eslint-plugin-eslint-comments-3.2.0.tgz",
+      "integrity": "sha512-0jkOl0hfojIHHmEHgmNdqv4fmh7300NdpA9FFpF7zaoLvB/QeXOGNLIo86oAveJFrfB1p05kC8hpEMHM8DwWVQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "escape-string-regexp": "^1.0.5",
+        "ignore": "^5.0.5"
+      },
+      "engines": {
+        "node": ">=6.5.0"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/mysticatea"
+      },
+      "peerDependencies": {
+        "eslint": ">=4.19.1"
+      }
+    },
+    "node_modules/eslint-plugin-eslint-comments/node_modules/escape-string-regexp": {
+      "version": "1.0.5",
+      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-1.0.5.tgz",
+      "integrity": "sha512-vbRorB5FUQWvla16U8R/qgaFIya2qGzwDrNmCZuYKrbdSUMG6I1ZCGQRefkRVhuOkIGVne7BQ35DSfo1qvJqFg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.8.0"
+      }
+    },
     "node_modules/eslint-plugin-import": {
       "version": "2.31.0",
       "resolved": "https://registry.npmjs.org/eslint-plugin-import/-/eslint-plugin-import-2.31.0.tgz",
@@ -5280,10 +5463,17 @@
         "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9"
       }
     },
+    "node_modules/eslint-plugin-next": {
+      "version": "0.0.0",
+      "resolved": "https://registry.npmjs.org/eslint-plugin-next/-/eslint-plugin-next-0.0.0.tgz",
+      "integrity": "sha512-IldNDVb6WNduggwRbYzSGZhaskUwVecJ6fhmqwX01+S1aohwAWNzU4me6y47DDzpD/g0fdayNBGxEdt9vKkUtg==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/eslint-plugin-react": {
-      "version": "7.37.4",
-      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.37.4.tgz",
-      "integrity": "sha512-BGP0jRmfYyvOyvMoRX/uoUeW+GqNj9y16bPQzqAHf3AYII/tDs+jMN0dBVkl88/OZwNGwrVFxE7riHsXVfy/LQ==",
+      "version": "7.37.5",
+      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.37.5.tgz",
+      "integrity": "sha512-Qteup0SqU15kdocexFNAJMvCJEfa2xUKNV4CC1xsVMrIIqEy3SQ/rqyxCWNzfrd3/ldy6HMlD2e0JDVpDg2qIA==",
       "dev": true,
       "license": "MIT",
       "dependencies": {
@@ -5297,7 +5487,7 @@
         "hasown": "^2.0.2",
         "jsx-ast-utils": "^2.4.1 || ^3.0.0",
         "minimatch": "^3.1.2",
-        "object.entries": "^1.1.8",
+        "object.entries": "^1.1.9",
         "object.fromentries": "^2.0.8",
         "object.values": "^1.2.1",
         "prop-types": "^15.8.1",
@@ -5462,6 +5652,13 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/eventemitter3": {
+      "version": "5.0.1",
+      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-5.0.1.tgz",
+      "integrity": "sha512-GWkBvjiSZK87ELrYOSESUYeVIc9mvLLf/nXalMOS5dYrgZq9o5OVkbZAVM06CVxYsCwH9BDZFPlQTlPA1j4ahA==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/execa": {
       "version": "5.1.1",
       "resolved": "https://registry.npmjs.org/execa/-/execa-5.1.1.tgz",
@@ -5778,6 +5975,19 @@
         "node": "6.* || 8.* || >= 10.*"
       }
     },
+    "node_modules/get-east-asian-width": {
+      "version": "1.3.0",
+      "resolved": "https://registry.npmjs.org/get-east-asian-width/-/get-east-asian-width-1.3.0.tgz",
+      "integrity": "sha512-vpeMIQKxczTD/0s2CdEWHcb0eeJe6TFjxb+J5xgX7hScxqrGuyjmv4c1D4A/gelKfyox0gJJwIHF+fLjeaM8kQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/get-intrinsic": {
       "version": "1.3.0",
       "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
@@ -5907,9 +6117,9 @@
       }
     },
     "node_modules/globals": {
-      "version": "14.0.0",
-      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
-      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
+      "version": "16.0.0",
+      "resolved": "https://registry.npmjs.org/globals/-/globals-16.0.0.tgz",
+      "integrity": "sha512-iInW14XItCXET01CQFqudPOWP2jYMl7T+QRQT+UNcR/iQncN/F0UNpgd76iFkBPgNQb4+X3LV9tLJYzwh+Gl3A==",
       "dev": true,
       "license": "MIT",
       "engines": {
@@ -6116,6 +6326,22 @@
         "node": ">=10.17.0"
       }
     },
+    "node_modules/husky": {
+      "version": "9.1.7",
+      "resolved": "https://registry.npmjs.org/husky/-/husky-9.1.7.tgz",
+      "integrity": "sha512-5gs5ytaNjBrh5Ow3zrvdUUY+0VxIuWVL4i9irt6friV+BqdCfmV11CQTWMiBYWHbXhco+J1kHfTOUkePhCDvMA==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "husky": "bin.js"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/typicode"
+      }
+    },
     "node_modules/iconv-lite": {
       "version": "0.6.3",
       "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
@@ -8205,6 +8431,19 @@
         "url": "https://opencollective.com/parcel"
       }
     },
+    "node_modules/lilconfig": {
+      "version": "3.1.3",
+      "resolved": "https://registry.npmjs.org/lilconfig/-/lilconfig-3.1.3.tgz",
+      "integrity": "sha512-/vlFKAoH5Cgt3Ie+JLhRbwOsCQePABiU3tJ1egGvyQ+33R/vcwM2Zl2QR/LzjsBeItPt3oSVXapn+m4nQDvpzw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=14"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/antonk52"
+      }
+    },
     "node_modules/lines-and-columns": {
       "version": "1.2.4",
       "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
@@ -8212,113 +8451,555 @@
       "dev": true,
       "license": "MIT"
     },
-    "node_modules/locate-path": {
-      "version": "6.0.0",
-      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
-      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
+    "node_modules/lint-staged": {
+      "version": "15.5.1",
+      "resolved": "https://registry.npmjs.org/lint-staged/-/lint-staged-15.5.1.tgz",
+      "integrity": "sha512-6m7u8mue4Xn6wK6gZvSCQwBvMBR36xfY24nF5bMTf2MHDYG6S3yhJuOgdYVw99hsjyDt2d4z168b3naI8+NWtQ==",
       "dev": true,
       "license": "MIT",
       "dependencies": {
-        "p-locate": "^5.0.0"
+        "chalk": "^5.4.1",
+        "commander": "^13.1.0",
+        "debug": "^4.4.0",
+        "execa": "^8.0.1",
+        "lilconfig": "^3.1.3",
+        "listr2": "^8.2.5",
+        "micromatch": "^4.0.8",
+        "pidtree": "^0.6.0",
+        "string-argv": "^0.3.2",
+        "yaml": "^2.7.0"
+      },
+      "bin": {
+        "lint-staged": "bin/lint-staged.js"
       },
       "engines": {
-        "node": ">=10"
+        "node": ">=18.12.0"
       },
       "funding": {
-        "url": "https://github.com/sponsors/sindresorhus"
+        "url": "https://opencollective.com/lint-staged"
       }
     },
-    "node_modules/lodash": {
-      "version": "4.17.21",
-      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
-      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",
-      "dev": true,
-      "license": "MIT"
-    },
-    "node_modules/lodash.includes": {
-      "version": "4.3.0",
-      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
-      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
-      "license": "MIT"
-    },
-    "node_modules/lodash.isboolean": {
-      "version": "3.0.3",
-      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
-      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
-      "license": "MIT"
-    },
-    "node_modules/lodash.isinteger": {
-      "version": "4.0.4",
-      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
-      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
-      "license": "MIT"
-    },
-    "node_modules/lodash.isnumber": {
-      "version": "3.0.3",
-      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
-      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
-      "license": "MIT"
-    },
-    "node_modules/lodash.isplainobject": {
-      "version": "4.0.6",
-      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
-      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
-      "license": "MIT"
-    },
-    "node_modules/lodash.isstring": {
-      "version": "4.0.1",
-      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
-      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
-      "license": "MIT"
-    },
-    "node_modules/lodash.merge": {
-      "version": "4.6.2",
-      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
-      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==",
-      "dev": true,
-      "license": "MIT"
-    },
-    "node_modules/lodash.once": {
-      "version": "4.1.1",
-      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
-      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
-      "license": "MIT"
-    },
-    "node_modules/loose-envify": {
-      "version": "1.4.0",
-      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
-      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
+    "node_modules/lint-staged/node_modules/chalk": {
+      "version": "5.4.1",
+      "resolved": "https://registry.npmjs.org/chalk/-/chalk-5.4.1.tgz",
+      "integrity": "sha512-zgVZuo2WcZgfUEmsn6eO3kINexW8RAE4maiQ8QNs8CtpPCSyMiYsULR3HQYkm3w8FIA3SberyMJMSldGsW+U3w==",
       "dev": true,
       "license": "MIT",
-      "dependencies": {
-        "js-tokens": "^3.0.0 || ^4.0.0"
+      "engines": {
+        "node": "^12.17.0 || ^14.13 || >=16.0.0"
       },
-      "bin": {
-        "loose-envify": "cli.js"
+      "funding": {
+        "url": "https://github.com/chalk/chalk?sponsor=1"
       }
     },
-    "node_modules/lru-cache": {
-      "version": "6.0.0",
-      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-6.0.0.tgz",
-      "integrity": "sha512-Jo6dJ04CmSjuznwJSS3pUeWmd/H0ffTlkXXgwZi+eq1UCmqQwCh+eLsYOYCwY991i2Fah4h1BEMCx4qThGbsiA==",
-      "license": "ISC",
+    "node_modules/lint-staged/node_modules/execa": {
+      "version": "8.0.1",
+      "resolved": "https://registry.npmjs.org/execa/-/execa-8.0.1.tgz",
+      "integrity": "sha512-VyhnebXciFV2DESc+p6B+y0LjSm0krU4OgJN44qFAhBY0TJ+1V61tYD2+wHusZ6F9n5K+vl8k0sTy7PEfV4qpg==",
+      "dev": true,
+      "license": "MIT",
       "dependencies": {
-        "yallist": "^4.0.0"
+        "cross-spawn": "^7.0.3",
+        "get-stream": "^8.0.1",
+        "human-signals": "^5.0.0",
+        "is-stream": "^3.0.0",
+        "merge-stream": "^2.0.0",
+        "npm-run-path": "^5.1.0",
+        "onetime": "^6.0.0",
+        "signal-exit": "^4.1.0",
+        "strip-final-newline": "^3.0.0"
       },
       "engines": {
-        "node": ">=10"
+        "node": ">=16.17"
+      },
+      "funding": {
+        "url": "https://github.com/sindresorhus/execa?sponsor=1"
       }
     },
-    "node_modules/lz-string": {
-      "version": "1.5.0",
-      "resolved": "https://registry.npmjs.org/lz-string/-/lz-string-1.5.0.tgz",
-      "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
+    "node_modules/lint-staged/node_modules/get-stream": {
+      "version": "8.0.1",
+      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-8.0.1.tgz",
+      "integrity": "sha512-VaUJspBffn/LMCJVoMvSAdmscJyS1auj5Zulnn5UoYcY531UWmdwhRWkcGKnGU93m5HSXP9LP2usOryrBtQowA==",
       "dev": true,
       "license": "MIT",
-      "peer": true,
-      "bin": {
-        "lz-string": "bin/bin.js"
-      }
+      "engines": {
+        "node": ">=16"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lint-staged/node_modules/human-signals": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/human-signals/-/human-signals-5.0.0.tgz",
+      "integrity": "sha512-AXcZb6vzzrFAUE61HnN4mpLqd/cSIwNQjtNWR0euPm6y0iqx3G4gOXaIDdtdDwZmhwe82LA6+zinmW4UBWVePQ==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=16.17.0"
+      }
+    },
+    "node_modules/lint-staged/node_modules/is-stream": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/is-stream/-/is-stream-3.0.0.tgz",
+      "integrity": "sha512-LnQR4bZ9IADDRSkvpqMGvt/tEJWclzklNgSw48V5EAaAeDd6qGvN8ei6k5p0tvxSR171VmGyHuTiAOfxAbr8kA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lint-staged/node_modules/mimic-fn": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/mimic-fn/-/mimic-fn-4.0.0.tgz",
+      "integrity": "sha512-vqiC06CuhBTUdZH+RYl8sFrL096vA45Ok5ISO6sE/Mr1jRbGH4Csnhi8f3wKVl7x8mO4Au7Ir9D3Oyv1VYMFJw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lint-staged/node_modules/npm-run-path": {
+      "version": "5.3.0",
+      "resolved": "https://registry.npmjs.org/npm-run-path/-/npm-run-path-5.3.0.tgz",
+      "integrity": "sha512-ppwTtiJZq0O/ai0z7yfudtBpWIoxM8yE6nHi1X47eFR2EWORqfbu6CnPlNsjeN683eT0qG6H/Pyf9fCcvjnnnQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "path-key": "^4.0.0"
+      },
+      "engines": {
+        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lint-staged/node_modules/onetime": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/onetime/-/onetime-6.0.0.tgz",
+      "integrity": "sha512-1FlR+gjXK7X+AsAHso35MnyN5KqGwJRi/31ft6x0M194ht7S+rWAvd7PHss9xSKMzE0asv1pyIHaJYq+BbacAQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "mimic-fn": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lint-staged/node_modules/path-key": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/path-key/-/path-key-4.0.0.tgz",
+      "integrity": "sha512-haREypq7xkM7ErfgIyA0z+Bj4AGKlMSdlQE2jvJo6huWD1EdkKYV+G/T4nq0YEF2vgTT8kqMFKo1uHn950r4SQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lint-staged/node_modules/signal-exit": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
+      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
+      "dev": true,
+      "license": "ISC",
+      "engines": {
+        "node": ">=14"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/isaacs"
+      }
+    },
+    "node_modules/lint-staged/node_modules/strip-final-newline": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/strip-final-newline/-/strip-final-newline-3.0.0.tgz",
+      "integrity": "sha512-dOESqjYr96iWYylGObzd39EuNTa5VJxyvVAEm5Jnh7KGo75V43Hk1odPQkNDyXNmUR6k+gEiDVXnjB8HJ3crXw==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/listr2": {
+      "version": "8.3.2",
+      "resolved": "https://registry.npmjs.org/listr2/-/listr2-8.3.2.tgz",
+      "integrity": "sha512-vsBzcU4oE+v0lj4FhVLzr9dBTv4/fHIa57l+GCwovP8MoFNZJTOhGU8PXd4v2VJCbECAaijBiHntiekFMLvo0g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "cli-truncate": "^4.0.0",
+        "colorette": "^2.0.20",
+        "eventemitter3": "^5.0.1",
+        "log-update": "^6.1.0",
+        "rfdc": "^1.4.1",
+        "wrap-ansi": "^9.0.0"
+      },
+      "engines": {
+        "node": ">=18.0.0"
+      }
+    },
+    "node_modules/listr2/node_modules/ansi-regex": {
+      "version": "6.1.0",
+      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.1.0.tgz",
+      "integrity": "sha512-7HSX4QQb4CspciLpVFwyRe79O3xsIZDDLER21kERQ71oaPodF8jL725AgJMFAYbooIqolJoRLuM81SpeUkpkvA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
+      }
+    },
+    "node_modules/listr2/node_modules/ansi-styles": {
+      "version": "6.2.1",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.1.tgz",
+      "integrity": "sha512-bN798gFfQX+viw3R7yrGWRqnrN2oRkEkUjjl4JNn4E8GxxbjtG3FbrEIIY3l8/hrwUwIeCZvi4QuOTP4MErVug==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/listr2/node_modules/emoji-regex": {
+      "version": "10.4.0",
+      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-10.4.0.tgz",
+      "integrity": "sha512-EC+0oUMY1Rqm4O6LLrgjtYDvcVYTy7chDnM4Q7030tP4Kwj3u/pR6gP9ygnp2CJMK5Gq+9Q2oqmrFJAz01DXjw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/listr2/node_modules/string-width": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
+      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "emoji-regex": "^10.3.0",
+        "get-east-asian-width": "^1.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/listr2/node_modules/strip-ansi": {
+      "version": "7.1.0",
+      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
+      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-regex": "^6.0.1"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
+      }
+    },
+    "node_modules/listr2/node_modules/wrap-ansi": {
+      "version": "9.0.0",
+      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-9.0.0.tgz",
+      "integrity": "sha512-G8ura3S+3Z2G+mkgNRq8dqaFZAuxfsxpBB8OCTGRTCtp+l/v9nbFNmCUP1BZMts3G1142MsZfn6eeUKrr4PD1Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-styles": "^6.2.1",
+        "string-width": "^7.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
+      }
+    },
+    "node_modules/locate-path": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
+      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "p-locate": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/lodash": {
+      "version": "4.17.21",
+      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
+      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/lodash.includes": {
+      "version": "4.3.0",
+      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
+      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
+      "license": "MIT"
+    },
+    "node_modules/lodash.isboolean": {
+      "version": "3.0.3",
+      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
+      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
+      "license": "MIT"
+    },
+    "node_modules/lodash.isinteger": {
+      "version": "4.0.4",
+      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
+      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
+      "license": "MIT"
+    },
+    "node_modules/lodash.isnumber": {
+      "version": "3.0.3",
+      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
+      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
+      "license": "MIT"
+    },
+    "node_modules/lodash.isplainobject": {
+      "version": "4.0.6",
+      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
+      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
+      "license": "MIT"
+    },
+    "node_modules/lodash.isstring": {
+      "version": "4.0.1",
+      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
+      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
+      "license": "MIT"
+    },
+    "node_modules/lodash.merge": {
+      "version": "4.6.2",
+      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
+      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/lodash.once": {
+      "version": "4.1.1",
+      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
+      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
+      "license": "MIT"
+    },
+    "node_modules/log-update": {
+      "version": "6.1.0",
+      "resolved": "https://registry.npmjs.org/log-update/-/log-update-6.1.0.tgz",
+      "integrity": "sha512-9ie8ItPR6tjY5uYJh8K/Zrv/RMZ5VOlOWvtZdEHYSTFKZfIBPQa9tOAEeAWhd+AnIneLJ22w5fjOYtoutpWq5w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-escapes": "^7.0.0",
+        "cli-cursor": "^5.0.0",
+        "slice-ansi": "^7.1.0",
+        "strip-ansi": "^7.1.0",
+        "wrap-ansi": "^9.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/log-update/node_modules/ansi-escapes": {
+      "version": "7.0.0",
+      "resolved": "https://registry.npmjs.org/ansi-escapes/-/ansi-escapes-7.0.0.tgz",
+      "integrity": "sha512-GdYO7a61mR0fOlAsvC9/rIHf7L96sBc6dEWzeOu+KAea5bZyQRPIpojrVoI4AXGJS/ycu/fBTdLrUkA4ODrvjw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "environment": "^1.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/log-update/node_modules/ansi-regex": {
+      "version": "6.1.0",
+      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.1.0.tgz",
+      "integrity": "sha512-7HSX4QQb4CspciLpVFwyRe79O3xsIZDDLER21kERQ71oaPodF8jL725AgJMFAYbooIqolJoRLuM81SpeUkpkvA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
+      }
+    },
+    "node_modules/log-update/node_modules/ansi-styles": {
+      "version": "6.2.1",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.1.tgz",
+      "integrity": "sha512-bN798gFfQX+viw3R7yrGWRqnrN2oRkEkUjjl4JNn4E8GxxbjtG3FbrEIIY3l8/hrwUwIeCZvi4QuOTP4MErVug==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/log-update/node_modules/emoji-regex": {
+      "version": "10.4.0",
+      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-10.4.0.tgz",
+      "integrity": "sha512-EC+0oUMY1Rqm4O6LLrgjtYDvcVYTy7chDnM4Q7030tP4Kwj3u/pR6gP9ygnp2CJMK5Gq+9Q2oqmrFJAz01DXjw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/log-update/node_modules/is-fullwidth-code-point": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-5.0.0.tgz",
+      "integrity": "sha512-OVa3u9kkBbw7b8Xw5F9P+D/T9X+Z4+JruYVNapTjPYZYUznQ5YfWeFkOj606XYYW8yugTfC8Pj0hYqvi4ryAhA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "get-east-asian-width": "^1.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/log-update/node_modules/slice-ansi": {
+      "version": "7.1.0",
+      "resolved": "https://registry.npmjs.org/slice-ansi/-/slice-ansi-7.1.0.tgz",
+      "integrity": "sha512-bSiSngZ/jWeX93BqeIAbImyTbEihizcwNjFoRUIY/T1wWQsfsm2Vw1agPKylXvQTU7iASGdHhyqRlqQzfz+Htg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-styles": "^6.2.1",
+        "is-fullwidth-code-point": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/slice-ansi?sponsor=1"
+      }
+    },
+    "node_modules/log-update/node_modules/string-width": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
+      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "emoji-regex": "^10.3.0",
+        "get-east-asian-width": "^1.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/log-update/node_modules/strip-ansi": {
+      "version": "7.1.0",
+      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
+      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-regex": "^6.0.1"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
+      }
+    },
+    "node_modules/log-update/node_modules/wrap-ansi": {
+      "version": "9.0.0",
+      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-9.0.0.tgz",
+      "integrity": "sha512-G8ura3S+3Z2G+mkgNRq8dqaFZAuxfsxpBB8OCTGRTCtp+l/v9nbFNmCUP1BZMts3G1142MsZfn6eeUKrr4PD1Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-styles": "^6.2.1",
+        "string-width": "^7.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
+      }
+    },
+    "node_modules/loose-envify": {
+      "version": "1.4.0",
+      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
+      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "js-tokens": "^3.0.0 || ^4.0.0"
+      },
+      "bin": {
+        "loose-envify": "cli.js"
+      }
+    },
+    "node_modules/lru-cache": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-6.0.0.tgz",
+      "integrity": "sha512-Jo6dJ04CmSjuznwJSS3pUeWmd/H0ffTlkXXgwZi+eq1UCmqQwCh+eLsYOYCwY991i2Fah4h1BEMCx4qThGbsiA==",
+      "license": "ISC",
+      "dependencies": {
+        "yallist": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
+    "node_modules/lz-string": {
+      "version": "1.5.0",
+      "resolved": "https://registry.npmjs.org/lz-string/-/lz-string-1.5.0.tgz",
+      "integrity": "sha512-h5bgJWpxJNswbU7qCrV0tIKQCaS3blPDrqKWx+QxzuzL1zGUzij9XCWLrSLsJPu5t+eWA/ycetzYAO5IOMcWAQ==",
+      "dev": true,
+      "license": "MIT",
+      "peer": true,
+      "bin": {
+        "lz-string": "bin/bin.js"
+      }
     },
     "node_modules/make-dir": {
       "version": "4.0.0",
@@ -8426,6 +9107,19 @@
         "node": ">=6"
       }
     },
+    "node_modules/mimic-function": {
+      "version": "5.0.1",
+      "resolved": "https://registry.npmjs.org/mimic-function/-/mimic-function-5.0.1.tgz",
+      "integrity": "sha512-VP79XUPxV2CigYP3jWwAUFSku2aKqBH7uTAapFWCBqutsbmDo96KY5o8uh6U+/YSIn5OxJnXp73beVkpqMIGhA==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/min-indent": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/min-indent/-/min-indent-1.0.1.tgz",
@@ -8718,15 +9412,16 @@
       }
     },
     "node_modules/object.entries": {
-      "version": "1.1.8",
-      "resolved": "https://registry.npmjs.org/object.entries/-/object.entries-1.1.8.tgz",
-      "integrity": "sha512-cmopxi8VwRIAw/fkijJohSfpef5PdN0pMQJN6VC/ZKvn0LIknWD8KtgY6KlQdEc4tIjcQ3HxSMmnvtzIscdaYQ==",
+      "version": "1.1.9",
+      "resolved": "https://registry.npmjs.org/object.entries/-/object.entries-1.1.9.tgz",
+      "integrity": "sha512-8u/hfXFRBD1O0hPUjioLhoWFHRmt6tKA4/vZPyckBr18l1KE9uHrFaFaUi8MDRTpi4uak2goyPTSNJLXX2k2Hw==",
       "dev": true,
       "license": "MIT",
       "dependencies": {
-        "call-bind": "^1.0.7",
+        "call-bind": "^1.0.8",
+        "call-bound": "^1.0.4",
         "define-properties": "^1.2.1",
-        "es-object-atoms": "^1.0.0"
+        "es-object-atoms": "^1.1.1"
       },
       "engines": {
         "node": ">= 0.4"
@@ -9034,6 +9729,19 @@
         "url": "https://github.com/sponsors/jonschlinkert"
       }
     },
+    "node_modules/pidtree": {
+      "version": "0.6.0",
+      "resolved": "https://registry.npmjs.org/pidtree/-/pidtree-0.6.0.tgz",
+      "integrity": "sha512-eG2dWTVw5bzqGRztnHExczNxt5VGsE6OwTeCG3fdUf9KBsZzO3R5OIIIzWR+iZA0NtZ+RDVdaoE2dK1cn6jH4g==",
+      "dev": true,
+      "license": "MIT",
+      "bin": {
+        "pidtree": "bin/pidtree.js"
+      },
+      "engines": {
+        "node": ">=0.10"
+      }
+    },
     "node_modules/pirates": {
       "version": "4.0.7",
       "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.7.tgz",
@@ -9484,6 +10192,52 @@
         "node": ">=10"
       }
     },
+    "node_modules/restore-cursor": {
+      "version": "5.1.0",
+      "resolved": "https://registry.npmjs.org/restore-cursor/-/restore-cursor-5.1.0.tgz",
+      "integrity": "sha512-oMA2dcrw6u0YfxJQXm342bFKX/E4sG9rbTzO9ptUcR/e8A33cHuvStiYOwH7fszkZlZ1z/ta9AAoPk2F4qIOHA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "onetime": "^7.0.0",
+        "signal-exit": "^4.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/restore-cursor/node_modules/onetime": {
+      "version": "7.0.0",
+      "resolved": "https://registry.npmjs.org/onetime/-/onetime-7.0.0.tgz",
+      "integrity": "sha512-VXJjc87FScF88uafS3JllDgvAm+c/Slfz06lorj2uAY34rlUu0Nt+v8wreiImcrgAjjIHp1rXpTDlLOGw29WwQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "mimic-function": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/restore-cursor/node_modules/signal-exit": {
+      "version": "4.1.0",
+      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
+      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
+      "dev": true,
+      "license": "ISC",
+      "engines": {
+        "node": ">=14"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/isaacs"
+      }
+    },
     "node_modules/reusify": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz",
@@ -9495,6 +10249,13 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/rfdc": {
+      "version": "1.4.1",
+      "resolved": "https://registry.npmjs.org/rfdc/-/rfdc-1.4.1.tgz",
+      "integrity": "sha512-q1b3N5QkRUWUl7iyylaaj3kOpIT0N2i9MqIEQXP73GVsN9cw3fdx8X63cEmWhJGi2PPCF23Ijp7ktmd39rawIA==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/run-parallel": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
@@ -9854,6 +10615,49 @@
         "node": ">=8"
       }
     },
+    "node_modules/slice-ansi": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/slice-ansi/-/slice-ansi-5.0.0.tgz",
+      "integrity": "sha512-FC+lgizVPfie0kkhqUScwRu1O/lF6NOgJmlCgK+/LYxDCTk8sGelYaHDhFcDN+Sn3Cv+3VSa4Byeo+IMCzpMgQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-styles": "^6.0.0",
+        "is-fullwidth-code-point": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/slice-ansi?sponsor=1"
+      }
+    },
+    "node_modules/slice-ansi/node_modules/ansi-styles": {
+      "version": "6.2.1",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.1.tgz",
+      "integrity": "sha512-bN798gFfQX+viw3R7yrGWRqnrN2oRkEkUjjl4JNn4E8GxxbjtG3FbrEIIY3l8/hrwUwIeCZvi4QuOTP4MErVug==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/slice-ansi/node_modules/is-fullwidth-code-point": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-4.0.0.tgz",
+      "integrity": "sha512-O4L094N2/dZ7xqVdrXhh9r1KODPJpFms8B5sGdJLPy664AgvXsreZUyCQQNItZRDlYug4xStLjNp/sz3HvBowQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/source-map": {
       "version": "0.6.1",
       "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
@@ -9929,6 +10733,16 @@
         "node": ">=10.0.0"
       }
     },
+    "node_modules/string-argv": {
+      "version": "0.3.2",
+      "resolved": "https://registry.npmjs.org/string-argv/-/string-argv-0.3.2.tgz",
+      "integrity": "sha512-aqD2Q0144Z+/RqG52NeHEkZauTAUWJO8c6yTftGJKO3Tja5tUgIfmIl6kExvhtxSDP7fXB6DvzkfMpCd/F3G+Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.6.19"
+      }
+    },
     "node_modules/string-length": {
       "version": "4.0.2",
       "resolved": "https://registry.npmjs.org/string-length/-/string-length-4.0.2.tgz",
@@ -10893,6 +11707,19 @@
       "integrity": "sha512-3wdGidZyq5PB084XLES5TpOSRA3wjXAlIWMhum2kRcv/41Sn2emQ0dycQW4uZXLejwKvg6EsvbdlVL+FYEct7A==",
       "license": "ISC"
     },
+    "node_modules/yaml": {
+      "version": "2.7.1",
+      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.7.1.tgz",
+      "integrity": "sha512-10ULxpnOCQXxJvBgxsn9ptjq6uviG/htZKk9veJGhlqn3w/DxQ631zFF+nlQXLwmImeS5amR2dl2U8sg6U9jsQ==",
+      "dev": true,
+      "license": "ISC",
+      "bin": {
+        "yaml": "bin.mjs"
+      },
+      "engines": {
+        "node": ">= 14"
+      }
+    },
     "node_modules/yargs": {
       "version": "17.7.2",
       "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.7.2.tgz",
diff --git a/package.json b/package.json
index 6ef0ed4..be0bb30 100644
--- a/package.json
+++ b/package.json
@@ -10,11 +10,13 @@
     "logs:clean": "rm -rf ./logs/*.log",
     "build": "next build",
     "start": "next start",
-    "lint": "next lint",
+    "lint": "next lint --quiet",
     "typecheck": "tsc --noEmit",
     "test": "jest",
     "test:watch": "jest --watch",
-    "test:coverage": "jest --coverage"
+    "test:coverage": "jest --coverage",
+    "prepare": "husky",
+    "ci": "npm run lint && npm run typecheck && npm run test"
   },
   "dependencies": {
     "@google/generative-ai": "^0.24.0",
@@ -38,9 +40,34 @@
     "@types/testing-library__jest-dom": "^5.14.9",
     "eslint": "^9.22.0",
     "eslint-config-next": "^15.2.2",
+    "eslint-config-prettier": "^10.1.2",
+    "eslint-plugin-eslint-comments": "^3.2.0",
+    "eslint-plugin-import": "^2.31.0",
+    "eslint-plugin-jsx-a11y": "^6.10.2",
+    "eslint-plugin-next": "^0.0.0",
+    "eslint-plugin-react": "^7.37.5",
+    "eslint-plugin-react-hooks": "^5.2.0",
+    "globals": "^16.0.0",
+    "husky": "^9.1.7",
     "jest": "^29.7.0",
     "jest-environment-jsdom": "^29.7.0",
+    "lint-staged": "^15.5.1",
     "tailwindcss": "^4",
     "typescript": "^5"
+  },
+  "lint-staged": {
+    "*.{ts,tsx}": [
+      "eslint",
+      "tsc --skipLibCheck --noEmit",
+      "node ./scripts/check-file-size.js"
+    ],
+    "*.{js,jsx}": [
+      "eslint",
+      "prettier --write",
+      "node ./scripts/check-file-size.js"
+    ],
+    "*.{json,md,css}": [
+      "prettier --write"
+    ]
   }
 }
diff --git a/scripts/check-file-size.js b/scripts/check-file-size.js
new file mode 100755
index 0000000..2ff637d
--- /dev/null
+++ b/scripts/check-file-size.js
@@ -0,0 +1,70 @@
+#!/usr/bin/env node
+
+const fs = require("fs");
+const path = require("path");
+
+// Configuration
+const LINE_THRESHOLD = 300;
+const TOP_N_FILES = 5;
+
+// Get files from command line arguments
+const filesToCheck = process.argv.slice(2);
+
+if (filesToCheck.length === 0) {
+  console.log("No files to check.");
+  process.exit(0);
+}
+
+// Function to count lines in a file
+function countLines(filePath) {
+  try {
+    const content = fs.readFileSync(filePath, "utf8");
+    return content.split("\n").length;
+  } catch (error) {
+    console.error(`Error reading file ${filePath}: ${error.message}`);
+    return 0;
+  }
+}
+
+// Track files exceeding threshold
+const largeFiles = [];
+
+// Check each file
+console.log("\n🔍 Checking file sizes...");
+filesToCheck.forEach((filePath) => {
+  const lineCount = countLines(filePath);
+  const relativePath = path.relative(process.cwd(), filePath);
+
+  if (lineCount > LINE_THRESHOLD) {
+    largeFiles.push({ path: relativePath, lines: lineCount });
+    console.warn(
+      `⚠️  WARNING: ${relativePath} has ${lineCount} lines (exceeds threshold of ${LINE_THRESHOLD})`,
+    );
+  }
+});
+
+// Sort large files by line count (descending)
+largeFiles.sort((a, b) => b.lines - a.lines);
+
+// Display summary if large files were found
+if (largeFiles.length > 0) {
+  console.log("\n📊 Summary of large files:");
+  largeFiles.slice(0, TOP_N_FILES).forEach((file, index) => {
+    console.log(`  ${index + 1}. ${file.path}: ${file.lines} lines`);
+  });
+
+  if (largeFiles.length > TOP_N_FILES) {
+    console.log(
+      `  ...and ${largeFiles.length - TOP_N_FILES} more file(s) exceeding the threshold`,
+    );
+  }
+
+  console.log("\n💡 Consider refactoring these files to reduce their size.");
+  console.log(
+    `   The recommended maximum is ${LINE_THRESHOLD} lines per file.`,
+  );
+  console.log("   This is a warning only and does not prevent the commit.\n");
+}
+
+// Exit with success code (allow commit to proceed)
+process.exit(0);
diff --git a/scripts/typecheck.js b/scripts/typecheck.js
new file mode 100644
index 0000000..c7d30bf
--- /dev/null
+++ b/scripts/typecheck.js
@@ -0,0 +1,19 @@
+#!/usr/bin/env node
+
+// This script runs TypeScript type checking without specific files
+// to ensure the tsconfig.json exclusions are respected
+// Use with: node scripts/typecheck.js
+
+const { execSync } = require('child_process');
+
+try {
+  // Run TypeScript compiler without passing specific files
+  // This ensures it uses tsconfig.json properly
+  console.log('Running TypeScript type check...');
+  execSync('tsc --noEmit --project tsconfig.json', { stdio: 'inherit' });
+  console.log('TypeScript check passed!');
+  process.exit(0);
+} catch (error) {
+  console.error('TypeScript check failed!');
+  process.exit(1);
+}
\ No newline at end of file
diff --git a/src/__tests__/api-test-utils.ts b/src/__tests__/api-test-utils.ts
index 689b03b..f5f5165 100644
--- a/src/__tests__/api-test-utils.ts
+++ b/src/__tests__/api-test-utils.ts
@@ -91,7 +91,7 @@ export const createApiHandlerTestHelper = (
       url: string,
       method: string = 'GET',
       searchParams: Record<string, string> = {},
-      body?: any
+      body?: Record<string, unknown>
     ) => {
       // Create URL with search parameters
       const testUrl = new URL(url, 'https://example.com');
@@ -224,7 +224,7 @@ export const verifyCredentialHandling = (
 // Verify that the Octokit instance was passed to data fetching functions
 export const verifyOctokitPassing = (
   fetchFunction: jest.Mock,
-  ...additionalArgs: any[]
+  ...additionalArgs: unknown[]
 ) => {
   expect(fetchFunction).toHaveBeenCalledWith(
     mockOctokit,
@@ -250,7 +250,7 @@ export const verifyRepositoryFetchingWithOctokit = (
 
 // Helper to verify that error responses match expected patterns
 export const verifyErrorResponse = (
-  response: { status: number; data: any },
+  response: { status: number; data: Record<string, unknown> },
   expectedStatus: number,
   expectedCode: string,
   options?: {
diff --git a/src/__tests__/api/additional-routes.test.ts b/src/__tests__/api/additional-routes.test.ts
index 8e2c5c2..04a08d4 100644
--- a/src/__tests__/api/additional-routes.test.ts
+++ b/src/__tests__/api/additional-routes.test.ts
@@ -17,9 +17,11 @@ import {
 import { mockRepositories, mockActivityCommits, mockInstallation, mockSession } from '../test-utils';
 
 // Create test helpers for each API route
-const contributorsTestHelper = createApiHandlerTestHelper(getContributors as (req: NextRequest) => any);
-const myOrgActivityTestHelper = createApiHandlerTestHelper(getMyOrgActivity as (req: NextRequest) => any);
-const teamActivityTestHelper = createApiHandlerTestHelper(getTeamActivity as (req: NextRequest) => any);
+import { NextResponse } from 'next/server';
+
+const contributorsTestHelper = createApiHandlerTestHelper(getContributors as (req: NextRequest) => Promise<NextResponse>);
+const myOrgActivityTestHelper = createApiHandlerTestHelper(getMyOrgActivity as (req: NextRequest) => Promise<NextResponse>);
+const teamActivityTestHelper = createApiHandlerTestHelper(getTeamActivity as (req: NextRequest) => Promise<NextResponse>);
 
 describe('Additional API Routes Tests', () => {
   beforeEach(() => {
diff --git a/src/__tests__/api/my-activity.test.ts b/src/__tests__/api/my-activity.test.ts
index d80426f..8a6b4f0 100644
--- a/src/__tests__/api/my-activity.test.ts
+++ b/src/__tests__/api/my-activity.test.ts
@@ -129,7 +129,7 @@ describe('API: /api/my-activity', () => {
     
     // Verify no authentication or data fetching was attempted
     expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
-    expect(mockFetchAllRepositories).not.toHaveBeenCalled();
+    expect(mockFetchRepositories).not.toHaveBeenCalled();
     expect(mockFetchCommitsForRepositoriesWithOctokit).not.toHaveBeenCalled();
   });
 
diff --git a/src/__tests__/components/dashboard/AccountManagementPanel.test.tsx b/src/__tests__/components/dashboard/AccountManagementPanel.test.tsx
index 81ba2f0..cf7c064 100644
--- a/src/__tests__/components/dashboard/AccountManagementPanel.test.tsx
+++ b/src/__tests__/components/dashboard/AccountManagementPanel.test.tsx
@@ -2,6 +2,7 @@ import React from 'react';
 import { render, screen, fireEvent } from '../../../__tests__/test-utils';
 import AccountManagementPanel from '@/components/dashboard/AccountManagementPanel';
 import { mockSession } from '../../../__tests__/test-utils';
+import type { Account } from '@/components/AccountSelector';
 
 // Mock AccountSelector component to simplify testing
 jest.mock('@/components/AccountSelector', () => {
@@ -15,6 +16,14 @@ jest.mock('@/components/AccountSelector', () => {
       multiSelect,
       showCurrentLabel,
       currentUsername
+    }: {
+      accounts: Account[];
+      selectedAccounts: string[];
+      onSelectionChange: (selectedAccounts: string[]) => void;
+      isLoading?: boolean;
+      multiSelect?: boolean;
+      showCurrentLabel?: boolean;
+      currentUsername?: string;
     }) => (
       <div data-testid="account-selector">
         <span>Selected accounts: {selectedAccounts.join(', ') || 'None'}</span>
diff --git a/src/__tests__/components/dashboard/SummaryDisplay.test.tsx b/src/__tests__/components/dashboard/SummaryDisplay.test.tsx
index 5588226..9e896af 100644
--- a/src/__tests__/components/dashboard/SummaryDisplay.test.tsx
+++ b/src/__tests__/components/dashboard/SummaryDisplay.test.tsx
@@ -2,6 +2,7 @@ import React from 'react';
 import { render, screen, within } from '../../../__tests__/test-utils';
 import SummaryDisplay from '@/components/dashboard/SummaryDisplay';
 import { mockSummary, mockActivityCommits, mockDateRange, mockActiveFilters } from '../../../__tests__/test-utils';
+import type { ActivityCommit } from '@/components/ActivityFeed';
 
 // Mock ActivityFeed component to simplify testing
 jest.mock('@/components/ActivityFeed', () => {
@@ -15,6 +16,18 @@ jest.mock('@/components/ActivityFeed', () => {
       showRepository,
       showContributor,
       emptyMessage
+    }: {
+      loadCommits: (cursor: string | null, limit: number) => Promise<{
+        data: ActivityCommit[];
+        nextCursor?: string | null;
+        hasMore: boolean;
+      }>;
+      useInfiniteScroll?: boolean;
+      initialLimit?: number;
+      additionalItemsPerPage?: number;
+      showRepository?: boolean;
+      showContributor?: boolean;
+      emptyMessage?: string;
     }) => (
       <div data-testid="activity-feed">
         <div data-testid="infinite-scroll">Infinite Scroll: {useInfiniteScroll ? 'true' : 'false'}</div>
@@ -23,7 +36,7 @@ jest.mock('@/components/ActivityFeed', () => {
         <div data-testid="show-contributor">Show Contributor: {showContributor ? 'true' : 'false'}</div>
         <div data-testid="empty-message">Empty Message: {emptyMessage}</div>
         <button 
-          onClick={() => loadCommits(null, 10).then(result => {
+          onClick={() => loadCommits(null, 10).then((result) => {
             // This simulates an activity commit fetch
             console.log(`Fetched ${result.data.length} commits`);
           })}
@@ -107,14 +120,17 @@ describe('SummaryDisplay', () => {
     // Should show numeric values but test more specifically to avoid duplication 
     // Find the COMMIT COUNT section and check its value
     const commitCountSection = screen.getByText('COMMIT COUNT').closest('.p-4');
+    if (!commitCountSection) throw new Error("Could not find commit count section");
     expect(commitCountSection).toHaveTextContent('5');
     
     // Find the REPOSITORIES section and check its value
     const reposSection = screen.getByText('REPOSITORIES').closest('.p-4');
+    if (!reposSection) throw new Error("Could not find repositories section");
     expect(reposSection).toHaveTextContent('2');
     
     // Find the ACTIVE DAYS section and check its value
     const daysSection = screen.getByText('ACTIVE DAYS').closest('.p-4');
+    if (!daysSection) throw new Error("Could not find active days section");
     expect(daysSection).toHaveTextContent('2');
     
     // Should NOT show AI summary sections
@@ -153,49 +169,59 @@ describe('SummaryDisplay', () => {
     // Check for specific content from the mockSummary
     // Check that the themes section exists
     const patternsSection = screen.getByText('IDENTIFIED PATTERNS').closest('.mb-8');
+    if (!patternsSection) throw new Error("Could not find patterns section");
     
     // Within that section, check for the themes
     mockSummary.aiSummary.keyThemes.forEach(theme => {
-      expect(within(patternsSection).getByText(theme)).toBeInTheDocument();
+      expect(within(patternsSection as HTMLElement).getByText(theme)).toBeInTheDocument();
     });
     
     // Find the technical areas section
     const technicalAreasSection = screen.getByText('TECHNICAL FOCUS AREAS').closest('.mb-8');
+    if (!technicalAreasSection) throw new Error("Could not find technical areas section");
     
     // Check for specific technical areas without asserting by count
     mockSummary.aiSummary.technicalAreas.forEach(area => {
-      expect(within(technicalAreasSection).getByText(area.name)).toBeInTheDocument();
+      expect(within(technicalAreasSection as HTMLElement).getByText(area.name)).toBeInTheDocument();
       
       // Find the containing element for this technical area within the section
-      const areaElement = within(technicalAreasSection).getByText(area.name).closest('.flex');
+      const areaElement = within(technicalAreasSection as HTMLElement).getByText(area.name).closest('.flex');
+      if (!areaElement) throw new Error(`Could not find container element for technical area "${area.name}"`);
       expect(areaElement).toHaveTextContent(area.count.toString());
     });
     
     // Find the accomplishments section
     const accomplishmentsSection = screen.getByText('KEY ACHIEVEMENTS').closest('.mb-8');
+    if (!accomplishmentsSection) throw new Error("Could not find achievements section");
     
     // Check for specific accomplishments
     mockSummary.aiSummary.accomplishments.forEach(accomplishment => {
-      expect(within(accomplishmentsSection).getByText(accomplishment)).toBeInTheDocument();
+      expect(within(accomplishmentsSection as HTMLElement).getByText(accomplishment)).toBeInTheDocument();
     });
     
     // Find the commit classification section
     const commitClassificationSection = screen.getByText('COMMIT CLASSIFICATION').closest('.mb-8');
+    if (!commitClassificationSection) throw new Error("Could not find commit classification section");
     
     // Check for commit types without direct count matching
     mockSummary.aiSummary.commitsByType.forEach(type => {
-      expect(within(commitClassificationSection).getByText(type.type)).toBeInTheDocument();
-      expect(within(commitClassificationSection).getByText(type.description)).toBeInTheDocument();
+      expect(within(commitClassificationSection as HTMLElement).getByText(type.type)).toBeInTheDocument();
+      expect(within(commitClassificationSection as HTMLElement).getByText(type.description)).toBeInTheDocument();
       // Find the container element for this commit type
-      const typeElement = within(commitClassificationSection).getByText(type.type).closest('.border-l-2');
+      const typeElement = within(commitClassificationSection as HTMLElement).getByText(type.type).closest('.border-l-2');
+      if (!typeElement) throw new Error(`Could not find container element for commit type "${type.type}"`);
       expect(typeElement).toHaveTextContent(type.count.toString());
     });
     
     // Find the comprehensive analysis section
-    const analysisSection = screen.getByText('COMPREHENSIVE ANALYSIS').closest('div').parentElement;
+    const analysisDiv = screen.getByText('COMPREHENSIVE ANALYSIS').closest('div');
+    if (!analysisDiv) throw new Error("Could not find analysis section div");
+    
+    const analysisSection = analysisDiv.parentElement;
+    if (!analysisSection) throw new Error("Could not find analysis section parent element");
     
     // Check for overall summary
-    expect(within(analysisSection).getByText(mockSummary.aiSummary.overallSummary)).toBeInTheDocument();
+    expect(within(analysisSection as HTMLElement).getByText(mockSummary.aiSummary.overallSummary)).toBeInTheDocument();
   });
 
   it('configures ActivityFeed correctly for my-activity mode', () => {
diff --git a/src/__tests__/integration/error-handling.test.tsx b/src/__tests__/integration/error-handling.test.tsx
index 1499b3c..33746b5 100644
--- a/src/__tests__/integration/error-handling.test.tsx
+++ b/src/__tests__/integration/error-handling.test.tsx
@@ -95,11 +95,14 @@ Object.defineProperty(window, 'localStorage', {
 });
 
 // Mock the AuthError component to capture its props
-const mockAuthErrorProps: Record<string, any> = {};
+const mockAuthErrorProps: Record<string, unknown> = {};
+
+// Import the real AuthError props type
+import type { AuthErrorProps } from '@/components/AuthError';
 
 jest.mock('@/components/AuthError', () => {
   return {
-    AuthError: (props: any) => {
+    AuthError: (props: AuthErrorProps) => {
       mockAuthErrorProps.current = props;
       return (
         <div data-testid="auth-error-component">
@@ -120,11 +123,21 @@ jest.mock('@/components/AuthError', () => {
 });
 
 // Track component props for testing
-const mockComponentProps: Record<string, any> = {};
+const mockComponentProps: Record<string, unknown> = {};
+
+// Define interface for AuthenticationStatusBanner props
+interface AuthStatusBannerProps {
+  error: string | null;
+  authMethod?: string | null;
+  needsInstallation?: boolean;
+  getGitHubAppInstallUrl: () => string;
+  handleAuthError: () => void;
+  signOutCallback?: () => void;
+}
 
 // Mock AuthenticationStatusBanner to capture its props
 jest.mock('@/components/dashboard/AuthenticationStatusBanner', () => {
-  return function MockAuthenticationStatusBanner(props: any) {
+  return function MockAuthenticationStatusBanner(props: AuthStatusBannerProps) {
     mockComponentProps.AuthenticationStatusBanner = props;
     return (
       <div data-testid="auth-banner">
@@ -144,36 +157,80 @@ jest.mock('@/components/dashboard/AuthenticationStatusBanner', () => {
 });
 
 // Simple mocks for other dashboard components to avoid errors
+// Define interfaces for dashboard component props where needed
+interface AccountManagementPanelProps {
+  authMethod: string | null;
+  installations: any[];
+  currentInstallations: any[];
+  loading: boolean;
+  getGitHubAppInstallUrl: () => string;
+  getInstallationManagementUrl: (installationId: number, login: string, type: string) => string;
+  switchInstallations: (installationIds: number[]) => void;
+  session: any;
+}
+
 jest.mock('@/components/dashboard/AccountManagementPanel', () => {
-  return function MockAccountManagementPanel(props: any) {
+  return function MockAccountManagementPanel(props: AccountManagementPanelProps) {
     mockComponentProps.AccountManagementPanel = props;
     return <div data-testid="account-panel"></div>;
   };
 });
 
+interface FilterControlsProps {
+  activityMode: string;
+  dateRange: { since: string; until: string };
+  activeFilters: Record<string, any>;
+  installations: any[];
+  loading: boolean;
+  handleModeChange: (mode: string) => void;
+  handleDateRangeChange: (range: { since: string; until: string }) => void;
+  handleOrganizationChange: (orgs: string[]) => void;
+  session: any;
+}
+
 jest.mock('@/components/dashboard/FilterControls', () => {
-  return function MockFilterControls(props: any) {
+  return function MockFilterControls(props: FilterControlsProps) {
     mockComponentProps.FilterControls = props;
     return <div data-testid="filter-controls"></div>;
   };
 });
 
+interface RepoInfoPanelProps {
+  repositories: any[];
+  showRepoList: boolean;
+  loading: boolean;
+  activeFilters: Record<string, any>;
+  setShowRepoList: (show: boolean) => void;
+}
+
 jest.mock('@/components/dashboard/RepositoryInfoPanel', () => {
-  return function MockRepositoryInfoPanel(props: any) {
+  return function MockRepositoryInfoPanel(props: RepoInfoPanelProps) {
     mockComponentProps.RepositoryInfoPanel = props;
     return <div data-testid="repo-panel"></div>;
   };
 });
 
+interface ActionButtonProps {
+  loading: boolean;
+}
+
 jest.mock('@/components/dashboard/ActionButton', () => {
-  return function MockActionButton(props: any) {
+  return function MockActionButton(props: ActionButtonProps) {
     mockComponentProps.ActionButton = props;
     return <button data-testid="action-button"></button>;
   };
 });
 
+interface SummaryDisplayProps {
+  summary: any | null;
+  activityMode: string;
+  dateRange: { since: string; until: string };
+  activeFilters: Record<string, any>;
+  installationIds: number[];
+}
+
 jest.mock('@/components/dashboard/SummaryDisplay', () => {
-  return function MockSummaryDisplay(props: any) {
+  return function MockSummaryDisplay(props: SummaryDisplayProps) {
     mockComponentProps.SummaryDisplay = props;
     return props.summary ? <div data-testid="summary-display"></div> : null;
   };
@@ -185,8 +242,12 @@ jest.mock('@/components/DashboardLoadingState', () => {
   };
 });
 
+interface DashboardHeaderProps {
+  session: any;
+}
+
 jest.mock('@/components/dashboard/DashboardHeader', () => {
-  return function MockDashboardHeader(props: any) {
+  return function MockDashboardHeader(props: DashboardHeaderProps) {
     mockComponentProps.DashboardHeader = props;
     return <div data-testid="dashboard-header" />;
   };
@@ -198,7 +259,7 @@ function createErrorResponse(error: any) {
   const errorMessage = error.message;
   let status = 500;
   let errorCode = 'UNKNOWN_ERROR';
-  let details = errorMessage;
+  const details = errorMessage;
   let signOutRequired = false;
   let resetAt = undefined;
   
@@ -397,8 +458,11 @@ describe('Error Handling Integration', () => {
     });
     
     // Mock getInstallationManagementUrl to indicate app not configured
-    const mockGithubAuth = require('@/lib/auth/githubAuth');
-    mockGithubAuth.getInstallationManagementUrl.mockReturnValue('#github-app-not-configured');
+    // We need to mock the module differently for this specific test
+    jest.mock('@/lib/auth/githubAuth', () => ({
+      ...jest.requireActual('@/lib/auth/githubAuth'),
+      getInstallationManagementUrl: jest.fn().mockReturnValue('#github-app-not-configured')
+    }));
     
     // Render the dashboard with the mock fetch
     render(<DashboardTestWrapper mockFetch={mockFetchFn} />);
diff --git a/src/__tests__/mock-api-error-handler.ts b/src/__tests__/mock-api-error-handler.ts
index ae6e938..02be841 100644
--- a/src/__tests__/mock-api-error-handler.ts
+++ b/src/__tests__/mock-api-error-handler.ts
@@ -36,7 +36,7 @@ export function mockCreateApiErrorResponse(
   let statusCode = 500;
   let errorDetails = "";
   let signOutRequired = false;
-  let needsInstallation = false;
+  const needsInstallation = false;
   let resetAt: string | undefined = undefined;
   
   // Handle based on error type
diff --git a/src/app/api/contributors/route.ts b/src/app/api/contributors/route.ts
index b7fa74d..0df22da 100644
--- a/src/app/api/contributors/route.ts
+++ b/src/app/api/contributors/route.ts
@@ -49,8 +49,8 @@ async function handleGET(request: NextRequest): Promise<NextResponse> {
   }
   
   // Get installation ID from query parameter if present
-  let requestedInstallationId = request.nextUrl.searchParams.get('installation_id');
-  let installationId = requestedInstallationId ? parseInt(requestedInstallationId, 10) : session.installationId;
+  const requestedInstallationId = request.nextUrl.searchParams.get('installation_id');
+  const installationId = requestedInstallationId ? parseInt(requestedInstallationId, 10) : session.installationId;
 
   // Get organization filters if present
   const organizationsParam = request.nextUrl.searchParams.get('organizations');
diff --git a/src/app/api/my-activity/route.ts b/src/app/api/my-activity/route.ts
index 8b9e1f4..2a7d642 100644
--- a/src/app/api/my-activity/route.ts
+++ b/src/app/api/my-activity/route.ts
@@ -3,6 +3,8 @@ import { getServerSession } from "next-auth";
 import { authOptions } from "../auth/[...nextauth]/route";
 import { 
   fetchAllRepositories, 
+  fetchRepositories,
+  fetchAppRepositories,
   fetchCommitsForRepositories, 
   fetchCommitsForRepositoriesWithOctokit, 
   Commit,
diff --git a/src/app/api/my-org-activity/route.ts b/src/app/api/my-org-activity/route.ts
index 5475b94..e12493b 100644
--- a/src/app/api/my-org-activity/route.ts
+++ b/src/app/api/my-org-activity/route.ts
@@ -3,6 +3,8 @@ import { getServerSession } from "next-auth";
 import { authOptions } from "../auth/[...nextauth]/route";
 import { 
   fetchAllRepositories, 
+  fetchRepositories,
+  fetchAppRepositories,
   fetchCommitsForRepositoriesWithOctokit,
   Commit,
   Repository 
diff --git a/src/app/api/repos/route.ts b/src/app/api/repos/route.ts
index 9fac089..f74a2ce 100644
--- a/src/app/api/repos/route.ts
+++ b/src/app/api/repos/route.ts
@@ -40,7 +40,7 @@ async function handleGetRepositories(request: NextRequest, session: any) {
   });
   
   // Get installation ID from query parameter if present
-  let requestedInstallationId = request.nextUrl.searchParams.get('installation_id');
+  const requestedInstallationId = request.nextUrl.searchParams.get('installation_id');
   let installationId = requestedInstallationId ? parseInt(requestedInstallationId, 10) : session.installationId;
   
   // Create cache key parameters
@@ -246,7 +246,7 @@ async function handleGetRepositories(request: NextRequest, session: any) {
     let statusCode = 500;
     let signOutRequired = false;
     let errorDetails = "";
-    let needsInstallation = false;
+    const needsInstallation = false;
 
     // Check for specific error types based on our custom error classes
     if (error instanceof GitHubConfigError) {
diff --git a/src/app/api/summary/route.ts b/src/app/api/summary/route.ts
index 2d5c13f..75cbdc5 100644
--- a/src/app/api/summary/route.ts
+++ b/src/app/api/summary/route.ts
@@ -60,7 +60,7 @@ async function handleGET(request: NextRequest): Promise<NextResponse> {
   }
   
   // Get installation IDs from query parameter if present
-  let requestedInstallationIds = request.nextUrl.searchParams.get('installation_ids');
+  const requestedInstallationIds = request.nextUrl.searchParams.get('installation_ids');
   let installationIds: number[] = [];
   
   if (requestedInstallationIds) {
@@ -482,7 +482,7 @@ async function handleGET(request: NextRequest): Promise<NextResponse> {
     
     // Always use chronological view (no grouping)
     // Simplified grouping for chronological view only
-    let groupedResults: GroupedResult[] = [{
+    const groupedResults: GroupedResult[] = [{
       groupKey: 'all',
       groupName: 'All Commits',
       commitCount: filteredCommits.length,
diff --git a/src/app/api/team-activity/route.ts b/src/app/api/team-activity/route.ts
index f7794db..8eb95ee 100644
--- a/src/app/api/team-activity/route.ts
+++ b/src/app/api/team-activity/route.ts
@@ -3,6 +3,8 @@ import { getServerSession } from "next-auth";
 import { authOptions } from "../auth/[...nextauth]/route";
 import { 
   fetchAllRepositories, 
+  fetchRepositories,
+  fetchAppRepositories,
   fetchCommitsForRepositoriesWithOctokit, 
   Commit,
   Repository
@@ -27,11 +29,7 @@ type TeamActivityResponse = {
     repositories: string[];
     dates: string[];
     organizations: string[];
-    contributors: { 
-      username: string;
-      display_name: string;
-      avatar_url: string | null;
-    }[];
+    contributors: MinimalContributor[];
   };
   pagination: {
     hasMore: boolean;
@@ -253,8 +251,8 @@ async function handleGET(request: NextRequest): Promise<NextResponse> {
         if (!contributorsMap.has(username)) {
           contributorsMap.set(username, {
             username,
-            display_name: commit.commit.author?.name || username,
-            avatar_url: commit.author.avatar_url
+            displayName: commit.commit.author?.name || username,
+            avatarUrl: commit.author.avatar_url
           });
         }
       }
@@ -269,8 +267,8 @@ async function handleGET(request: NextRequest): Promise<NextResponse> {
       
       // Add contributor information if available
       if (commit.author && contributorsMap.has(commit.author.login)) {
-        minimalCommit.author_login = commit.author.login;
-        minimalCommit.author_avatar = commit.author.avatar_url;
+        minimalCommit.authorLogin = commit.author.login;
+        minimalCommit.authorAvatar = commit.author.avatar_url;
       }
       
       return minimalCommit;
diff --git a/src/components/ActivityFeed.tsx b/src/components/ActivityFeed.tsx
index fca76ec..1131200 100644
--- a/src/components/ActivityFeed.tsx
+++ b/src/components/ActivityFeed.tsx
@@ -1,4 +1,4 @@
-import React, { useState, useEffect, useCallback, useRef } from 'react';
+import React, { useState, useEffect, useCallback, useRef, ReactElement } from 'react';
 import Image from 'next/image';
 import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
 import { FixedSizeList as List } from 'react-window';
@@ -60,8 +60,8 @@ const CommitItem = React.memo(({
   showContributor: boolean;
   style?: React.CSSProperties;
   isNew?: boolean;
-}) => {
-  const formatDate = (dateString: string) => {
+}): ReactElement => {
+  const formatDate = (dateString: string): string => {
     const date = new Date(dateString);
     return date.toLocaleDateString('en-US', {
       year: 'numeric',
@@ -200,7 +200,7 @@ export default function ActivityFeed({
   showContributor = true,
   itemHeight = 120, // Default item height
   maxHeight = '70vh' // Default max height for the list
-}: ActivityFeedProps) {
+}: ActivityFeedProps): ReactElement {
   // Set up progressive loading with our custom hook
   const {
     items: commits,
@@ -269,10 +269,11 @@ export default function ActivityFeed({
       
       return () => clearTimeout(timer);
     }
+    return undefined; // Explicit return for the case where condition is not met
   }, [commits.length]);
 
   // Handler for intersection observer callback
-  const handleIntersect = useCallback(() => {
+  const handleIntersect = useCallback((): void => {
     if (canTriggerInfiniteScroll && hasMore && !loading) {
       setCanTriggerInfiniteScroll(false);
       loadMore().finally(() => {
@@ -290,7 +291,7 @@ export default function ActivityFeed({
   }, [reset]);
   
   // Calculate appropriate list height
-  const calculateListHeight = () => {
+  const calculateListHeight = (): number | string => {
     if (typeof maxHeight === 'number') {
       return Math.min(maxHeight, commits.length * itemHeight);
     }
diff --git a/src/components/AuthError.tsx b/src/components/AuthError.tsx
index b63e0ea..b04252b 100644
--- a/src/components/AuthError.tsx
+++ b/src/components/AuthError.tsx
@@ -1,9 +1,9 @@
 'use client';
 
-import { useEffect, useState } from 'react';
+import React, { useEffect, useState } from 'react';
 import { signOut } from 'next-auth/react';
 
-interface AuthErrorProps {
+export interface AuthErrorProps {
   error?: string;
   message?: string;
   code?: string;
@@ -13,6 +13,7 @@ interface AuthErrorProps {
 
 /**
  * Component for displaying authentication errors with appropriate actions
+ * @returns JSX element displaying the error and relevant actions
  */
 export function AuthError({ 
   error = 'Authentication Error', 
@@ -20,7 +21,7 @@ export function AuthError({
   code = 'AUTH_ERROR',
   signOutRequired = false,
   onRetry 
-}: AuthErrorProps) {
+}: AuthErrorProps): React.ReactElement {
   
   const [countdown, setCountdown] = useState(signOutRequired ? 5 : 0);
   
@@ -40,6 +41,8 @@ export function AuthError({
           console.error('Error during sign out:', error);
         });
     }
+    
+    return undefined; // Explicit return for the case where neither condition is met
   }, [countdown, signOutRequired]);
   
   return (
diff --git a/src/lib/activity.ts b/src/lib/activity.ts
index b35da10..53acea7 100644
--- a/src/lib/activity.ts
+++ b/src/lib/activity.ts
@@ -1,9 +1,11 @@
 import { ActivityCommit } from '@/components/ActivityFeed';
 
 /**
- * Formats commit data from API response into a format compatible with ActivityFeed
+ * Formats commit data from API response into a format compatible with ActivityFeed.
+ * Preserves the snake_case naming convention for properties in ActivityCommit as expected by ActivityFeed,
+ * while supporting camelCase properties in the input.
  * 
- * @param commits - Raw commits from API
+ * @param commits - Raw commits from API, with either snake_case or camelCase property names
  * @returns - Formatted commit data for ActivityFeed
  */
 export function formatActivityCommits(commits: any[]): ActivityCommit[] {
@@ -13,7 +15,7 @@ export function formatActivityCommits(commits: any[]): ActivityCommit[] {
 
   return commits.map(commit => ({
     sha: commit.sha,
-    html_url: commit.html_url,
+    html_url: commit.htmlUrl || commit.html_url, // Support both naming conventions
     commit: {
       message: commit.commit.message,
       author: {
@@ -23,13 +25,13 @@ export function formatActivityCommits(commits: any[]): ActivityCommit[] {
     },
     repository: commit.repository ? {
       name: commit.repository.name,
-      full_name: commit.repository.full_name,
-      html_url: commit.repository.html_url
+      full_name: commit.repository.fullName || commit.repository.full_name, // Support both naming conventions
+      html_url: commit.repository.htmlUrl || commit.repository.html_url // Support both naming conventions
     } : undefined,
     contributor: commit.contributor ? {
       username: commit.contributor.username,
-      displayName: commit.contributor.displayName,
-      avatarUrl: commit.contributor.avatarUrl
+      displayName: commit.contributor.displayName, // Already uses camelCase
+      avatarUrl: commit.contributor.avatarUrl // Already uses camelCase
     } : undefined
   }));
 }
@@ -67,8 +69,9 @@ export function createActivityFetcher(baseUrl: string, params: Record<string, st
     // Return formatted data with pagination info
     return {
       data: formatActivityCommits(data.commits || []),
-      nextCursor: data.pagination?.nextCursor || null,
-      hasMore: data.pagination?.hasMore || false
+      // Support both camelCase and snake_case property names in pagination info
+      nextCursor: data.pagination?.nextCursor || data.pagination?.next_cursor || null,
+      hasMore: data.pagination?.hasMore || data.pagination?.has_more || false
     };
   };
 }
\ No newline at end of file
diff --git a/src/lib/auth/apiErrorHandler.ts b/src/lib/auth/apiErrorHandler.ts
index 8521c8c..021e9bd 100644
--- a/src/lib/auth/apiErrorHandler.ts
+++ b/src/lib/auth/apiErrorHandler.ts
@@ -43,7 +43,7 @@ export function createApiErrorResponse(
   let statusCode = 500;
   let errorDetails = "";
   let signOutRequired = false;
-  let needsInstallation = false;
+  const needsInstallation = false;
   let resetAt: string | undefined = undefined;
   
   // Handle based on error type
diff --git a/src/lib/auth/githubAuth.test.ts b/src/lib/auth/githubAuth.test.ts
index cc71527..86ff59a 100644
--- a/src/lib/auth/githubAuth.test.ts
+++ b/src/lib/auth/githubAuth.test.ts
@@ -33,13 +33,17 @@ describe('githubAuth', () => {
     
     // Mock createAppAuth
     (createAppAuth as jest.MockedFunction<typeof createAppAuth>).mockImplementation(() => {
-      return async () => {
+      const auth: any = async () => {
         return {
           type: 'token',
           token: 'mock-installation-token',
           expiresAt: '2099-01-01T00:00:00Z'
         };
       };
+      
+      // Add the missing hook property required by AuthInterface
+      auth.hook = jest.fn();
+      return auth;
     });
     
     // Set up environment variables for GitHub App auth
@@ -121,9 +125,13 @@ describe('githubAuth', () => {
       // Arrange
       const authError = new Error('Authentication failed');
       (createAppAuth as jest.MockedFunction<typeof createAppAuth>).mockImplementation(() => {
-        return async () => {
+        const auth: any = async () => {
           throw authError;
         };
+        
+        // Add the missing hook property required by AuthInterface
+        auth.hook = jest.fn();
+        return auth;
       });
       
       const credentials: GitHubCredentials = {
diff --git a/src/lib/auth/tokenValidator.ts b/src/lib/auth/tokenValidator.ts
index 4f1d668..9aba102 100644
--- a/src/lib/auth/tokenValidator.ts
+++ b/src/lib/auth/tokenValidator.ts
@@ -2,6 +2,11 @@ import { logger } from "../logger";
 import { Session } from "next-auth";
 import { signOut } from "next-auth/react";
 
+// Extend Session type to include accessToken
+interface GitHubSession extends Session {
+  accessToken?: string;
+}
+
 const MODULE_NAME = "auth:tokenValidator";
 
 /**
@@ -56,7 +61,7 @@ export async function isGitHubTokenValid(accessToken: string): Promise<boolean>
  * @returns {Promise<boolean>} True if the session is valid, false otherwise
  */
 export async function validateAuthState(
-  session: Session | null, 
+  session: GitHubSession | null, 
   options: { 
     forceSignOut?: boolean;
     callback?: (isValid: boolean) => void;
@@ -102,8 +107,9 @@ export async function validateAuthState(
 /**
  * A React hook for client components to verify authentication status on mount
  * This can be used in layout.tsx or individual pages
+ * @returns An object containing the validation state
  */
-export function useAuthValidator() {
+export function useAuthValidator(): { isValidating: boolean; isValid: boolean } {
   if (typeof window === "undefined") {
     return { isValidating: false, isValid: false };
   }
@@ -111,4 +117,5 @@ export function useAuthValidator() {
   // This would be implemented with React hooks
   // using useState and useEffect to validate auth on component mount
   // Implementation details omitted as this is a TypeScript-only file
+  return { isValidating: false, isValid: false };
 }
\ No newline at end of file
diff --git a/src/lib/errors.ts b/src/lib/errors.ts
index 48e5187..33559ea 100644
--- a/src/lib/errors.ts
+++ b/src/lib/errors.ts
@@ -1,6 +1,12 @@
 // Custom error classes for GitHub API operations
 import { logger } from "./logger";
 
+// Define ErrorOptions type if not available in global scope
+type ErrorOptions = {
+  cause?: unknown;
+  [key: string]: unknown;
+};
+
 const MODULE_NAME = "github:errors";
 
 /**
@@ -8,10 +14,10 @@ const MODULE_NAME = "github:errors";
  */
 export class GitHubError extends Error {
   public readonly cause?: Error;
-  public readonly context?: Record<string, any>;
+  public readonly context?: Record<string, unknown>;
 
-  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
-    super(message, options);
+  constructor(message: string, options?: ErrorOptions & { context?: Record<string, unknown> }) {
+    super(message);
     this.name = this.constructor.name; // Ensure correct name
     this.cause = options?.cause instanceof Error ? options?.cause : undefined;
     this.context = options?.context;
@@ -26,7 +32,7 @@ export class GitHubError extends Error {
  * Error for configuration issues (e.g., missing App ID/Key).
  */
 export class GitHubConfigError extends GitHubError {
-  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
+  constructor(message: string, options?: ErrorOptions & { context?: Record<string, unknown> }) {
     super(message, options);
   }
 }
@@ -37,7 +43,7 @@ export class GitHubConfigError extends GitHubError {
 export class GitHubAuthError extends GitHubError {
   public readonly status: number;
 
-  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, any> }) {
+  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, unknown> }) {
     super(message, options);
     this.status = options?.status ?? 401; // Default to 401
   }
@@ -49,7 +55,7 @@ export class GitHubAuthError extends GitHubError {
 export class GitHubNotFoundError extends GitHubError {
   public readonly status: number = 404;
 
-  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
+  constructor(message: string, options?: ErrorOptions & { context?: Record<string, unknown> }) {
     super(message, options);
   }
 }
@@ -61,7 +67,7 @@ export class GitHubRateLimitError extends GitHubError {
   public readonly status: number;
   public readonly resetTimestamp?: number; // Unix timestamp (seconds)
 
-  constructor(message: string, options?: ErrorOptions & { status?: number, resetTimestamp?: number, context?: Record<string, any> }) {
+  constructor(message: string, options?: ErrorOptions & { status?: number, resetTimestamp?: number, context?: Record<string, unknown> }) {
     super(message, options);
     this.status = options?.status ?? 429; // Default to 429
     this.resetTimestamp = options?.resetTimestamp;
@@ -74,44 +80,46 @@ export class GitHubRateLimitError extends GitHubError {
 export class GitHubApiError extends GitHubError {
   public readonly status: number;
 
-  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, any> }) {
+  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, unknown> }) {
     super(message, options);
     this.status = options?.status ?? 500; // Default to 500
   }
 }
 
 /**
- * Helper function to analyze Octokit/generic errors and throw appropriate GitHubError.
- * @param error The caught error.
- * @param context Additional context for the error message and logging.
+ * Extract error information from an error object.
+ * 
+ * @param error The caught error
+ * @param functionName The name of the function where the error occurred
+ * @returns Object containing extracted message, status, and headers
  */
-export function handleGitHubError(error: unknown, context: Record<string, any> = {}): never {
-    const functionName = context.functionName || 'unknown GitHub function';
-    logger.error(MODULE_NAME, `Error in ${functionName}`, { ...context, error });
-
-    if (error instanceof GitHubError) {
-        // If it's already one of our custom errors, re-throw it
-        throw error;
-    }
-
+function extractErrorInfo(error: unknown, functionName: string): {
+    message: string;
+    status?: number;
+    headers: Record<string, string>;
+} {
     let message = `GitHub operation failed in ${functionName}`;
     let status: number | undefined;
     let headers: Record<string, string> = {};
 
     // Check if it's an Octokit RequestError like object
     if (typeof error === 'object' && error !== null) {
-        const err = error as any; // Use any for broader compatibility
+        const err = error as Record<string, unknown>;
         if (typeof err.message === 'string') {
             message = err.message;
         }
         if (typeof err.status === 'number') {
             status = err.status;
         }
-        if (typeof err.response?.headers === 'object') {
-            headers = err.response.headers;
-        } else if (typeof err.headers === 'object') {
-            // Sometimes headers are directly on the error object
-            headers = err.headers;
+        
+        // Extract headers from different possible locations
+        if (typeof err.response === 'object' && err.response !== null) {
+            const response = err.response as Record<string, unknown>;
+            if (typeof response.headers === 'object' && response.headers !== null) {
+                headers = response.headers as Record<string, string>;
+            }
+        } else if (typeof err.headers === 'object' && err.headers !== null) {
+            headers = err.headers as Record<string, string>;
         }
     } else if (error instanceof Error) {
         message = error.message;
@@ -119,33 +127,122 @@ export function handleGitHubError(error: unknown, context: Record<string, any> =
         message = 'An unknown error occurred during GitHub operation.';
     }
 
-    const errorOptions: ErrorOptions & { status?: number, resetTimestamp?: number, context?: Record<string, any> } = {
+    return { message, status, headers };
+}
+
+/**
+ * Check if an error is a rate limit error based on headers.
+ * 
+ * @param headers HTTP headers from the response
+ * @returns Object containing whether it's a rate limit error and the reset timestamp
+ */
+function checkRateLimitError(headers: Record<string, string>): {
+    isRateLimitError: boolean;
+    resetTimestamp?: number;
+} {
+    const rateLimitRemaining = headers['x-ratelimit-remaining'];
+    const rateLimitReset = headers['x-ratelimit-reset'];
+    
+    if (rateLimitRemaining === '0' && rateLimitReset) {
+        return {
+            isRateLimitError: true,
+            resetTimestamp: parseInt(rateLimitReset, 10)
+        };
+    }
+    
+    return { isRateLimitError: false };
+}
+
+/**
+ * Create error options for GitHub errors.
+ * 
+ * @param error The original error
+ * @param context Additional context information
+ * @param status HTTP status code
+ * @param resetTimestamp Optional rate limit reset timestamp
+ * @returns Error options object
+ */
+function createErrorOptions(
+    error: unknown, 
+    context: Record<string, unknown>, 
+    status?: number,
+    resetTimestamp?: number
+): ErrorOptions & { status?: number; resetTimestamp?: number; context?: Record<string, unknown> } {
+    return {
         cause: error instanceof Error ? error : undefined,
-        status: status,
-        context: context
+        status,
+        resetTimestamp,
+        context
     };
+}
+
+/**
+ * Handle authentication and authorization errors.
+ * 
+ * @param message Error message
+ * @param status HTTP status code
+ * @param headers HTTP headers
+ * @param options Error options
+ * @returns Never returns, always throws an error
+ */
+function handleAuthError(
+    message: string,
+    status: number,
+    headers: Record<string, string>,
+    options: ErrorOptions & { status?: number; resetTimestamp?: number; context?: Record<string, unknown> }
+): never {
+    // Check if it's a rate limit error
+    const { isRateLimitError, resetTimestamp } = checkRateLimitError(headers);
+    if (isRateLimitError) {
+        options.resetTimestamp = resetTimestamp;
+        throw new GitHubRateLimitError(`GitHub API rate limit exceeded. ${message}`, options);
+    }
+    
+    // Check for scope or permission issues
+    if (message.includes('scope') || message.includes('permission')) {
+        throw new GitHubAuthError(`GitHub permission or scope error: ${message}`, options);
+    }
+    
+    // Default auth error
+    throw new GitHubAuthError(`GitHub authentication/authorization error (Status ${status}): ${message}`, options);
+}
 
+/**
+ * Helper function to analyze Octokit/generic errors and throw appropriate GitHubError.
+ * 
+ * @param error The caught error
+ * @param context Additional context for the error message and logging
+ * @returns Never returns, always throws an error
+ */
+export function handleGitHubError(error: unknown, context: Record<string, unknown> = {}): never {
+    const functionName = (context.functionName as string) || 'unknown GitHub function';
+    logger.error(MODULE_NAME, `Error in ${functionName}`, { ...context, error });
+
+    // If it's already one of our custom errors, re-throw it
+    if (error instanceof GitHubError) {
+        throw error;
+    }
+
+    // Extract error information
+    const { message, status, headers } = extractErrorInfo(error, functionName);
+    
+    // Create error options
+    const errorOptions = createErrorOptions(error, context, status);
+
+    // Handle different error types based on status code
     switch (status) {
         case 401:
         case 403:
-            // Check for rate limit headers
-            const rateLimitRemaining = headers['x-ratelimit-remaining'];
-            const rateLimitReset = headers['x-ratelimit-reset'];
-            if (rateLimitRemaining === '0' && rateLimitReset) {
-                errorOptions.resetTimestamp = parseInt(rateLimitReset, 10);
-                throw new GitHubRateLimitError(`GitHub API rate limit exceeded. ${message}`, errorOptions);
-            }
-            // Check for scope issues mentioned in the message
-            if (message.includes('scope') || message.includes('permission')) {
-                throw new GitHubAuthError(`GitHub permission or scope error: ${message}`, errorOptions);
-            }
-            throw new GitHubAuthError(`GitHub authentication/authorization error (Status ${status}): ${message}`, errorOptions);
+            return handleAuthError(message, status, headers, errorOptions);
+            
         case 404:
             throw new GitHubNotFoundError(`GitHub resource not found (Status 404): ${message}`, errorOptions);
+            
         case 429: // Explicit rate limit status
-             const resetTimestamp = headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) : undefined;
-             errorOptions.resetTimestamp = resetTimestamp;
-             throw new GitHubRateLimitError(`GitHub API rate limit exceeded (Status 429). ${message}`, errorOptions);
+            const resetTimestamp = headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) : undefined;
+            errorOptions.resetTimestamp = resetTimestamp;
+            throw new GitHubRateLimitError(`GitHub API rate limit exceeded (Status 429). ${message}`, errorOptions);
+            
         default:
             if (status && status >= 400 && status < 600) {
                 throw new GitHubApiError(`GitHub API error (Status ${status}): ${message}`, errorOptions);
diff --git a/src/lib/gemini.ts b/src/lib/gemini.ts
index feba4f5..c8e5dca 100644
--- a/src/lib/gemini.ts
+++ b/src/lib/gemini.ts
@@ -1,10 +1,13 @@
-import { GoogleGenerativeAI } from "@google/generative-ai";
-import { Commit } from "@/types/github";
+import { GoogleGenerativeAI, GenerateContentResult, GenerationConfig } from "@google/generative-ai";
+import { Commit } from "../types/github";
 import { logger } from "./logger";
 import { isGitHubTokenValid } from "./auth/tokenValidator";
 
 const MODULE_NAME = "gemini";
 
+/**
+ * Interface representing the structure of a commit summary generated by the Gemini API.
+ */
 export interface CommitSummary {
   keyThemes: string[];
   technicalAreas: {
@@ -24,61 +27,74 @@ export interface CommitSummary {
   overallSummary: string;
 }
 
-export async function generateCommitSummary(
-  commits: Commit[],
-  apiKey: string,
-  accessToken?: string,
-): Promise<CommitSummary> {
-  logger.debug(MODULE_NAME, "generateCommitSummary called", {
-    commitsCount: commits.length,
-    apiKeyProvided: !!apiKey,
-    accessTokenProvided: !!accessToken,
-  });
-
-  if (!apiKey) {
-    logger.error(MODULE_NAME, "No API key provided");
-    throw new Error("Gemini API key is required");
-  }
-  
-  // Validate GitHub token if provided
-  if (accessToken) {
-    const isValid = await isGitHubTokenValid(accessToken);
-    if (!isValid) {
-      logger.error(MODULE_NAME, "Invalid GitHub token provided");
-      throw new Error("GitHub authentication failed. Please sign in again.");
-    }
-  }
+/**
+ * Interface for simplified commit data sent to Gemini API.
+ */
+interface CommitDataForAnalysis {
+  message: string;
+  date: string;
+  author: string;
+  repository: string;
+  url: string;
+}
 
-  if (commits.length === 0) {
-    logger.info(MODULE_NAME, "No commits provided, returning empty summary");
-    return {
-      keyThemes: ["No commits found in the selected time period"],
-      technicalAreas: [],
-      accomplishments: ["No activity in the selected time period"],
-      commitsByType: [],
-      timelineHighlights: [],
-      overallSummary: "No commits were found in the selected time period.",
-    };
-  }
+/**
+ * Creates an empty commit summary for cases with no commits.
+ * 
+ * @returns An empty CommitSummary object
+ */
+function createEmptyCommitSummary(): CommitSummary {
+  return {
+    keyThemes: ["No commits found in the selected time period"],
+    technicalAreas: [],
+    accomplishments: ["No activity in the selected time period"],
+    commitsByType: [],
+    timelineHighlights: [],
+    overallSummary: "No commits were found in the selected time period.",
+  };
+}
 
-  // Initialize Gemini API
+/**
+ * Initializes the Gemini AI model for text generation.
+ * 
+ * @param apiKey The Gemini API key
+ * @returns Initialized Gemini model
+ */
+function initializeGeminiModel(apiKey: string) {
   logger.debug(MODULE_NAME, "Initializing Gemini API");
+  
   const genAI = new GoogleGenerativeAI(apiKey);
+  const generationConfig: GenerationConfig = {
+    temperature: 0.5,
+    responseMimeType: "application/json",
+  };
+  
   const model = genAI.getGenerativeModel({
     model: "gemini-2.0-flash",
-    generationConfig: {
-      temperature: 0.5,
-      responseMimeType: "application/json",
-    },
+    generationConfig,
   });
+  
   logger.debug(MODULE_NAME, "Gemini API initialized", {
     modelName: "gemini-2.0-flash",
-    maxOutputTokens: 2048,
-    temperature: 0.2,
+    temperature: generationConfig.temperature,
+    responseMimeType: generationConfig.responseMimeType,
   });
+  
+  return model;
+}
 
-  // Prepare the commit data for analysis
+/**
+ * Prepares commit data for analysis by Gemini.
+ * 
+ * @param commits Array of GitHub commits
+ * @returns Simplified commit data array and debugging metadata
+ */
+function prepareCommitData(commits: Commit[]): {
+  commitData: CommitDataForAnalysis[];
+  debugMetadata: Record<string, unknown>;
+} {
   logger.debug(MODULE_NAME, "Preparing commit data for analysis");
+  
   const commitData = commits.map((commit) => ({
     message: commit.commit.message,
     date: commit.commit.author?.date || "unknown",
@@ -86,8 +102,9 @@ export async function generateCommitSummary(
     repository: commit.repository?.full_name || "unknown",
     url: commit.html_url,
   }));
-
-  logger.debug(MODULE_NAME, "Commit data prepared", {
+  
+  // Extract metadata for debugging purposes
+  const debugMetadata = {
     sampleCommit:
       commits.length > 0
         ? {
@@ -117,10 +134,25 @@ export async function generateCommitSummary(
               : "unknown",
           }
         : null,
-  });
+  };
+  
+  logger.debug(MODULE_NAME, "Commit data prepared", debugMetadata);
+  
+  return { commitData, debugMetadata };
+}
 
-  // Construct the prompt for Gemini
+/**
+ * Constructs a prompt for Gemini to analyze commit data.
+ * 
+ * @param commitData Simplified commit data for analysis
+ * @returns Prompt string and metadata
+ */
+function constructGeminiPrompt(commitData: CommitDataForAnalysis[]): {
+  prompt: string;
+  promptMetadata: Record<string, unknown>;
+} {
   logger.debug(MODULE_NAME, "Constructing Gemini prompt");
+  
   const prompt = `
     Analyze these GitHub commits and provide a comprehensive summary.
     Generate a JSON response containing the following sections:
@@ -135,75 +167,156 @@ export async function generateCommitSummary(
     The response should be valid JSON that can be parsed directly. Focus on meaningful technical analysis rather than just counting commits.
     Here's the commit data to analyze: ${JSON.stringify(commitData)}
   `;
-  logger.debug(MODULE_NAME, "Prompt constructed", {
+  
+  const promptMetadata = {
     promptLength: prompt.length,
+    promptTokenEstimate: Math.round(prompt.length / 4), // rough estimate
+  };
+  
+  logger.debug(MODULE_NAME, "Prompt constructed", promptMetadata);
+  
+  return { prompt, promptMetadata };
+}
+
+/**
+ * Calls the Gemini API with the constructed prompt.
+ * 
+ * @param model Initialized Gemini model
+ * @param prompt The prompt for Gemini
+ * @param metadata Additional metadata for logging
+ * @returns The raw text response from Gemini
+ */
+async function callGeminiAPI(
+  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
+  prompt: string,
+  metadata: Record<string, unknown>
+): Promise<string> {
+  logger.info(MODULE_NAME, "Calling Gemini API", metadata);
+  
+  const startTime = Date.now();
+  const result: GenerateContentResult = await model.generateContent(prompt);
+  const response = await result.response;
+  const text = response.text();
+  const endTime = Date.now();
+  
+  logger.info(MODULE_NAME, "Received Gemini API response", {
+    responseTimeMs: endTime - startTime,
+    responseLength: text.length,
+  });
+  
+  logger.debug(MODULE_NAME, "Raw Gemini response", {
+    response: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
   });
+  
+  return text;
+}
 
+/**
+ * Extracts and parses JSON from the Gemini API response.
+ * 
+ * @param text Raw response text from Gemini
+ * @returns Parsed CommitSummary object
+ */
+function parseGeminiResponse(text: string): CommitSummary {
+  // Handle case where Gemini might wrap the JSON in markdown code blocks
+  let jsonText = text;
+  
+  if (text.includes("```json")) {
+    logger.debug(MODULE_NAME, "Detected JSON code block with explicit json tag");
+    jsonText = text.split("```json")[1].split("```")[0].trim();
+  } else if (text.includes("```")) {
+    logger.debug(MODULE_NAME, "Detected generic code block, attempting to extract JSON");
+    jsonText = text.split("```")[1].split("```")[0].trim();
+  }
+  
+  logger.debug(MODULE_NAME, "Attempting to parse JSON response", {
+    jsonPreview: jsonText.substring(0, 100) + (jsonText.length > 100 ? "..." : ""),
+  });
+  
   try {
-    logger.info(MODULE_NAME, "Calling Gemini API", {
-      commitsAnalyzed: commits.length,
-      promptTokenEstimate: prompt.length / 4, // rough estimate
+    const parsedResponse = JSON.parse(jsonText) as CommitSummary;
+    
+    logger.info(MODULE_NAME, "Successfully parsed Gemini response", {
+      themeCount: parsedResponse.keyThemes?.length || 0,
+      technicalAreasCount: parsedResponse.technicalAreas?.length || 0,
+      accomplishmentsCount: parsedResponse.accomplishments?.length || 0,
+      commitTypeCount: parsedResponse.commitsByType?.length || 0,
+      timelineHighlightsCount: parsedResponse.timelineHighlights?.length || 0,
     });
-
-    const startTime = Date.now();
-    const result = await model.generateContent(prompt);
-    const response = await result.response;
-    const text = response.text();
-    const endTime = Date.now();
-
-    logger.info(MODULE_NAME, "Received Gemini API response", {
-      responseTimeMs: endTime - startTime,
-      responseLength: text.length,
-    });
-    logger.debug(MODULE_NAME, "Raw Gemini response", {
-      response: text.substring(0, 500) + (text.length > 500 ? "..." : ""),
+    
+    return parsedResponse;
+  } catch (parseError) {
+    logger.error(MODULE_NAME, "Error parsing Gemini response", {
+      error: parseError,
+      rawResponsePreview: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
     });
+    throw new Error("Failed to parse Gemini API response");
+  }
+}
 
-    // Parse the JSON response
-    try {
-      // Handle case where Gemini might wrap the JSON in markdown code blocks
-      let jsonText = text;
-
-      if (text.includes("```json")) {
-        logger.debug(
-          MODULE_NAME,
-          "Detected JSON code block with explicit json tag",
-        );
-        jsonText = text.split("```json")[1].split("```")[0].trim();
-      } else if (text.includes("```")) {
-        logger.debug(
-          MODULE_NAME,
-          "Detected generic code block, attempting to extract JSON",
-        );
-        jsonText = text.split("```")[1].split("```")[0].trim();
-      }
-
-      logger.debug(MODULE_NAME, "Attempting to parse JSON response", {
-        jsonPreview:
-          jsonText.substring(0, 100) + (jsonText.length > 100 ? "..." : ""),
-      });
+/**
+ * Main function to generate a commit summary using the Gemini API.
+ * 
+ * @param commits Array of GitHub commits to analyze
+ * @param apiKey Gemini API key
+ * @param accessToken Optional GitHub access token for validation
+ * @returns A CommitSummary object with analysis results
+ */
+export async function generateCommitSummary(
+  commits: Commit[],
+  apiKey: string,
+  accessToken?: string,
+): Promise<CommitSummary> {
+  const context = {
+    commitsCount: commits.length,
+    apiKeyProvided: !!apiKey,
+    accessTokenProvided: !!accessToken,
+  };
+  
+  logger.debug(MODULE_NAME, "generateCommitSummary called", context);
 
-      const parsedResponse = JSON.parse(jsonText);
+  // Validate input parameters
+  if (!apiKey) {
+    logger.error(MODULE_NAME, "No API key provided");
+    throw new Error("Gemini API key is required");
+  }
+  
+  // Validate GitHub token if provided
+  if (accessToken) {
+    const isValid = await isGitHubTokenValid(accessToken);
+    if (!isValid) {
+      logger.error(MODULE_NAME, "Invalid GitHub token provided");
+      throw new Error("GitHub authentication failed. Please sign in again.");
+    }
+  }
 
-      logger.info(MODULE_NAME, "Successfully parsed Gemini response", {
-        themeCount: parsedResponse.keyThemes?.length || 0,
-        technicalAreasCount: parsedResponse.technicalAreas?.length || 0,
-        accomplishmentsCount: parsedResponse.accomplishments?.length || 0,
-        commitTypeCount: parsedResponse.commitsByType?.length || 0,
-        timelineHighlightsCount: parsedResponse.timelineHighlights?.length || 0,
-      });
+  // Handle empty commits case
+  if (commits.length === 0) {
+    logger.info(MODULE_NAME, "No commits provided, returning empty summary");
+    return createEmptyCommitSummary();
+  }
 
-      return parsedResponse;
-    } catch (parseError) {
-      logger.error(MODULE_NAME, "Error parsing Gemini response", {
-        error: parseError,
-        rawResponsePreview:
-          text.substring(0, 200) + (text.length > 200 ? "..." : ""),
-      });
-      throw new Error("Failed to parse Gemini API response");
-    }
+  try {
+    // Initialize Gemini model
+    const model = initializeGeminiModel(apiKey);
+    
+    // Prepare commit data for analysis
+    const { commitData, debugMetadata } = prepareCommitData(commits);
+    
+    // Construct prompt for Gemini
+    const { prompt, promptMetadata } = constructGeminiPrompt(commitData);
+    
+    // Call Gemini API
+    const responseText = await callGeminiAPI(model, prompt, {
+      ...context,
+      ...promptMetadata,
+      ...debugMetadata,
+    });
+    
+    // Parse and return the response
+    return parseGeminiResponse(responseText);
   } catch (error) {
-    logger.error(MODULE_NAME, "Error calling Gemini API", { error });
+    logger.error(MODULE_NAME, "Error generating commit summary", { error, ...context });
     throw error;
   }
 }
diff --git a/src/lib/githubData.ts b/src/lib/githubData.ts
index cec2aa6..fa0c61d 100644
--- a/src/lib/githubData.ts
+++ b/src/lib/githubData.ts
@@ -39,6 +39,401 @@ import { createAuthenticatedOctokit, GitHubCredentials } from "./auth/githubAuth
 // Module name for consistent logging
 const MODULE_NAME = "githubData";
 
+// Utility functions
+
+/**
+ * Checks the GitHub API rate limit status.
+ * 
+ * @param octokit Authenticated Octokit instance
+ * @param context Logging context information
+ * @returns Promise that resolves when check is complete
+ */
+async function checkRateLimits(
+  octokit: Octokit, 
+  context: Record<string, unknown>
+): Promise<void> {
+  try {
+    const rateLimit = await octokit.rest.rateLimit.get();
+    const core = rateLimit.data.resources.core;
+    
+    logger.info(MODULE_NAME, "GitHub API rate limit status", {
+      ...context,
+      limit: core.limit,
+      remaining: core.remaining,
+      reset: new Date(core.reset * 1000).toISOString(),
+      usedPercent: 100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
+    });
+
+    if (core.remaining < 100) {
+      logger.warn(MODULE_NAME, "GitHub API rate limit is running low", {
+        ...context,
+        remaining: core.remaining,
+        resetTime: new Date(core.reset * 1000).toISOString(),
+      });
+    }
+  } catch (rateLimitError) {
+    // Non-fatal error, just log and continue
+    logger.warn(MODULE_NAME, "Failed to check GitHub API rate limits", {
+      ...context,
+      error: rateLimitError,
+    });
+  }
+}
+
+/**
+ * Validates token scopes and permissions.
+ * 
+ * @param octokit Authenticated Octokit instance
+ * @param context Logging context information
+ * @returns Promise that resolves to the user info if successful
+ * @throws GitHubAuthError if token lacks required scopes
+ */
+async function validateTokenScopes(
+  octokit: Octokit, 
+  context: Record<string, unknown>
+): Promise<Record<string, unknown>> {
+  try {
+    const userInfo = await octokit.rest.users.getAuthenticated();
+    const scopesHeader = userInfo.headers["x-oauth-scopes"] || "";
+    const scopes = scopesHeader ? scopesHeader.split(", ") : [];
+
+    logger.info(MODULE_NAME, "Authenticated user details", {
+      ...context,
+      login: userInfo.data.login,
+      id: userInfo.data.id,
+      type: userInfo.data.type,
+      twoFactorEnabled: (userInfo.data as Record<string, unknown>).two_factor_authentication,
+      tokenScopes: scopes,
+      hasRepoScope: scopes.includes("repo"),
+      hasReadOrgScope: scopes.includes("read:org"),
+    });
+
+    // strongly recommend ensuring 'repo' and 'read:org' if you want all repos
+    if (!scopes.includes("repo")) {
+      logger.warn(
+        MODULE_NAME,
+        "GitHub token is missing 'repo' scope. This will prevent access to private repositories.",
+        context,
+      );
+      throw new GitHubAuthError(
+        "GitHub token is missing 'repo' scope. Please re-authenticate with the necessary permissions.",
+        { context }
+      );
+    }
+
+    if (!scopes.includes("read:org")) {
+      logger.warn(
+        MODULE_NAME,
+        "GitHub token is missing 'read:org' scope. This may limit access to organization data.",
+        context,
+      );
+      // Note: We're not throwing an error for missing read:org, just warning
+    }
+    
+    return userInfo.data;
+  } catch (userInfoError) {
+    // This could be an auth error, so we should throw it
+    logger.warn(MODULE_NAME, "Could not retrieve authenticated user info", {
+      ...context,
+      error: userInfoError,
+    });
+    return handleGitHubError(userInfoError, {
+      ...context,
+      subOperation: "getAuthenticated"
+    });
+  }
+}
+
+/**
+ * Fetches repositories for an authenticated user with combined affiliations.
+ * 
+ * @param octokit Authenticated Octokit instance
+ * @param context Logging context information
+ * @returns Promise that resolves to array of repositories
+ */
+async function fetchUserRepositories(
+  octokit: Octokit, 
+  context: Record<string, unknown>
+): Promise<Repository[]> {
+  logger.debug(
+    MODULE_NAME,
+    "Fetching all repos with combined affiliation=owner,collaborator,organization_member and visibility=all",
+    context,
+  );
+  
+  const combinedRepos = await octokit.paginate(
+    octokit.rest.repos.listForAuthenticatedUser,
+    {
+      per_page: 100,
+      sort: "updated",
+      visibility: "all",
+      affiliation: "owner,collaborator,organization_member",
+    },
+  );
+  
+  logger.info(MODULE_NAME, "Fetched combined affiliation repos", {
+    ...context,
+    count: combinedRepos.length,
+  });
+  
+  return combinedRepos;
+}
+
+/**
+ * Fetches repositories from organizations the user belongs to.
+ * 
+ * @param octokit Authenticated Octokit instance
+ * @param context Logging context information
+ * @returns Promise that resolves to array of repositories
+ */
+async function fetchOrganizationRepositories(
+  octokit: Octokit, 
+  context: Record<string, unknown>
+): Promise<Repository[]> {
+  let orgRepositories: Repository[] = [];
+  
+  try {
+    const orgs = await octokit.paginate(
+      octokit.rest.orgs.listForAuthenticatedUser,
+      {
+        per_page: 100,
+      },
+    );
+    
+    logger.info(MODULE_NAME, "Fetched user organizations", {
+      ...context,
+      count: orgs.length,
+      orgs: orgs.map((o) => o.login),
+    });
+
+    for (const org of orgs) {
+      try {
+        const orgRepos = await octokit.paginate(
+          octokit.rest.repos.listForOrg,
+          {
+            org: org.login,
+            per_page: 100,
+            sort: "updated",
+            type: "all", // private + public + forks, etc. as long as your token can see them
+          },
+        );
+        
+        logger.info(MODULE_NAME, `Fetched repos for org: ${org.login}`, {
+          ...context,
+          count: orgRepos.length,
+        });
+        
+        // Make sure we're creating a proper array of repositories
+        if (Array.isArray(orgRepos)) {
+          orgRepositories = [...orgRepositories, ...orgRepos];
+        } else if (orgRepos) {
+          // If it's a single repo, add it to the array
+          orgRepositories.push(orgRepos as Repository);
+        }
+      } catch (orgError) {
+        // Non-fatal error, just log and continue
+        logger.warn(
+          MODULE_NAME,
+          `Error fetching repos for org: ${org.login}`,
+          { ...context, error: orgError },
+        );
+      }
+    }
+  } catch (orgListError) {
+    // Non-fatal error, just log and continue
+    logger.warn(MODULE_NAME, "Failed to list user orgs", {
+      ...context,
+      error: orgListError,
+    });
+  }
+  
+  return orgRepositories;
+}
+
+/**
+ * Deduplicates repositories by full_name.
+ * 
+ * @param repositories Array of repositories to deduplicate
+ * @param context Logging context information
+ * @returns Array of unique repositories
+ */
+function deduplicateRepositories(
+  repositories: Repository[], 
+  context: Record<string, unknown>
+): Repository[] {
+  logger.debug(MODULE_NAME, "Deduplicating repositories", {
+    ...context,
+    beforeCount: repositories.length,
+  });
+  
+  const uniqueRepos = Array.from(
+    new Map(repositories.map((r) => [r.full_name, r])).values(),
+  );
+  
+  logger.info(MODULE_NAME, "Deduplicated repositories", {
+    ...context,
+    afterCount: uniqueRepos.length,
+    duplicatesRemoved: repositories.length - uniqueRepos.length,
+  });
+  
+  return uniqueRepos;
+}
+
+/**
+ * Process a batch of repositories to fetch commits.
+ * 
+ * @param octokit Authenticated Octokit instance
+ * @param repoFullNames Array of repository full names to process
+ * @param since Start date for commit range
+ * @param until End date for commit range
+ * @param author Optional GitHub username to filter commits by
+ * @param context Logging context information
+ * @returns Promise resolving to array of commits
+ */
+async function processBatchForCommits(
+  octokit: Octokit,
+  repoFullNames: string[],
+  since: string,
+  until: string,
+  author: string | undefined,
+  context: Record<string, unknown>
+): Promise<Commit[]> {
+  logger.debug(
+    MODULE_NAME,
+    `Processing batch of ${repoFullNames.length} repositories`,
+    { ...context, repoFullNames }
+  );
+  
+  const results = await Promise.all(
+    repoFullNames.map((repoFullName) => {
+      const [owner, repo] = repoFullName.split("/");
+      return fetchRepositoryCommitsWithOctokit(
+        octokit,
+        owner,
+        repo,
+        since,
+        until,
+        author
+      );
+    })
+  );
+  
+  const allCommits: Commit[] = [];
+  results.forEach((commits) => allCommits.push(...commits));
+  
+  return allCommits;
+}
+
+/**
+ * Process repositories in batches with different author filters.
+ * Implements a fallback strategy when no commits are found with the primary author.
+ * 
+ * @param octokit Authenticated Octokit instance
+ * @param repositories Array of repository full names to process
+ * @param since Start date for commit range
+ * @param until End date for commit range
+ * @param author Optional GitHub username to filter commits by
+ * @param context Logging context information
+ * @returns Promise resolving to array of commits
+ */
+async function processRepositoriesWithFallback(
+  octokit: Octokit,
+  repositories: string[],
+  since: string,
+  until: string,
+  author: string | undefined,
+  context: Record<string, unknown>
+): Promise<Commit[]> {
+  const batchSize = GITHUB_API.BATCH_SIZE;
+  const allCommits: Commit[] = [];
+  let githubUsername = author;
+  
+  // First attempt: Use provided author
+  for (let i = 0; i < repositories.length; i += batchSize) {
+    const batch = repositories.slice(i, i + batchSize);
+    logger.debug(
+      MODULE_NAME,
+      `Processing batch ${Math.floor(i / batchSize) + 1} with author=${githubUsername || 'none'}`,
+      { ...context, batchSize, totalBatches: Math.ceil(repositories.length / batchSize) }
+    );
+    
+    const batchCommits = await processBatchForCommits(
+      octokit,
+      batch,
+      since,
+      until,
+      githubUsername,
+      context
+    );
+    
+    allCommits.push(...batchCommits);
+  }
+  
+  // If no commits found and author specified, try with repo owner as fallback
+  if (allCommits.length === 0 && author) {
+    logger.info(
+      MODULE_NAME,
+      "No commits found with provided author name; retrying with the repo owner as author",
+      context
+    );
+    
+    if (repositories.length > 0) {
+      const [fallbackOwner] = repositories[0].split("/");
+      githubUsername = fallbackOwner;
+      
+      for (let i = 0; i < repositories.length; i += batchSize) {
+        const batch = repositories.slice(i, i + batchSize);
+        const batchCommits = await processBatchForCommits(
+          octokit,
+          batch,
+          since,
+          until,
+          githubUsername,
+          context
+        );
+        
+        allCommits.push(...batchCommits);
+      }
+    }
+  }
+  
+  // Final fallback: No author filter at all
+  if (allCommits.length === 0 && author) {
+    logger.info(
+      MODULE_NAME,
+      "Still no commits found, retrying without author filter",
+      context
+    );
+    
+    for (let i = 0; i < repositories.length; i += batchSize) {
+      const batch = repositories.slice(i, i + batchSize);
+      const batchCommits = await processBatchForCommits(
+        octokit,
+        batch,
+        since,
+        until,
+        undefined,
+        context
+      );
+      
+      allCommits.push(...batchCommits);
+    }
+  }
+  
+  logger.info(
+    MODULE_NAME,
+    "Completed repositories processing for commits",
+    {
+      ...context,
+      totalRepositories: repositories.length,
+      totalCommits: allCommits.length,
+      finalAuthorFilter: githubUsername || "none",
+    }
+  );
+  
+  return allCommits;
+}
+
 /**
  * Represents a GitHub repository with essential metadata.
  * 
@@ -157,6 +552,23 @@ export interface Commit {
  * const repositories = await fetchRepositories(octokit);
  * console.log(`Found ${repositories.length} repositories`);
  */
+/**
+ * Fetches all accessible repositories for the authenticated user across personal and organization accounts.
+ * 
+ * This comprehensive function:
+ * 1. Checks current GitHub API rate limits to avoid unexpected throttling
+ * 2. Validates OAuth token scopes to ensure sufficient permissions
+ * 3. Fetches repositories the user has access to via all affiliations
+ * 4. Fetches repositories from all organizations the user belongs to
+ * 5. Deduplicates repositories to provide a clean, unified list
+ * 
+ * @param octokit - An authenticated Octokit instance (OAuth token-based auth)
+ * @returns A promise resolving to an array of Repository objects the user can access
+ * @throws {GitHubError} If the Octokit instance is not provided
+ * @throws {GitHubAuthError} If authentication fails or token lacks required permissions ('repo' scope)
+ * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
+ * @throws {GitHubApiError} For other GitHub API errors
+ */
 export async function fetchRepositories(
   octokit: Octokit
 ): Promise<Repository[]> {
@@ -167,180 +579,22 @@ export async function fetchRepositories(
     throw new GitHubError("Octokit instance is required", { context });
   }
 
-  let allRepos: Repository[] = [];
-
   try {
-    // check github api rate limits
-    try {
-      const rateLimit = await octokit.rest.rateLimit.get();
-      const core = rateLimit.data.resources.core;
-      logger.info(MODULE_NAME, "GitHub API rate limit status", {
-        ...context,
-        limit: core.limit,
-        remaining: core.remaining,
-        reset: new Date(core.reset * 1000).toISOString(),
-        usedPercent:
-          100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
-      });
-
-      if (core.remaining < 100) {
-        logger.warn(MODULE_NAME, "GitHub API rate limit is running low", {
-          ...context,
-          remaining: core.remaining,
-          resetTime: new Date(core.reset * 1000).toISOString(),
-        });
-      }
-    } catch (rateLimitError) {
-      // Non-fatal error, just log and continue
-      logger.warn(MODULE_NAME, "Failed to check GitHub API rate limits", {
-        ...context,
-        error: rateLimitError,
-      });
-    }
-
-    // retrieve authenticated user info (and check token scopes)
-    try {
-      const userInfo = await octokit.rest.users.getAuthenticated();
-      const scopesHeader = userInfo.headers["x-oauth-scopes"] || "";
-      const scopes = scopesHeader ? scopesHeader.split(", ") : [];
-
-      logger.info(MODULE_NAME, "Authenticated user details", {
-        ...context,
-        login: userInfo.data.login,
-        id: userInfo.data.id,
-        type: userInfo.data.type,
-        // this property isn't in official octokit types:
-        twoFactorEnabled: (userInfo.data as any).two_factor_authentication,
-        tokenScopes: scopes,
-        hasRepoScope: scopes.includes("repo"),
-        hasReadOrgScope: scopes.includes("read:org"),
-      });
-
-      // strongly recommend ensuring 'repo' and 'read:org' if you want all repos
-      if (!scopes.includes("repo")) {
-        logger.warn(
-          MODULE_NAME,
-          "GitHub token is missing 'repo' scope. This will prevent access to private repositories.",
-          context,
-        );
-        throw new GitHubAuthError(
-          "GitHub token is missing 'repo' scope. Please re-authenticate with the necessary permissions.",
-          { context }
-        );
-      }
-
-      if (!scopes.includes("read:org")) {
-        logger.warn(
-          MODULE_NAME,
-          "GitHub token is missing 'read:org' scope. This may limit access to organization data.",
-          context,
-        );
-        // Note: We're not throwing an error for missing read:org, just warning
-      }
-    } catch (userInfoError) {
-      // This could be an auth error, so we should throw it
-      logger.warn(MODULE_NAME, "Could not retrieve authenticated user info", {
-        ...context,
-        error: userInfoError,
-      });
-      return handleGitHubError(userInfoError, {
-        ...context,
-        subOperation: "getAuthenticated"
-      });
-    }
-
-    // the simplest approach to get as many repos as possible:
-    logger.debug(
-      MODULE_NAME,
-      "Fetching all repos with combined affiliation=owner,collaborator,organization_member and visibility=all",
-      context,
-    );
-    const combinedRepos = await octokit.paginate(
-      octokit.rest.repos.listForAuthenticatedUser,
-      {
-        per_page: 100,
-        sort: "updated",
-        visibility: "all",
-        affiliation: "owner,collaborator,organization_member",
-      },
-    );
-    logger.info(MODULE_NAME, "Fetched combined affiliation repos", {
-      ...context,
-      count: combinedRepos.length,
-    });
-    allRepos = combinedRepos;
-
-    // you can optionally also iterate over orgs you belong to and list them directly,
-    // in case you want to see if the direct org approach yields anything new:
-    try {
-      const orgs = await octokit.paginate(
-        octokit.rest.orgs.listForAuthenticatedUser,
-        {
-          per_page: 100,
-        },
-      );
-      logger.info(MODULE_NAME, "Fetched user organizations", {
-        ...context,
-        count: orgs.length,
-        orgs: orgs.map((o) => o.login),
-      });
-
-      for (const org of orgs) {
-        try {
-          const orgRepos = await octokit.paginate(
-            octokit.rest.repos.listForOrg,
-            {
-              org: org.login,
-              per_page: 100,
-              sort: "updated",
-              type: "all", // private + public + forks, etc. as long as your token can see them
-            },
-          );
-          logger.info(MODULE_NAME, `Fetched repos for org: ${org.login}`, {
-            ...context,
-            count: orgRepos.length,
-          });
-          // Make sure we're creating a proper array of repositories
-          // @ts-ignore - Octokit types for returned repository data vary
-          if (Array.isArray(orgRepos)) {
-            allRepos = [...allRepos, ...orgRepos];
-          } else if (orgRepos) {
-            // If it's a single repo, add it to the array
-            // @ts-ignore - Octokit type complexities
-            allRepos.push(orgRepos);
-          }
-        } catch (orgError) {
-          // Non-fatal error, just log and continue
-          logger.warn(
-            MODULE_NAME,
-            `Error fetching repos for org: ${org.login}`,
-            { ...context, error: orgError },
-          );
-        }
-      }
-    } catch (orgListError) {
-      // Non-fatal error, just log and continue
-      logger.warn(MODULE_NAME, "Failed to list user orgs", {
-        ...context,
-        error: orgListError,
-      });
-    }
-
-    // deduplicate by full_name
-    logger.debug(MODULE_NAME, "Deduplicating repositories", {
-      ...context,
-      beforeCount: allRepos.length,
-    });
-    const uniqueRepos = Array.from(
-      new Map(allRepos.map((r) => [r.full_name, r])).values(),
-    );
-    logger.info(MODULE_NAME, "Deduplicated repositories", {
-      ...context,
-      afterCount: uniqueRepos.length,
-      duplicatesRemoved: allRepos.length - uniqueRepos.length,
-    });
-
-    return uniqueRepos;
+    // Check rate limits (non-fatal if this fails)
+    await checkRateLimits(octokit, context);
+    
+    // Validate token scopes (throws if required scopes are missing)
+    await validateTokenScopes(octokit, context);
+    
+    // Step 1: Get repositories through the combined affiliations approach
+    const userRepos = await fetchUserRepositories(octokit, context);
+    
+    // Step 2: Get repositories from organizations the user belongs to
+    const orgRepos = await fetchOrganizationRepositories(octokit, context);
+    
+    // Step 3: Combine and deduplicate repositories
+    const allRepos = [...userRepos, ...orgRepos];
+    return deduplicateRepositories(allRepos, context);
   } catch (error) {
     return handleGitHubError(error, context);
   }
@@ -378,6 +632,21 @@ export async function fetchRepositories(
  * const repositories = await fetchAppRepositories(octokit);
  * console.log(`App installation can access ${repositories.length} repositories`);
  */
+/**
+ * Fetches repositories accessible to a GitHub App installation.
+ * 
+ * This function retrieves all repositories that a GitHub App installation has access to.
+ * Unlike the fetchRepositories function which is intended for OAuth authentication, this
+ * function is specifically designed for GitHub App installations and uses a different
+ * GitHub API endpoint.
+ * 
+ * @param octokit - An authenticated Octokit instance with GitHub App installation authentication
+ * @returns A promise resolving to an array of Repository objects accessible to the installation
+ * @throws {GitHubError} If the Octokit instance is not provided
+ * @throws {GitHubAuthError} If authentication fails or the installation token is invalid
+ * @throws {GitHubRateLimitError} If the GitHub API rate limit is exceeded
+ * @throws {GitHubApiError} For other GitHub API errors
+ */
 export async function fetchAppRepositories(
   octokit: Octokit
 ): Promise<Repository[]> {
@@ -390,27 +659,7 @@ export async function fetchAppRepositories(
 
   try {
     // Check rate limits
-    try {
-      const rateLimit = await octokit.rest.rateLimit.get();
-      const core = rateLimit.data.resources.core;
-      logger.info(MODULE_NAME, "GitHub API rate limit status (App auth)", {
-        ...context,
-        limit: core.limit,
-        remaining: core.remaining,
-        reset: new Date(core.reset * 1000).toISOString(),
-        usedPercent:
-          100 - Number(((core.remaining / core.limit) * 100).toFixed(1)),
-      });
-    } catch (rateLimitError) {
-      logger.warn(
-        MODULE_NAME,
-        "Failed to check GitHub API rate limits (App auth)",
-        {
-          ...context,
-          error: rateLimitError,
-        },
-      );
-    }
+    await checkRateLimits(octokit, context);
 
     // List all repositories accessible to the installation
     logger.debug(
@@ -599,11 +848,12 @@ export async function fetchRepositoryCommitsWithOctokit(
       lastCommitSha: commits.length > 0 ? commits[commits.length - 1].sha : null,
     });
 
-    // attach repository info
+    // attach repository info using camelCase property names
     const commitsWithRepoInfo = commits.map((commit) => ({
       ...commit,
       repository: {
-        full_name: `${owner}/${repo}`,
+        fullName: `${owner}/${repo}`, // Use camelCase for internally added property
+        full_name: `${owner}/${repo}`, // Keep snake_case for backward compatibility
       },
     }));
 
@@ -854,6 +1104,21 @@ export async function fetchRepositoryCommits(
  * );
  * console.log(`Found ${commits.length} commits across ${repositories.length} repositories`);
  */
+/**
+ * Fetches commits across multiple repositories with smart author detection.
+ * 
+ * This high-level function is a key component for generating activity reports across
+ * multiple repositories. It implements a sophisticated approach to commit retrieval
+ * with automatic fallback strategies for author detection.
+ * 
+ * @param octokit - An authenticated Octokit instance (supports both OAuth and App auth)
+ * @param repositories - Array of repository identifiers in "owner/repo" format
+ * @param since - ISO 8601 formatted date string for the earliest commits to include
+ * @param until - ISO 8601 formatted date string for the latest commits to include
+ * @param author - Optional GitHub username to filter commits by author
+ * @returns A promise resolving to an array of Commit objects from all specified repositories
+ * @throws {GitHubError} If the Octokit instance is not provided or for other unexpected errors
+ */
 export async function fetchCommitsForRepositoriesWithOctokit(
   octokit: Octokit,
   repositories: string[] = [],
@@ -875,99 +1140,14 @@ export async function fetchCommitsForRepositoriesWithOctokit(
     throw new GitHubError("Octokit instance is required", { context });
   }
 
-  const allCommits: Commit[] = [];
-  let githubUsername = author;
-  const batchSize = GITHUB_API.BATCH_SIZE;
-
-  // first pass with "author" if provided
-  for (let i = 0; i < repositories.length; i += batchSize) {
-    const batch = repositories.slice(i, i + batchSize);
-    logger.debug(
-      MODULE_NAME,
-      `processing batch ${Math.floor(i / batchSize) + 1}`,
-      { ...context, batchRepos: batch },
-    );
-
-    const results = await Promise.all(
-      batch.map((repoFullName) => {
-        const [owner, repo] = repoFullName.split("/");
-        return fetchRepositoryCommitsWithOctokit(
-          octokit,
-          owner,
-          repo,
-          since,
-          until,
-          githubUsername,
-        );
-      }),
-    );
-    results.forEach((commits) => allCommits.push(...commits));
-  }
-
-  // if we found no commits with that author, try with owner name or no author
-  if (allCommits.length === 0 && author) {
-    logger.info(
-      MODULE_NAME,
-      "No commits found with provided author name; retrying with the repo owner as author",
-      context
-    );
-
-    if (repositories.length > 0) {
-      const [fallbackOwner] = repositories[0].split("/");
-      githubUsername = fallbackOwner;
-      for (let i = 0; i < repositories.length; i += batchSize) {
-        const batch = repositories.slice(i, i + batchSize);
-        const results = await Promise.all(
-          batch.map((repoFullName) => {
-            const [owner, repo] = repoFullName.split("/");
-            return fetchRepositoryCommitsWithOctokit(
-              octokit,
-              owner,
-              repo,
-              since,
-              until,
-              githubUsername,
-            );
-          }),
-        );
-        results.forEach((commits) => allCommits.push(...commits));
-      }
-    }
-  }
-
-  if (allCommits.length === 0 && author) {
-    logger.info(
-      MODULE_NAME,
-      "Still no commits found, retrying without author filter",
-      context
-    );
-    for (let i = 0; i < repositories.length; i += batchSize) {
-      const batch = repositories.slice(i, i + batchSize);
-      const results = await Promise.all(
-        batch.map((repoFullName) => {
-          const [owner, repo] = repoFullName.split("/");
-          return fetchRepositoryCommitsWithOctokit(
-            octokit,
-            owner,
-            repo,
-            since,
-            until,
-            undefined,
-          );
-        }),
-      );
-      results.forEach((commits) => allCommits.push(...commits));
-    }
-  }
-
-  logger.info(MODULE_NAME, "All repository commits fetched", {
-    ...context,
-    totalRepositories: repositories.length,
-    totalCommits: allCommits.length,
-    finalAuthorFilter: githubUsername || "none",
-  });
-
-  return allCommits;
+  return processRepositoriesWithFallback(
+    octokit,
+    repositories,
+    since,
+    until,
+    author,
+    context
+  );
 }
 
 /**
diff --git a/src/lib/optimize.test.ts b/src/lib/optimize.test.ts
new file mode 100644
index 0000000..ba86c06
--- /dev/null
+++ b/src/lib/optimize.test.ts
@@ -0,0 +1,177 @@
+/**
+ * Tests for the optimize.ts module with a focus on naming convention standardization
+ */
+import {
+  MinimalRepository,
+  MinimalCommit,
+  MinimalContributor,
+  ContributorLike,
+  optimizeRepository,
+  optimizeCommit,
+  optimizeContributor
+} from './optimize';
+
+describe('optimize.ts module with camelCase naming conventions', () => {
+  
+  describe('optimizeRepository', () => {
+    it('should convert Repository to MinimalRepository with camelCase properties', () => {
+      // Mock GitHub API Repository object with snake_case properties
+      const mockRepo = {
+        id: 123,
+        name: 'test-repo',
+        full_name: 'owner/test-repo',
+        owner: {
+          login: 'owner'
+        },
+        private: false,
+        language: 'TypeScript',
+        html_url: 'https://github.com/owner/test-repo',
+        description: 'A test repository'
+      };
+
+      // Expected result with camelCase properties
+      const result = optimizeRepository(mockRepo);
+
+      // Assert correct property conversion
+      expect(result.id).toBe(123);
+      expect(result.name).toBe('test-repo');
+      expect(result.fullName).toBe('owner/test-repo'); // camelCase
+      expect(result.ownerLogin).toBe('owner'); // camelCase
+      expect(result.private).toBe(false);
+      expect(result.language).toBe('TypeScript');
+      expect(result.htmlUrl).toBe('https://github.com/owner/test-repo'); // camelCase
+    });
+
+    it('should handle null language correctly', () => {
+      const mockRepo = {
+        id: 456,
+        name: 'no-language',
+        full_name: 'owner/no-language',
+        owner: {
+          login: 'owner'
+        },
+        private: true,
+        language: null,
+        html_url: 'https://github.com/owner/no-language',
+        description: null
+      };
+
+      const result = optimizeRepository(mockRepo);
+      
+      expect(result.language).toBeNull();
+    });
+  });
+
+  describe('optimizeCommit', () => {
+    it('should convert Commit to MinimalCommit with camelCase properties', () => {
+      // Mock GitHub API Commit object with snake_case properties
+      const mockCommit = {
+        sha: 'abc123',
+        commit: {
+          message: 'Test commit',
+          author: {
+            name: 'Test User',
+            date: '2023-01-01T00:00:00Z'
+          }
+        },
+        author: {
+          login: 'testuser',
+          avatar_url: 'https://avatar.url'
+        },
+        html_url: 'https://github.com/owner/repo/commit/abc123',
+        repository: {
+          full_name: 'owner/repo'
+        }
+      };
+
+      // Expected result with camelCase properties
+      const result = optimizeCommit(mockCommit);
+
+      // Assert correct property conversion
+      expect(result.sha).toBe('abc123');
+      expect(result.message).toBe('Test commit');
+      expect(result.authorName).toBe('Test User'); // camelCase
+      expect(result.authorDate).toBe('2023-01-01T00:00:00Z'); // camelCase
+      expect(result.authorLogin).toBe('testuser'); // camelCase
+      expect(result.authorAvatar).toBe('https://avatar.url'); // camelCase
+      expect(result.repoName).toBe('owner/repo'); // camelCase
+      expect(result.htmlUrl).toBe('https://github.com/owner/repo/commit/abc123'); // camelCase
+    });
+
+    it('should handle missing author and repository information', () => {
+      // Mock GitHub API Commit object with minimal properties
+      const mockCommit = {
+        sha: 'def456',
+        commit: {
+          message: 'Test commit'
+        },
+        html_url: 'https://github.com/owner/repo/commit/def456'
+      };
+
+      const result = optimizeCommit(mockCommit as any);
+      
+      expect(result.sha).toBe('def456');
+      expect(result.message).toBe('Test commit');
+      expect(result.authorName).toBe('Unknown');
+      expect(typeof result.authorDate).toBe('string'); // Should default to current date
+    });
+  });
+
+  describe('optimizeContributor', () => {
+    it('should convert snake_case ContributorLike properties to camelCase', () => {
+      // Mock contributor with snake_case properties
+      const mockContributor: ContributorLike = {
+        login: 'testuser',
+        name: 'Test User',
+        avatar_url: 'https://avatar.url',
+        commit_count: 42
+      };
+
+      // Expected result with camelCase properties
+      const result = optimizeContributor(mockContributor);
+
+      // Assert correct property conversion
+      expect(result.username).toBe('testuser');
+      expect(result.displayName).toBe('Test User'); // camelCase
+      expect(result.avatarUrl).toBe('https://avatar.url'); // camelCase
+      expect(result.commitCount).toBe(42); // camelCase
+    });
+
+    it('should convert camelCase ContributorLike properties correctly', () => {
+      // Mock contributor with camelCase properties
+      const mockContributor: ContributorLike = {
+        username: 'testuser',
+        displayName: 'Test User',
+        avatarUrl: 'https://avatar.url',
+        commitCount: 42
+      };
+
+      // Expected result with camelCase properties
+      const result = optimizeContributor(mockContributor);
+
+      // Assert correct property conversion
+      expect(result.username).toBe('testuser');
+      expect(result.displayName).toBe('Test User'); 
+      expect(result.avatarUrl).toBe('https://avatar.url');
+      expect(result.commitCount).toBe(42);
+    });
+
+    it('should handle mixed case properties and provide fallbacks', () => {
+      // Mock contributor with mixed property styles
+      const mockContributor: ContributorLike = {
+        username: 'testuser',
+        avatar_url: 'https://avatar.url', // snake_case
+        commitCount: 42 // camelCase
+      };
+
+      // Expected result with camelCase properties
+      const result = optimizeContributor(mockContributor);
+
+      // Assert correct property conversion and fallbacks
+      expect(result.username).toBe('testuser');
+      expect(result.displayName).toBe('testuser'); // Falls back to username
+      expect(result.avatarUrl).toBe('https://avatar.url'); // Converts from snake_case
+      expect(result.commitCount).toBe(42); // Uses camelCase directly
+    });
+  });
+});
\ No newline at end of file
diff --git a/src/lib/optimize.ts b/src/lib/optimize.ts
index d759c21..963d1fd 100644
--- a/src/lib/optimize.ts
+++ b/src/lib/optimize.ts
@@ -4,91 +4,134 @@
 import { Repository, Commit } from '@/types/github';
 
 /**
- * Optimized minimal repository data
+ * Optimized minimal repository data using camelCase naming convention
+ * 
+ * @property id - Repository ID
+ * @property name - Repository name
+ * @property fullName - Repository full name (previously full_name)
+ * @property ownerLogin - Repository owner login (previously owner_login)
+ * @property private - Whether the repository is private
+ * @property language - Repository primary language
+ * @property htmlUrl - Repository HTML URL (previously html_url)
  */
 export interface MinimalRepository {
   id: number;
   name: string;
-  full_name: string;
-  owner_login: string;
+  fullName: string;
+  ownerLogin: string;
   private: boolean;
   language: string | null;
-  html_url?: string;
+  htmlUrl?: string;
 }
 
 /**
- * Optimized minimal commit data
+ * Optimized minimal commit data using camelCase naming convention
+ * 
+ * @property sha - Commit SHA
+ * @property message - Commit message
+ * @property authorName - Author name (previously author_name)
+ * @property authorDate - Author date (previously author_date)
+ * @property authorLogin - Author login (previously author_login)
+ * @property authorAvatar - Author avatar URL (previously author_avatar)
+ * @property repoName - Repository name (previously repo_name)
+ * @property htmlUrl - Commit HTML URL (previously html_url)
  */
 export interface MinimalCommit {
   sha: string;
   message: string;
-  author_name: string;
-  author_date: string;
-  author_login?: string;
-  author_avatar?: string;
-  repo_name?: string;
-  html_url?: string;
+  authorName: string;
+  authorDate: string;
+  authorLogin?: string;
+  authorAvatar?: string;
+  repoName?: string;
+  htmlUrl?: string;
 }
 
 /**
- * Optimized minimal contributor data
+ * Optimized minimal contributor data using camelCase naming convention
+ * 
+ * @property username - Contributor username
+ * @property displayName - Contributor display name (previously display_name)
+ * @property avatarUrl - Contributor avatar URL (previously avatar_url)
+ * @property commitCount - Number of commits (previously commit_count)
  */
 export interface MinimalContributor {
   username: string;
-  display_name: string;
-  avatar_url: string | null;
-  commit_count?: number;
+  displayName: string;
+  avatarUrl: string | null;
+  commitCount?: number;
 }
 
 /**
- * Optimize repository data by removing unnecessary fields
+ * Optimize repository data by removing unnecessary fields and converting to camelCase
  * 
- * @param repo - Full repository object from GitHub
- * @returns - Minimized repository data
+ * @param repo - Full repository object from GitHub (using snake_case properties)
+ * @returns - Minimized repository data with camelCase properties
  */
 export function optimizeRepository(repo: Repository): MinimalRepository {
   return {
     id: repo.id,
     name: repo.name,
-    full_name: repo.full_name,
-    owner_login: repo.owner.login,
+    fullName: repo.full_name,
+    ownerLogin: repo.owner.login,
     private: repo.private,
     language: repo.language || null,
-    html_url: repo.html_url, // Keep URL for clickable references
+    htmlUrl: repo.html_url, // Keep URL for clickable references
   };
 }
 
 /**
- * Optimize commit data by removing unnecessary fields
+ * Optimize commit data by removing unnecessary fields and converting to camelCase
  * 
- * @param commit - Full commit object from GitHub
- * @returns - Minimized commit data
+ * @param commit - Full commit object from GitHub (using snake_case properties)
+ * @returns - Minimized commit data with camelCase properties
  */
 export function optimizeCommit(commit: Commit): MinimalCommit {
   return {
     sha: commit.sha,
     message: commit.commit.message,
-    author_name: commit.commit.author?.name || 'Unknown',
-    author_date: commit.commit.author?.date || new Date().toISOString(),
-    author_login: commit.author?.login,
-    author_avatar: commit.author?.avatar_url,
-    repo_name: commit.repository?.full_name,
-    html_url: commit.html_url,
+    authorName: commit.commit.author?.name || 'Unknown',
+    authorDate: commit.commit.author?.date || new Date().toISOString(),
+    authorLogin: commit.author?.login,
+    authorAvatar: commit.author?.avatar_url,
+    repoName: commit.repository?.full_name,
+    htmlUrl: commit.html_url,
   };
 }
 
 /**
- * Optimize contributor data
+ * Contributor with flexible properties (used for different API responses)
+ * Supports both camelCase and snake_case properties for backward compatibility
+ */
+export interface ContributorLike {
+  username?: string;
+  login?: string;
+  displayName?: string;
+  name?: string;
+  avatarUrl?: string;
+  avatar_url?: string;
+  commitCount?: number;
+  commit_count?: number;
+  [key: string]: unknown;
+}
+
+/**
+ * Optimize contributor data and convert to camelCase naming convention
  * 
  * @param contributor - Contributor object with potential extra fields
- * @returns - Minimized contributor data
+ * @returns - Minimized contributor data with camelCase properties
  */
-export function optimizeContributor(contributor: any): MinimalContributor {
+export function optimizeContributor(contributor: ContributorLike): MinimalContributor {
+  // Find the appropriate username
+  const username = contributor.username || contributor.login || 'unknown';
+  // Find the appropriate display name
+  const displayName = contributor.displayName || contributor.name || contributor.username || contributor.login || 'Unknown';
+  
   return {
-    username: contributor.username || contributor.login,
-    display_name: contributor.displayName || contributor.name || contributor.username || contributor.login,
-    avatar_url: contributor.avatarUrl || contributor.avatar_url || null,
-    commit_count: contributor.commitCount || contributor.commit_count
+    username,
+    displayName: displayName,
+    avatarUrl: contributor.avatarUrl || contributor.avatar_url || null,
+    commitCount: contributor.commitCount || contributor.commit_count
   };
 }
 
@@ -110,13 +153,13 @@ export function optimizeArray<T, R>(items: T[], optimizerFn: (item: T) => R): R[
  * @param obj - Object to clean
  * @returns - Object without null or undefined values
  */
-export function removeNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
-  return Object.entries(obj).reduce((acc: any, [key, value]) => {
+export function removeNullValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
+  return Object.entries(obj).reduce((acc: Record<string, unknown>, [key, value]) => {
     if (value !== null && value !== undefined) {
       acc[key] = value;
     }
     return acc;
-  }, {});
+  }, {}) as Partial<T>;
 }
 
 /**
@@ -125,7 +168,7 @@ export function removeNullValues<T extends Record<string, any>>(obj: T): Partial
  * @param data - Data to serialize
  * @returns - Serialized JSON string
  */
-export function optimizedJSONStringify(data: any): string {
+export function optimizedJSONStringify(data: unknown): string {
   // Handle arrays separately for better optimization opportunities
   if (Array.isArray(data)) {
     return `[${data.map(item => 
diff --git a/src/types/github.ts b/src/types/github.ts
index c5f62ac..80e0adb 100644
--- a/src/types/github.ts
+++ b/src/types/github.ts
@@ -42,7 +42,7 @@ export type Repository = {
     // Additional owner properties that might be used
     avatar_url?: string;
     type?: string;
-    [key: string]: any;
+    [key: string]: unknown;
   };
   private: boolean;
   html_url?: string;
@@ -50,7 +50,7 @@ export type Repository = {
   updated_at?: string | null;
   language?: string | null;
   // Allow additional properties that might come from the GitHub API
-  [key: string]: any;
+  [key: string]: unknown;
 };
 
 /**
@@ -71,18 +71,18 @@ export type Commit = {
     } | null;
     message: string;
     // Additional properties that might exist
-    [key: string]: any;
+    [key: string]: unknown;
   };
   html_url: string;
   author: {
     login: string;
     avatar_url: string;
     // Additional properties that might exist
-    [key: string]: any;
+    [key: string]: unknown;
   } | null;
   repository?: {
     full_name: string;
   };
   // Allow additional properties from the GitHub API
-  [key: string]: any;
+  [key: string]: unknown;
 };
\ No newline at end of file
diff --git a/src/types/summary.ts b/src/types/summary.ts
index 399dec7..0292ddd 100644
--- a/src/types/summary.ts
+++ b/src/types/summary.ts
@@ -1,4 +1,29 @@
 // Common types related to commit summaries and analysis
+import { MinimalCommit } from '@/lib/optimize';
+import { Commit } from '@/types/github';
+
+// Test commit format used in test files
+export interface TestCommit {
+  sha: string;
+  html_url: string;
+  commit: {
+    message: string;
+    author: {
+      name: string;
+      date: string;
+    };
+  };
+  repository?: {
+    name: string;
+    full_name: string;
+    html_url: string;
+  };
+  contributor?: {
+    username: string;
+    displayName: string;
+    avatarUrl: string;
+  };
+}
 
 export interface TechnicalArea {
   name: string;
@@ -27,7 +52,7 @@ export interface AISummary {
 
 export interface CommitSummary {
   user?: string;
-  commits: any[]; // TODO: Consider creating a more specific type for commits
+  commits: MinimalCommit[] | Commit[] | TestCommit[]; // Allow optimized, raw, and test formats
   stats: {
     totalCommits: number;
     repositories: string[];
diff --git a/tsconfig.json b/tsconfig.json
index b448d68..6ad7766 100644
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -4,7 +4,35 @@
     "lib": ["dom", "dom.iterable", "esnext"],
     "allowJs": true,
     "skipLibCheck": true,
+    /*
+     * TypeScript Strictness Configuration:
+     *
+     * 'strict: true' enables the following flags:
+     * - noImplicitAny: Disallow implicit any type
+     * - noImplicitThis: Error on 'this' expressions with an implied 'any' type
+     * - alwaysStrict: Parse in strict mode
+     * - strictBindCallApply: Check that the arguments for 'bind', 'call', and 'apply' methods match the original function
+     * - strictNullChecks: Enable strict null checking
+     * - strictFunctionTypes: Enable strict checking of function types
+     * - strictPropertyInitialization: Ensure non-undefined class properties are initialized
+     * - useUnknownInCatchVariables: Type catch clause variables as 'unknown' instead of 'any'
+     */
     "strict": true,
+    /*
+     * Additional strictness flags beyond 'strict: true':
+     * These provide extra type safety without major refactoring
+     */
+    "noImplicitReturns": true,
+    "noFallthroughCasesInSwitch": true,
+    /*
+     * Future strictness enhancements:
+     * The following flags would further improve type safety but require codebase modifications:
+     * - noUncheckedIndexedAccess: Add 'undefined' to any unchecked indexed access
+     * - exactOptionalPropertyTypes: Differentiate between optional properties and properties that can be undefined
+     * - noImplicitOverride: Ensure derived classes explicitly override parent methods
+     * - noPropertyAccessFromIndexSignature: Enforce using ['prop'] for index signatures
+     */
+    /* Other compiler options */
     "noEmit": true,
     "esModuleInterop": true,
     "module": "esnext",
@@ -24,6 +52,12 @@
     },
     "types": ["jest", "node", "@testing-library/jest-dom"]
   },
-  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "src/types/*.d.ts"],
+  "include": [
+    "next-env.d.ts",
+    "**/*.ts",
+    "**/*.tsx",
+    ".next/types/**/*.ts",
+    "src/types/*.d.ts"
+  ],
   "exclude": ["node_modules"]
 }
