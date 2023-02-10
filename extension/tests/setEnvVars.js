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
  service: {
    locale: 'nl_NL',
    webhookUrl: 'http://dummywebhook.com',
    redirectUrl: 'http://dummyredirect.com',
  },
});

process.env.CT_MOLLIE_CONFIG = testConfig;
