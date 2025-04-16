# T012: Add authentication flow diagram to README - PLAN

## Task ID/Title
T012: Add authentication flow diagram to README

## Approach
1. Review existing authentication-related code in the project to understand the flow
   - Check src/lib/auth/ directory for authentication implementation
   - Review src/app/api/auth/ for NextAuth.js configuration
   - Look at client-side authentication handling

2. Create a MermaidJS diagram that illustrates:
   - Initial login flow using GitHub OAuth
   - Session validation process
   - Credential selection (OAuth vs. GitHub App)
   - Token management and refresh processes
   - Octokit instance creation with appropriate credentials

3. Find the appropriate location in the README.md file (Authentication section)
   - Add the diagram after the authentication methods overview
   - Add a brief explanation of the diagram

4. Ensure the diagram is clear, accurate, and properly formatted for GitHub Markdown