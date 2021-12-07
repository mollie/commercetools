const testConfig = JSON.stringify({
  mollie: {
    apiKey: 'testMollieApiKey',
  },
  commercetools: {
    projectKey: 'test',
    clientId: '123456789',
    clientSecret: 'abcdefghi',
    authUrl: 'https://auth.dummy.com',
    host: 'https://api.dummy.com',
  },
});

process.env.CT_MOLLIE_CONFIG = testConfig;
