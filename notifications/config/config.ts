import { Config } from './config-model';

export function loadConfig(ctMollieConfig: string | undefined) {
  try {
    // Parse env config, don't allow running without config
    const envConfig = JSON.parse(ctMollieConfig || '');

    // Allow missing parts of config and fill in with defaults
    const config: Config = {
      port: envConfig.port || 3001,
      mollieApiKey: envConfig.mollieApiKey,
      ...envConfig,
    };

    // TODO: Throw error if API Key, CT integration details etc. not present
    return config;
  } catch (e) {
    throw new Error('Commercetools - Mollie Integration configuration is missing or not provided in the valid JSON format');
  }
}

const ctMollieConfig = process.env.CT_MOLLIE_CONFIG;
const config = loadConfig(ctMollieConfig);

export default config;
