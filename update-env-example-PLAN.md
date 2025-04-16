# T010: Update `.env.local.example` with GitHub App variable details - PLAN

## Task ID/Title
T010: Update `.env.local.example` with GitHub App variable details

## Approach
1. Review the existing `.env.local.example` file to understand its current structure
2. Add detailed comments for GitHub App-related variables:
   - `GITHUB_APP_ID`
   - `GITHUB_APP_PRIVATE_KEY_PKCS8`
   - `NEXT_PUBLIC_GITHUB_APP_NAME`
3. Clarify which variables are mandatory for OAuth authentication versus GitHub App authentication
4. Ensure the updated file maintains the existing format and style