# GitHub Actions Workflow Security Improvements

For security best practices, the following changes should be made to the GitHub Actions workflow files:

## 1. Update `.github/workflows/e2e-tests.yml`

### Current Implementation (line 44):
```yaml
# Start the server in the background with output captured to log file
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_GITHUB_APP_NAME=pulse-summarizer NEXTAUTH_SECRET=playwright-test-secret-key npm run dev > e2e/server.log 2>&1 &
```

### Recommended Change:
```yaml
# Create a random secret for testing
RANDOM_SECRET=$(openssl rand -hex 32)

# Start the server in the background with output captured to log file
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_GITHUB_APP_NAME=pulse-summarizer NEXTAUTH_SECRET="$RANDOM_SECRET" npm run dev > e2e/server.log 2>&1 &
```

### Current Implementation (lines 82-86):
```yaml
# Add mock GitHub credentials for testing
GITHUB_OAUTH_CLIENT_ID: mock-client-id
GITHUB_OAUTH_CLIENT_SECRET: mock-client-secret

# Set NextAuth secret for secure cookie handling (mock for tests)
NEXTAUTH_SECRET: playwright-test-secret-key
```

### Recommended Change:
Use GitHub repository secrets and generate random values at runtime:

```yaml
# Add mock GitHub credentials for testing
GITHUB_OAUTH_CLIENT_ID: ${{ secrets.E2E_MOCK_CLIENT_ID || 'mock-client-id' }}
GITHUB_OAUTH_CLIENT_SECRET: ${{ secrets.E2E_MOCK_CLIENT_SECRET || env.RANDOM_SECRET }}

# Use the same random secret for NextAuth
NEXTAUTH_SECRET: ${{ env.RANDOM_SECRET }}
```

## 2. Add CODEOWNERS file

Create a new file at `.github/CODEOWNERS` with the following content:

```
# Workflow files require security review
/.github/workflows/* @your-security-team

# Security-sensitive configuration
/e2e/config/globalSetup.ts @your-security-team
/src/app/api/test-auth/ @your-security-team
```

Replace `@your-security-team` with the GitHub username or team responsible for security reviews in your organization.

## Security Impact

These changes will:

1. Eliminate hardcoded secrets in workflow files
2. Generate unique random secrets for each test run
3. Allow overriding mock credentials with repository secrets when needed
4. Ensure security-sensitive files receive proper review