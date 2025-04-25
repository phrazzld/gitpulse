# GitPulse - GitHub Commit Summary

GitPulse is a web application that generates summaries of GitHub commits for individuals and teams. Built with Next.js and TypeScript, GitPulse provides easy visualization of coding activity across repositories.

## Features

- **Individual Summaries**: Track your own GitHub activity across all accessible repositories
- **Team Summaries**: Aggregate commit data for multiple team members
- **Repository Selection**: Choose specific repositories or include all accessible repos
- **Configurable Time Frames**: Set custom date ranges for your summary
- **AI-Powered Analysis**: Gemini AI generates insights from your commit history
- **No Local Storage**: All data is fetched on-demand from GitHub, ensuring data privacy
- **Comprehensive Logging**: Detailed structured logging for debugging and monitoring
- **Robust Error Handling**: Comprehensive error handling chain from API to UI with graceful degradation
- **Responsive UI**: Clean, modern interface that works on both mobile and desktop

## Tech Stack

- **Framework**: Next.js (v15+) with TypeScript
- **Authentication**: next-auth with GitHub OAuth
- **GitHub API Client**: octokit for interacting with the GitHub API
- **AI Analysis**: Google's Gemini AI for commit analysis
- **Data Fetching**: Custom progressive loading pattern for efficient data retrieval
- **State Management**: React hooks with context for local state management
- **Styling**: TailwindCSS for responsive design
- **Error Handling**: Structured error handling chain with fallbacks
- **Logging**: Structured JSON logging with correlation IDs
- **Deployment**: Vercel (recommended)

## Architecture

GitPulse follows a modular architecture with clear separation of concerns:

### Core Architecture Principles

- **TypeScript First**: Strong typing throughout the codebase
- **Component-Based UI**: Modular React components with clear responsibilities
- **Custom Hooks for Logic**: Business logic extracted into custom hooks
- **API Routes for Data**: Next.js API routes as a backend layer
- **Comprehensive Testing**: Unit and integration tests for critical paths
- **Defensive Programming**: Robust error handling with graceful degradation

### Directory Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # API endpoints (GitHub data, auth, etc.)
│   └── dashboard/        # Main application pages
├── components/           # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── layout/           # Layout components (header, etc.)
│   ├── library/          # Generic, reusable components
│   └── ui/               # Basic UI primitives
├── hooks/                # Custom React hooks
│   └── dashboard/        # Dashboard-specific hooks
├── lib/                  # Core utilities and services
│   ├── auth/             # Authentication utilities
│   ├── github/           # GitHub API integration
│   └── ...               # Other utilities (logging, caching, etc.)
├── state/                # State management (when needed)
├── styles/               # Global styles and themes
└── types/                # TypeScript type definitions
```

### Error Handling Strategy

GitPulse implements a comprehensive error handling strategy:

1. **API Level**: Structured error responses with appropriate status codes
2. **Data Fetching**: Safe error handling in data fetcher functions
3. **Data Processing**: Defensive coding with fallbacks for missing data
4. **UI Components**: Graceful degradation with helpful error states
5. **Logging**: Structured error logging with context for debugging

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
# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret

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

If you encounter GitHub authentication errors:

1. Click the "Sign Out" button in the dashboard header
2. Sign back in with your GitHub account to refresh your access token
3. If problems persist, ensure your GitHub OAuth app still has the necessary permissions

## Deployment

The easiest way to deploy GitPulse is using Vercel:

1. Push your code to a GitHub repository
2. Import your repository on [Vercel](https://vercel.com/new)
3. Set the environment variables in the Vercel project settings
4. Deploy the application

## Development Guidelines

### Code Organization

When adding new features or making changes, follow these guidelines:

1. **Types First**: Always define types in dedicated type modules first
2. **Hooks for Logic**: Extract business logic into custom hooks
3. **Component Separation**: Keep components focused and single-responsibility
4. **Defensive Programming**: Always handle error cases and edge conditions
5. **Tests Required**: Write tests for all new functionality

### Coding Standards

- Use TypeScript with strict mode enabled
- Follow ESLint and TypeScript guidelines (run `npm run lint` and `npm run typecheck`)
- Keep files under 500 lines (warning threshold)
- Use immutable patterns where possible (readonly modifiers, const, etc.)
- Document the "why" not just the "how" in comments

### Testing

GitPulse uses Jest for testing, configured for Next.js compatibility with the following setup:

#### Running Tests

- Run all tests: `npm test`
- Run tests in watch mode (for development): `npm run test:watch`
- Generate coverage report: `npm run test:coverage`

#### Type Safety in Tests

All test files are fully type-checked with TypeScript:

- Test files are included in the TypeScript configuration (`tsconfig.json`)
- Type checking is enforced via the `npm run typecheck` command
- Tests must pass type checking to be accepted in the CI pipeline
- Type checking ensures consistent interfaces and prevents type-related bugs
- Test files follow the same strict typing requirements as application code

Running `npm run typecheck` will validate types across both application and test code.

#### Test Organization

Tests are organized following the project structure:

```
src/
├── __tests__/            # Top-level tests
├── components/
│   └── __tests__/        # Component tests
├── hooks/
│   └── __tests__/        # Hook tests
└── lib/
    └── __tests__/        # Utility and service tests
```

#### Coverage Requirements

The project enforces a minimum coverage threshold of 85% globally and 95% for core logic files:

- Statements
- Branches
- Functions
- Lines

Coverage reports are generated in the following formats:

- Console summary
- Detailed HTML report (in `coverage/lcov-report/index.html`)
- JSON and LCOV formats for tooling integration

#### Writing Tests

When writing tests:

- Focus on testing behavior, not implementation details
- Mock only true external dependencies (APIs, etc.)
- Use descriptive test and assertion names
- Include proper TypeScript type annotations

### Error Handling Principles

When implementing error handling, follow this pattern:

1. Use try/catch blocks around API calls and data transformations
2. Log errors with context using the structured logger
3. Transform errors into user-friendly messages
4. Ensure UI components can handle and display error states gracefully
5. Provide recovery paths when possible

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the development guidelines
4. Run tests and linting (`npm run lint && npm run typecheck`)
5. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/) format
6. Push to your branch
7. Submit a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
