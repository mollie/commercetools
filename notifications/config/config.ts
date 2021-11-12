import _ from 'lodash';
import { Config } from './config-model';

const isConfigValid = (config: Config): { valid: boolean; message: string } => {
  const { mollie, commercetools } = config;
  let message = '';

  if (!mollie?.apiKey) {
    message = message + 'No Mollie API Key found\n';
  }
  if (!config.commercetools) {
    message = message + 'No Commercetools configuration present\n';
  }
  if (!commercetools?.host || !commercetools?.clientId || !commercetools?.clientSecret || !commercetools?.authUrl || !commercetools?.projectKey) {
    message = message + 'Commercetools configuration requires missing required key(s)\n';
  }
  return {
    valid: !message.length,
    message,
  };
};

export function loadConfig(ctMollieConfig: string | undefined) {
  try {
    // Parse env config, don't allow running without config
    const envConfig = JSON.parse(ctMollieConfig || '');

    // Allow missing parts of config and fill in with defaults
    const config: Config = {
      service: {
        port: envConfig.service?.port || 3001,
        logLevel: process.env.LOG_LEVEL || envConfig.service?.logLevel || 'info',
        logTransports: envConfig.service?.logTransports || 'terminal',
      },
      ...envConfig,
    };

    const { valid, message } = isConfigValid(config);
    if (valid) {
      return config;
    } else {
      throw new Error(message);
    }
  } catch (e) {
    throw new Error('Commercetools - Mollie Integration configuration is incomplete, missing or not provided in the valid JSON format');
  }
}

const ctMollieConfig = process.env.CT_MOLLIE_CONFIG;
const config = loadConfig(ctMollieConfig);

export default config;
