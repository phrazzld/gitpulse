export const createAppAuth = jest.fn().mockReturnValue({
  auth: jest.fn().mockResolvedValue({
    token: 'mock-token',
    type: 'app'
  })
});