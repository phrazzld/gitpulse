# GitPulse - GitHub Commit Summary

GitPulse is a web application that generates summaries of GitHub commits for individuals. Built with Next.js and TypeScript, GitPulse provides easy visualization of your coding activity across repositories.

## Features

- **Individual Summaries**: Track your own GitHub activity across all accessible repositories
- **Repository Selection**: Choose specific repositories or include all accessible repos
- **Configurable Time Frames**: Set custom date ranges for your summary
- **AI-Powered Analysis**: Gemini AI generates insights from your commit history
- **No Local Storage**: All data is fetched on-demand from GitHub, ensuring data privacy
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Graceful Error Handling**: Clear user feedback for authentication issues with easy recovery options

## Tech Stack

- **Framework**: Next.js (v15+) with TypeScript
- **Authentication**: next-auth with GitHub OAuth and GitHub App support
- **GitHub API Client**: octokit with modular authentication and data fetching architecture
- **AI Analysis**: Google's Gemini AI for commit analysis
- **Styling**: TailwindCSS with CSS Variables design token system
- **Logging**: Structured JSON logging system with rotation
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- A GitHub account
- GitHub OAuth application credentials

### Setup GitHub OAuth

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Register a new application with the following settings:
   - Application name: GitPulse (or your preferred name)
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. After registration, note your Client ID and generate a Client Secret

### Installation

1. Clone the repository:

```bash
git clone https://github.com/phrazzld/gitpulse.git
cd gitpulse
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the project root (use `.env.local.example` as a template):

```
# GitHub OAuth (required for personal auth)
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret

# GitHub App (optional - only needed for GitHub App authentication)
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY_PKCS8=your_github_app_private_key
NEXT_PUBLIC_GITHUB_APP_NAME=your_github_app_name

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server:

```bash
# Standard development server
npm run dev

# Development with debug logging to file
npm run dev:log
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Sign in with your GitHub account
2. Select a date range for your summary
3. Optionally select specific repositories
4. Click "Generate Summary" to view your commit statistics

## Authentication

GitPulse supports two authentication methods: OAuth and GitHub App. Each has its own advantages and use cases.

### Authentication Methods Overview

#### OAuth Authentication (Default)

Uses personal GitHub access tokens for authentication through the standard GitHub OAuth flow.

**Use Cases:**

- Individual developers accessing their personal repositories
- Quick setup for personal projects
- When you need access to repositories you personally own or collaborate on

**Advantages:**

- Simpler setup (only requires OAuth App registration)
- Works immediately with user's existing GitHub permissions
- No additional installation steps for users

**Configuration Requirements:**

- `GITHUB_OAUTH_CLIENT_ID`: Your OAuth app's client ID
- `GITHUB_OAUTH_CLIENT_SECRET`: Your OAuth app's client secret
- `NEXTAUTH_SECRET`: A random string for NextAuth.js session encryption
- `NEXTAUTH_URL`: Your application's base URL (e.g., `http://localhost:3000` for local development)

#### GitHub App Authentication (Advanced)

Uses GitHub App installations with installation tokens, providing more granular permissions for your personal repositories.

**Use Cases:**

- Individuals who need fine-grained repository access without personal tokens
- When you need fine-grained permissions for your personal repositories
- Users concerned about token expiration or personal token security

**Advantages:**

- More secure (no personal tokens stored in the session)
- Repository access managed at the user level
- Fine-grained permission control
- Tokens automatically refresh without user intervention

**Configuration Requirements:**

- `GITHUB_APP_ID`: The numeric ID of your GitHub App
- `GITHUB_APP_PRIVATE_KEY_PKCS8`: The private key for your GitHub App (in PKCS8 format)
- `NEXT_PUBLIC_GITHUB_APP_NAME`: The name of your GitHub App (displayed to users)
- Plus all OAuth configuration (required for initial authentication)

### Setting Up OAuth Authentication

