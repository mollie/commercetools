import { Config } from './config-model';

export function loadConfig(ctMollieConfig: string | undefined) {
  try {
    const envConfig = JSON.parse(ctMollieConfig || '');

    const config: Config = {
      mollie: {
        apiKey: envConfig.mollie.apiKey,
      },
      service: {
        port: envConfig.service?.port || 3000,
        logLevel: process.env.LOG_LEVEL || envConfig.service?.logLevel || 'info',
        logTransports: envConfig.service?.logTransports || 'terminal',
      },
    };
    return config;
  } catch (e) {
    throw new Error('Commercetools - Mollie Integration configuration is missing or not provided in the valid JSON format');
  }
}

const ctMollieConfig = process.env.CT_MOLLIE_CONFIG;
const config = loadConfig(ctMollieConfig);

export default config;
