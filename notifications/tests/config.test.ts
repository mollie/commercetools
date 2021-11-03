import { loadConfig } from '../config/config';
import Logger from '../src/logger/logger';

jest.mock('../src/logger/logger');

describe('Config test', () => {
  const OLD_ENV = { ...process.env };
  const mockLogError = jest.fn();
  beforeEach(() => {
    process.env = OLD_ENV;
    Logger.error = mockLogError;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('Should return config object with correct keys from process.env.CT_MOLLIE_CONFIG, and default port when not provided', async () => {
    const config = loadConfig(process.env.CT_MOLLIE_CONFIG);

    const expectedConfig = {
      port: 3001,
      mollieApiKey: 'testMollieApiKey',
      ctConfig: {
        authUrl: 'https://auth.dummy.com',
        clientId: '123456789',
        clientSecret: 'abcdefghi',
        host: 'https://api.dummy.com',
        projectKey: 'test',
      },
    };
    expect(config).toEqual(expectedConfig);
  });

  it('Should throw error and console error a message when config does not have required fields', () => {
    const temporaryCTConfig = JSON.stringify({
      port: 2000,
    });
    process.env.CT_MOLLIE_CONFIG = temporaryCTConfig;

    expect(() => loadConfig(process.env.CT_MOLLIE_CONFIG)).toThrowError();
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError).toHaveBeenCalledWith('No Mollie API Key found\nNo Commercetools configuration present\nCommercetools configuration requires missing required key(s)\n');
  });

  it('Should return an error if no config is provided', async () => {
    expect(() => loadConfig(undefined)).toThrowError('Commercetools - Mollie Integration configuration is incomplete, missing or not provided in the valid JSON format');
  });
});