1. Go to your [GitHub Developer Settings](https://github.com/settings/developers)
2. Navigate to "OAuth Apps" and click "New OAuth App"
3. Register with the following settings:
   - **Application name**: GitPulse (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (or your deployed URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. After registration, note your Client ID and generate a Client Secret
5. Add these to your `.env.local` file:
   ```
   GITHUB_OAUTH_CLIENT_ID=your_client_id_here
   GITHUB_OAUTH_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_SECRET=random_secret_string_here
   NEXTAUTH_URL=http://localhost:3000
   ```

### Setting Up GitHub App Authentication (Optional)

1. Go to your [GitHub Developer Settings](https://github.com/settings/developers)
2. Navigate to "GitHub Apps" and click "New GitHub App"
3. Register with the following settings:

   - **GitHub App name**: GitPulse (or your preferred name)
   - **Homepage URL**: Your application URL
   - **Callback URL**: Same as your OAuth callback
   - **Webhook**: Disable (not required for GitPulse)
   - **Permissions**:
     - **Repository permissions**:
       - Contents: Read-only
       - Metadata: Read-only
       - Pull requests: Read-only (if needed)
   - **Where can this GitHub App be installed?**: Any account

4. After creating the app, note the App ID (found in the app settings)
5. Generate a private key (will download as a .pem file)
6. If your key is in PKCS1 format, convert it to PKCS8:
   ```bash
   openssl pkcs8 -topk8 -nocrypt -in your-key.pem -out pkcs8-key.pem
   ```
7. Add the entire contents of the PKCS8 key (including BEGIN/END lines) to your `.env.local`:
   ```
   GITHUB_APP_ID=your_app_id_here
   GITHUB_APP_PRIVATE_KEY_PKCS8=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
   NEXT_PUBLIC_GITHUB_APP_NAME=GitPulse
   ```
8. Install the app on your personal account through GitHub's interface

### Authentication Flow

1. **Initial Login**: The user signs in using GitHub OAuth authentication
2. **Credential Selection**:
   - If only OAuth is configured, the app uses the OAuth token
   - If GitHub App is configured and installed, the user can choose between OAuth or GitHub App
3. **Token Management**:
   - OAuth tokens are refreshed by signing out and back in when they expire
   - GitHub App tokens are automatically generated and refreshed by the application

#### Authentication Flow Diagram

The following diagram illustrates the authentication process in GitPulse:

```mermaid
flowchart TD
    Start([User accesses app]) --> HasSession{Has valid\nsession?}

    HasSession -->|No| GithubOAuth[GitHub OAuth Login]
    HasSession -->|Yes| ValidateToken{Validate\nGitHub token}

    GithubOAuth --> NextAuthCallback[NextAuth Callback]
    NextAuthCallback --> CheckInstallation[Check for GitHub\nApp installations]
    CheckInstallation --> StoreSession[Store token &\ninstallation ID\nin session]
    StoreSession --> ValidateToken

    ValidateToken -->|Valid| ChooseAuthType{Choose auth\nmethod}
    ValidateToken -->|Invalid| SignOutRedirect[Sign out & redirect\nto login]

    ChooseAuthType -->|OAuth| CreateOAuthOctokit[Create Octokit with\nOAuth token]
    ChooseAuthType -->|GitHub App| CreateAppOctokit[Create Octokit with\nApp installation]

    CreateOAuthOctokit --> FetchUserData[Fetch individual\nuser activity data]
    CreateAppOctokit --> FetchUserData

    FetchUserData --> ErrorCheck{Error\noccurred?}
    ErrorCheck -->|No| DisplayData[Display data\nto user]
    ErrorCheck -->|Auth error| SignOutRedirect
    ErrorCheck -->|Other error| DisplayError[Display error\nmessage]

    subgraph "App Installation Flow"
        AppInstallButton[GitHub App\nInstall Button] --> RedirectToGitHub[Redirect to GitHub\nfor installation]
        RedirectToGitHub --> GitHubInstall[User installs app\non personal account]
        GitHubInstall --> RedirectCallback[Redirect back\nto app]
        RedirectCallback --> RegisterInstallation[Register installation\nwith user]
    end

    style Start fill:#d0f0c0
    style DisplayData fill:#c0d0f0
    style SignOutRedirect fill:#f0c0c0
    style DisplayError fill:#f0d0c0
```

The diagram shows:

- Initial authentication using GitHub OAuth
- Session validation and token management
- Handling of both OAuth and GitHub App authentication methods for individual user access
- Error handling and token refresh process
- GitHub App installation flow for personal accounts

### Troubleshooting Authentication

GitPulse provides detailed error messages to help diagnose authentication issues. This section will help you understand and resolve common authentication problems.

#### Common Error Messages

| Error Code                | Message                                        | Meaning                                                       | Solution                                                  |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| `GITHUB_AUTH_ERROR`       | "GitHub authentication failed"                 | General authentication failure                                | Sign out and sign back in                                 |
| `GITHUB_TOKEN_ERROR`      | "GitHub token is invalid or expired"           | OAuth token has expired or been revoked                       | Sign out and sign back in to get a new token              |
| `GITHUB_SCOPE_ERROR`      | "GitHub token is missing required permissions" | Your OAuth token doesn't have the necessary permission scopes | Review and update OAuth app permissions                   |
| `GITHUB_APP_CONFIG_ERROR` | "GitHub App not properly configured"           | Missing or invalid GitHub App configuration                   | Check environment variables                               |
| `GITHUB_RATE_LIMIT_ERROR` | "GitHub API rate limit exceeded"               | You've hit GitHub's API rate limits                           | Wait for the rate limit to reset (time provided in error) |
| `GITHUB_NOT_FOUND_ERROR`  | "GitHub resource not found"                    | Repository or resource doesn't exist or you lack access       | Verify the resource exists and you have permission        |

#### OAuth Authentication Issues

If you encounter GitHub OAuth authentication errors:

1. **Token Expiration**:

   - Symptom: "GitHub token is invalid or expired" error
   - Solution: Click the "Sign Out" button in the dashboard header and sign back in to refresh your token

2. **Missing Permission Scopes**:

   - Symptom: "GitHub token is missing required permissions" error
   - Solution:
     - Go to your [GitHub OAuth App settings](https://github.com/settings/applications)
     - Find the GitPulse application and click "Revoke access"
     - Sign back into GitPulse to reauthorize with the correct scopes

3. **Incorrect OAuth Application Configuration**:

   - Symptom: Redirect errors during login or "callback URL mismatch" errors
   - Solution:
     - Verify that the OAuth application's callback URL in GitHub matches your deployment URL
     - The callback URL should be `https://your-deployment-url/api/auth/callback/github`
     - Update the callback URL in your GitHub OAuth App settings if needed

4. **OAuth Credential Issues**:
   - Symptom: Authentication fails immediately with server errors
   - Solution:
     - Check that `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` are correctly set in your `.env.local` file
     - Verify these values match what's shown in your GitHub OAuth App settings
     - Ensure you didn't accidentally revoke the OAuth App's client secret

#### GitHub App Authentication Issues

If you encounter GitHub App authentication issues:

1. **Installation Problems**:

   - Symptom: "No installations found" or cannot select GitHub App authentication
   - Solution:
     - Verify your GitHub App is installed on your personal account
     - Check the installation at: `https://github.com/settings/installations`
     - Install or reinstall the app if needed

2. **Permission Configuration**:

   - Symptom: "Resource not accessible by integration" or similar errors
   - Solution:
     - Go to [GitHub App settings](https://github.com/settings/apps)
     - Select your app and check "Repository permissions"
     - Ensure "Contents", "Metadata", and potentially "Pull requests" have at least Read-only access
     - If you update permissions, you'll need to accept the new permissions in your installation

3. **Environment Variable Issues**:

   - Symptom: "GitHub App not properly configured" errors
   - Solution:
     - Verify the following variables are correctly set in `.env.local`:
       - `GITHUB_APP_ID`: Must be the numeric ID from your GitHub App settings
       - `GITHUB_APP_PRIVATE_KEY_PKCS8`: Complete private key in PKCS8 format (including BEGIN/END lines)
       - `NEXT_PUBLIC_GITHUB_APP_NAME`: Name of your GitHub App as shown in GitHub
     - Check for typos and formatting issues, especially in the private key

4. **Private Key Format Problems**:

   - Symptom: "Invalid private key" or signing errors
   - Solution:
     - Ensure your key is in PKCS8 format (convert if needed using OpenSSL)
     - The key must include both the BEGIN and END lines
     - Line breaks should be preserved (use \n in environment variables)
     - If stored in .env file, ensure it's properly quoted

5. **Installation Access Issues**:
   - Symptom: Can authenticate but cannot access certain repositories
   - Solution:
     - Go to your [GitHub App installation settings](https://github.com/settings/installations)
     - Click "Configure" next to your app
     - Under "Repository access", ensure the repositories you need are either:
       - Included in "Select repositories" if you chose specific access
       - Or that "All repositories" is selected for full access to all your personal repositories

#### Checking Error Responses

For developers, GitPulse returns standardized error responses that can help diagnose issues:

```json
{
  "error": "GitHub authentication token is invalid or expired",
  "code": "GITHUB_TOKEN_ERROR",
  "details": "The detailed error message",
  "signOutRequired": true
}
```

If you see `signOutRequired: true` in the error response, the user should be prompted to sign out and sign back in to refresh their token.

## Deployment

The easiest way to deploy GitPulse is using Vercel:

1. Push your code to a GitHub repository
2. Import your repository on [Vercel](https://vercel.com/new)
3. Set the environment variables in the Vercel project settings
4. Deploy the application

## Code Quality

GitPulse maintains high code quality standards through automated checks at different stages of the development workflow.

### Pre-commit Hooks

We use [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to run automated checks before each commit:

```bash
# Automatically installed when you run npm install
npm install
```

Our pre-commit hooks perform the following checks on staged files:

- **TypeScript files (.ts, .tsx):**

  - ESLint with automatic fixing of minor issues
  - TypeScript type checking
  - File size check (warns if files exceed 300 lines)

- **JavaScript files (.js, .jsx):**

  - Prettier formatting
  - File size check (warns if files exceed 300 lines)

- **Other files (.json, .md, .css):**
  - Prettier formatting

The file size checker helps maintain code modularity by encouraging smaller, focused files. It provides warnings but doesn't block commits, allowing developers to make informed decisions about when refactoring is necessary.

### TypeScript Configuration

GitPulse uses TypeScript with strict type checking enabled:

- **Strict Mode:** Enables comprehensive type checking including `noImplicitAny`, `strictNullChecks`, and other strict flags
- **Additional Strictness:** Also enables `noImplicitReturns` and `noFallthroughCasesInSwitch` for extra type safety

### ESLint Rules

Our ESLint configuration enforces best practices aligned with our development philosophy:

- **Type Safety:** Warns against using `any` types and type suppression directives
- **Immutability:** Enforces `const` over `let` when variables aren't reassigned
- **Code Complexity:** Limits function size (100 lines), file size (500 lines), cyclomatic complexity (10), and nesting depth (3)
- **Naming Conventions:** Enforces consistent camelCase naming
- **Function Purity:** Warns against parameter reassignment

### Continuous Integration

GitPulse uses GitHub Actions for continuous integration checks on every push and pull request:

```mermaid
flowchart TD
    Push[Push to master/PR] --> CI[GitHub Actions CI]
    CI --> Quality[Code Quality Checks]
    Quality --> Lint[ESLint]
    Quality --> TypeCheck[TypeScript Check]
    Quality --> Test[Jest Tests]
    Quality --> SkipCheck[Skipped Tests Check]
    Quality --> Build[Next.js Build]
    Lint & TypeCheck & Test & SkipCheck --> Success{All Checks Pass?}
    Success -->|Yes| MergePR[Ready to Merge]
    Success -->|No| FixIssues[Fix Issues]
```

The CI workflow includes these jobs:

1. **Code Quality:** Runs linting, type checking, tests, and checks for unjustified skipped tests
2. **Build:** Verifies the application builds correctly

#### Skipped Tests Policy

GitPulse enforces a policy that all skipped tests must have explicit justification:

- **Detects:** Tests marked with `it.skip`, `test.skip`, `describe.skip`, `xit`, `xdescribe`, and commented-out tests
- **Requires:** A `// SKIP-REASON: explanation` comment on the same line as any skipped test
- **Purpose:** Prevents accidental test skipping and ensures all skipped tests have proper documentation

Example of properly justified skipped test:

```typescript
it.skip('validates enterprise feature X', () => { ... }); // SKIP-REASON: Enterprise features postponed until Q3
```

### Running Quality Checks Locally

You can run the same quality checks locally using these npm scripts:

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run tests
npm run test

# Check for skipped tests without justification
npm run test:no-skips

# Run all checks (lint, typecheck, test, skipped test check) in sequence
npm run ci
```

## Styling System

GitPulse uses a modern styling approach that combines TailwindCSS with CSS Variables for a flexible and maintainable design system.

### Design Token System

The styling is built on a design token system implemented with CSS Variables (Custom Properties). This approach provides several benefits:

- **Centralized Design Control**: All design values are defined in one place
- **Theme Consistency**: Ensures consistent usage of colors, spacing, and typography
- **Easy Maintenance**: Modify styles across the application by changing token values
- **Developer Experience**: IntelliSense support and straightforward syntax

### Key Components

1. **Token Definition**: All design tokens are defined in `/src/styles/tokens.css`

   - Base color tokens using HSL format
   - Semantic color tokens for UI elements
   - Spacing, typography, and effect variables

2. **Tailwind Integration**: CSS variables are referenced in `tailwind.config.js`

   - Custom colors mapped to semantic tokens
   - Custom spacing, typography, and border radius settings
   - Extensible theme configuration

3. **Usage in Components**: Use Tailwind utility classes that reference our token system

### Using the Design System

#### Colors

Colors are defined in HSL format and organized in two levels:

1. **Base Colors**: Raw color values (`--dark-slate`, `--neon-green`, etc.)
2. **Semantic Colors**: Functional meaning (`--primary`, `--background`, `--error`, etc.)

```jsx
// Using colors in components via Tailwind classes
<button className="bg-primary text-background hover:bg-secondary">
  Click Me
</button>
```

#### Spacing

Consistent spacing values (`--spacing-xs` through `--spacing-3xl`):

```jsx
// Using spacing in components
<div className="p-md mb-lg">Content with standardized padding and margin</div>
```

#### Typography

Typography tokens for font family, size, weight, and line height:

```jsx
// Using typography tokens
<h2 className="text-2xl font-bold text-primary">
  Heading with standardized styles
</h2>
```

### Modifying the Design System

To update the design system:

1. **Add or modify tokens in `/src/styles/tokens.css`**
2. **Extend the Tailwind configuration in `tailwind.config.js` if needed**
3. **Use the tokens via Tailwind utility classes in your components**

For major theme changes, focus on updating the semantic tokens rather than changing individual component styles.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
