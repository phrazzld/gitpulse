# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in GitPulse, please report it responsibly. Do not open a public issue. Instead, please email the maintainers directly.

## Security Best Practices

### Environment Variables

1. **NEVER commit real credentials to version control**
2. Use `.env.local` for local development (already in .gitignore)
3. Use `.env.local.example` as a template with placeholder values
4. For production, use platform-specific secret management (e.g., Vercel Environment Variables)

### API Keys and Secrets

- **GitHub OAuth**: Restrict OAuth app permissions to minimum required
- **Gemini API**: Use API key restrictions (HTTP referrers, IP restrictions)
- **NextAuth Secret**: Generate without special characters using:
  ```bash
  openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
  ```

### Security Measures in Place

1. **Pre-commit Hooks**: Automatic secret detection using secretlint
2. **CI/CD Security**: GitHub Actions with gitleaks for secret scanning
3. **Dependency Scanning**: Regular npm audit checks
4. **Git History**: Cleaned of any previously committed secrets

### Prohibited Files

The following patterns are blocked from commits via .gitignore:
- `VERCEL_ENV*.md`
- `*secrets*`
- `*credentials*`
- `*.key`
- `*.pem`
- `.env*` (except `.env*.example`)

### If You Accidentally Commit Secrets

1. **Immediately rotate all affected credentials**
2. **Remove the file from the repository**
3. **Use BFG Repo-Cleaner to purge from history**:
   ```bash
   bfg --delete-files FILE_WITH_SECRETS
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```
4. **Force push to update remote** (coordinate with team)
5. **Verify the secrets are rotated and no longer valid**

### Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_CheatSheet.html)