import { loadConfig } from '../config/config';

describe('Config test', () => {
  const OLD_ENV = { ...process.env };
  beforeEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('Should return config object with correct keys from process.env.CT_MOLLIE_CONFIG, and default port when not provided', async () => {
    const config = loadConfig(process.env.CT_MOLLIE_CONFIG);

    const expectedConfig = {
      port: 3001,
      mollieApiKey: 'testMollieApiKey',
    };
    expect(config).toEqual(expectedConfig);
  });

  it('Should return config object with given api key, port and any extra fields', async () => {
    const temporaryCTConfig = JSON.stringify({
      mollieApiKey: 'testMollieApiKey',
      testKey: 'testValue',
      port: 2000,
    });
    process.env.CT_MOLLIE_CONFIG = temporaryCTConfig;

    const config = loadConfig(process.env.CT_MOLLIE_CONFIG);

    const expectedConfig = {
      port: 2000,
      mollieApiKey: 'testMollieApiKey',
      testKey: 'testValue',
    };
    expect(config).toEqual(expectedConfig);
  });

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError(
      'configuration is missing'
    );
  });
});
