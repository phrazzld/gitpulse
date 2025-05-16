// Manual mock for octokit to avoid ESM issues during testing

export const Octokit = jest.fn(() => ({
  rest: {
    rateLimit: {
      get: jest.fn().mockResolvedValue({
        data: { 
          resources: { 
            core: { 
              limit: 5000, 
              remaining: 4000, 
              reset: Math.floor(Date.now() / 1000) + 3600 
            } 
          } 
        },
        headers: {}
      })
    },
    users: {
      getAuthenticated: jest.fn().mockResolvedValue({
        data: { login: 'testuser', id: 123, type: 'User' },
        headers: { 'x-oauth-scopes': 'repo, read:org' }
      })
    },
    repos: {
      listForAuthenticatedUser: jest.fn()
    },
    orgs: {
      listForAuthenticatedUser: jest.fn()
    },
    apps: {
      listReposAccessibleToInstallation: jest.fn()
    }
  },
  paginate: jest.fn().mockResolvedValue([])
}));