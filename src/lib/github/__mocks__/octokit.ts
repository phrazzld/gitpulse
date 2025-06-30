export class Octokit {
  constructor(options?: any) {}
  
  rest = {
    apps: {
      listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue({
        data: []
      }),
      getInstallation: jest.fn().mockResolvedValue({
        data: {
          id: 123,
          account: {
            login: 'test-org',
            type: 'Organization'
          }
        }
      })
    },
    repos: {
      listForAuthenticatedUser: jest.fn().mockResolvedValue({
        data: []
      })
    }
  };
}