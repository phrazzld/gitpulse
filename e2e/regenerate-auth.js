const fs = require('fs');
const path = require('path');

// Create fresh auth state with a cookie that expires in 24 hours
const mockSessionData = {
  user: {
    id: 'playwright-test-user',
    name: 'Playwright Test User',
    email: 'playwright@example.com',
    image: 'https://github.com/ghost.png',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  accessToken: 'mock-github-token',
  installationId: 12345678
};

// Create cookie value by base64 encoding the session data
const cookieValue = Buffer.from(JSON.stringify(mockSessionData)).toString('base64');

// Create the storage state with fresh cookie
const storageState = {
  cookies: [
    {
      name: 'next-auth.session-token',
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now in seconds
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }
  ],
  origins: []
};

// Write the storage state to file
const storageStatePath = path.join(__dirname, 'storageState.json');
fs.writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2));

console.log('✅ Regenerated auth state with fresh cookie');
console.log(`Cookie expires: ${mockSessionData.expires}`);
console.log(`File written to: ${storageStatePath}`);