import { loadConfig } from '../config/config';

jest.mock('../src/logger/logger');

describe('Config test', () => {
  const OLD_ENV = { ...process.env };
  beforeEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('Should return config object with correct keys from process.env.CT_MOLLIE_CONFIG, and default port, logLevel and logTransports when not provided', async () => {
    const config = loadConfig(process.env.CT_MOLLIE_CONFIG);

    const expectedConfig = {
      mollie: {
        apiKey: 'testMollieApiKey',
      },
      commercetools: {
        authUrl: 'https://auth.dummy.com',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        host: 'https://api.dummy.com',
        projectKey: 'test',
      },
      service: {
        port: 3001,
        logLevel: 'info',
        logTransports: 'terminal',
      },
    };
    expect(config).toEqual(expectedConfig);
  });

  it('Should throw error with a message when config does not have required fields', () => {
    const temporaryCTConfig = JSON.stringify({
      service: { port: 2000 },
    });
    process.env.CT_MOLLIE_CONFIG = temporaryCTConfig;

    expect(() => loadConfig(process.env.CT_MOLLIE_CONFIG)).toThrowError();
  });

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError('Commercetools - Mollie Integration configuration is incomplete, missing or not provided in the valid JSON format');
  });
});
