import { loadConfig } from '../../config/config';

describe('Config test', () => {
  it('Should return correct config object including default settings', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
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
      service: { port: 2000 },
    });
    const expectedConfig = {
      mollie: { apiKey: 'testMollieApiKey' },
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
