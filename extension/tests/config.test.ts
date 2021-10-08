import { loadConfig } from '../config/config';

describe('Config test', () => {
  it('Should return config object with some defaults', async () => {
    const CT_MOLLIE_TEST_CONFIG = '{}';
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toBeInstanceOf(Object);
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('mollieApiKey');
    expect(config.port).toBe(3000);
  });

  it('Should return provided env config, extended with missing default config', async () => {
    const CT_MOLLIE_TEST_CONFIG = JSON.stringify({
      port: 2000,
      testKey: 'testValue',
    });
    const config = loadConfig(CT_MOLLIE_TEST_CONFIG);
    expect(config).toBeInstanceOf(Object);
    expect(config).toHaveProperty('mollieApiKey');
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('testKey');
    expect(config.port).toBe(2000);
  });

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError('configuration is missing');
  });
});
