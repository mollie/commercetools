import { loadConfig } from '../../config/config';

describe('Config test', () => {
  it('Should return correct config object including default settings', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {
        projectKey: 'test',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        authUrl: 'https://auth.dummy.com',
        host: 'https://api.dummy.com',
      }
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {
        projectKey: 'test',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        authUrl: 'https://auth.dummy.com',
        host: 'https://api.dummy.com',
      },
      service: {
        port: 3000,
        logLevel: 'info',
        logTransports: 'terminal',
      },
    };
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toEqual(expectedConfig);
  });

  it('Should return config with correct service properties', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {
        projectKey: 'test',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        authUrl: 'https://auth.dummy.com',
        host: 'https://api.dummy.com',
      },
      service: { port: 2000 },
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
      commercetools: {
        projectKey: 'test',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        authUrl: 'https://auth.dummy.com',
        host: 'https://api.dummy.com',
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

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError('configuration is missing');
  });
});
