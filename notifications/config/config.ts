import _ from 'lodash';
import { Config } from './config-model';
import Logger from '../src/logger/logger';

const isConfigValid = (config: Config): { valid: boolean; message: string } => {
  const { mollieApiKey, ctConfig } = config;
  let message = '';

  if (!mollieApiKey) {
    message = message + 'No Mollie API Key found\n';
  }
  if (!config.ctConfig) {
    message = message + 'No Commercetools configuration present\n';
  }
  if (!ctConfig?.host || !ctConfig?.clientId || !ctConfig?.clientSecret || !ctConfig?.authUrl || !ctConfig?.projectKey) {
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
      port: process.env.PORT || 3001,
      ...envConfig,
    };

    const { valid, message } = isConfigValid(config);
    if (valid) {
      return config;
    } else {
      Logger.error(message);
      throw new Error(message);
    }
  } catch (e) {
    throw new Error('Commercetools - Mollie Integration configuration is incomplete, missing or not provided in the valid JSON format');
  }
}

const ctMollieConfig = process.env.CT_MOLLIE_CONFIG;
const config = loadConfig(ctMollieConfig);

export default config;
