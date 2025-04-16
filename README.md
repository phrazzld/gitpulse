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

### Troubleshooting Authentication

GitPulse supports two authentication methods:

#### OAuth Authentication (Default)
Uses personal GitHub access tokens for authentication.

If you encounter GitHub OAuth authentication errors:

1. Click the "Sign Out" button in the dashboard header
2. Sign back in with your GitHub account to refresh your access token
3. If problems persist, ensure your GitHub OAuth app still has the necessary permissions

#### GitHub App Authentication (Optional)
Uses GitHub App installations, which can provide more granular permissions.

To use GitHub App authentication:

1. Create a GitHub App in your GitHub account settings
2. Configure the App with the necessary permissions
3. Install the App to your account/organization
4. Configure the GitHub App environment variables in `.env.local`

If you encounter GitHub App authentication errors:

1. Verify your GitHub App installation is active
2. Check the App permissions match what's needed for repo access
3. Ensure your environment variables are correctly configured

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
