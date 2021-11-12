import { loadConfig } from '../config/config';

describe('Config test', () => {
  it('Should return config object with some defaults (port)', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
    });
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toHaveProperty('service');
    expect(config).toHaveProperty('mollie');
    expect(config.service.port).toBe(3000);
  });

  it('Should return provided env config, extended with missing default config', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      mollie: { apiKey: 'testMollieApiKey' },
      service: { port: 2000 },
    });
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toHaveProperty('mollie');
    expect(config).toHaveProperty('service');
    expect(config.service.port).toBe(2000);
  });

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError('configuration is missing');
  });
});
