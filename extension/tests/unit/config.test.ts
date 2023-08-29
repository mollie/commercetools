import { loadConfig } from '../../config/config';

describe('Config test', () => {
  const mockLogError = jest.fn();
  const ctConfig = {
    projectKey: 'test',
    clientId: '123456789',
    clientSecret: 'abcdefghi',
    authUrl: 'https://auth.dummy.com',
    host: 'https://api.dummy.com',
    authentication: { isBasicAuth: false },
    enableRetry: true,
  };
  beforeEach(() => {
    console.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should return correct config object including default settings', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: ctConfig,
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: ctConfig,
      service: {
        port: 3001,
        logLevel: 'info',
        logTransports: 'terminal',
      },
    };
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toEqual(expectedConfig);
  });

  it('Should return config with correct service and authentication properties', async () => {
    const ctConfigAuth = { ...ctConfig, authentication: { isBasicAuth: false, username: 'testUser', password: 'testPassword' } };
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: ctConfigAuth,
      service: { port: 2000, locale: 'nl_NL' },
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: ctConfigAuth,
      service: {
        port: 2000,
        logLevel: 'info',
        logTransports: 'terminal',
        locale: 'nl_NL',
      },
    };
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toEqual(expectedConfig);
  });

  it('Should return exclude locale from config if it does not match expected pattern', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: ctConfig,
      service: { port: 2000, locale: 'nl' },
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: ctConfig,
      service: {
        port: 2000,
        logLevel: 'info',
        logTransports: 'terminal',
      },
    };
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toEqual(expectedConfig);
  });

  it('Should return config with enableRetry: false if passed in the config', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {
        projectKey: 'test',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        authUrl: 'https://auth.dummy.com',
        host: 'https://api.dummy.com',
        enableRetry: false,
      },
      service: { port: 2000, locale: 'nl' },
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {
        projectKey: 'test',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        authUrl: 'https://auth.dummy.com',
        host: 'https://api.dummy.com',
        enableRetry: false,
        authentication: { isBasicAuth: false },
      },
      service: {
        port: 2000,
        logLevel: 'info',
        logTransports: 'terminal',
      },
    };
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toEqual(expectedConfig);
  });

  it('Should return an error if there is no api key present', () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: {},
      commercetools: ctConfig,
      service: { port: 2000, locale: 'nl' },
    });

    expect(() => loadConfig(CT_MOLLIE_TEST_CONFIG)).toThrowError();
  });

  it('Should return an error if there is no commercetools config', () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      service: { port: 2000, locale: 'nl' },
    });

    expect(() => loadConfig(CT_MOLLIE_TEST_CONFIG)).toThrowError();
  });

  it('Should return an error if the commercetools config is empty', () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {},
      service: { port: 2000, locale: 'nl' },
    });

    expect(() => loadConfig(CT_MOLLIE_TEST_CONFIG)).toThrowError();
  });

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError('Commercetools - Mollie Integration configuration is missing or not provided in the valid JSON format');
  });
});
