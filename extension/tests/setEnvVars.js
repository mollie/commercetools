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
// TODO - migrate usage of 'mocked' so we can remove this override:
// `mocked` util function is now deprecated and has been moved to Jest repository, see https://github.com/facebook/jest/pull/12089.
// In `ts-jest` v28.0.0, `mocked` function will be completely removed. Users are encouraged to use to Jest v27.4.0 or above to have
//  `mocked` function available from `jest-mock`. One can disable this warning by setting
// environment variable process.env.DISABLE_MOCKED_WARNING=true
process.env.DISABLE_MOCKED_WARNING = true;
