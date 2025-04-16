# GitPulse - GitHub Commit Summary

GitPulse is a web application that generates summaries of GitHub commits for individuals and teams. Built with Next.js and TypeScript, GitPulse provides easy visualization of coding activity across repositories.

## Features

- **Individual Summaries**: Track your own GitHub activity across all accessible repositories
- **Team Summaries**: Aggregate commit data for multiple team members
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
- **Styling**: TailwindCSS for responsive design
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
2. Select whether you want an individual or team summary
3. For team summaries, enter comma-separated GitHub usernames
4. Select a date range for your summary
5. Optionally select specific repositories
6. Click "Generate Summary" to view your commit statistics

## Authentication

GitPulse supports two authentication methods: OAuth and GitHub App. Each has its own advantages and use cases.

### Authentication Methods Overview

#### OAuth Authentication (Default)
Uses personal GitHub access tokens for authentication through the standard GitHub OAuth flow.

**Use Cases:**
- Individual developers accessing their personal repositories
- Quick setup for personal or small team projects
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
Uses GitHub App installations with installation tokens, providing more granular and organization-friendly permissions.

**Use Cases:**
- Organization administrators who need to provide repository access without personal tokens
- Enterprise environments with strict security requirements
- When you need fine-grained permissions at the organization level
- Teams concerned about token expiration or personal token security

**Advantages:**
- More secure (no personal tokens stored in the session)
- Repository access managed at the organization level
- Fine-grained permission control
- Can be installed across an entire organization
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
     - **Organization permissions**:
       - Members: Read-only
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
8. Install the app on your account or organization through GitHub's interface

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
    
    CreateOAuthOctokit --> FetchGitHubData[Fetch GitHub data\nwith Octokit]
    CreateAppOctokit --> FetchGitHubData
    
    FetchGitHubData --> ErrorCheck{Error\noccurred?}
    ErrorCheck -->|No| DisplayData[Display data\nto user]
    ErrorCheck -->|Auth error| SignOutRedirect
    ErrorCheck -->|Other error| DisplayError[Display error\nmessage]
    
    subgraph "App Installation Flow"
        AppInstallButton[GitHub App\nInstall Button] --> RedirectToGitHub[Redirect to GitHub\nfor installation]
        RedirectToGitHub --> GitHubInstall[User installs app\non GitHub]
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
- Handling of both OAuth and GitHub App authentication methods
- Error handling and token refresh process
- GitHub App installation flow

### Troubleshooting Authentication

GitPulse provides detailed error messages to help diagnose authentication issues. This section will help you understand and resolve common authentication problems.

#### Common Error Messages

| Error Code | Message | Meaning | Solution |
|------------|---------|---------|----------|
| `GITHUB_AUTH_ERROR` | "GitHub authentication failed" | General authentication failure | Sign out and sign back in |
| `GITHUB_TOKEN_ERROR` | "GitHub token is invalid or expired" | OAuth token has expired or been revoked | Sign out and sign back in to get a new token |
| `GITHUB_SCOPE_ERROR` | "GitHub token is missing required permissions" | Your OAuth token doesn't have the necessary permission scopes | Review and update OAuth app permissions |
| `GITHUB_APP_CONFIG_ERROR` | "GitHub App not properly configured" | Missing or invalid GitHub App configuration | Check environment variables |
| `GITHUB_RATE_LIMIT_ERROR` | "GitHub API rate limit exceeded" | You've hit GitHub's API rate limits | Wait for the rate limit to reset (time provided in error) |
| `GITHUB_NOT_FOUND_ERROR` | "GitHub resource not found" | Repository or resource doesn't exist or you lack access | Verify the resource exists and you have permission |

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
     - Verify your GitHub App is installed on your account/organization
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
       - Or that "All repositories" is selected for full access

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
