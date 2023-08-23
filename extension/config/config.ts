import { Config } from './config-model';

const isConfigValid = (config: Config): { valid: boolean; message: string } => {
  const { mollie, commercetools } = config;
  let message = '';

  if (!mollie?.apiKey) {
    message = message + 'No Mollie API Key found\n';
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
  console.info("loadConfig : " + ctMollieConfig);
  try {
    const envConfig = JSON.parse(ctMollieConfig || '');

    const config: Config = {
      ...envConfig,
      service: {
        port: envConfig.service?.port || 3000,
        logLevel: process.env.LOG_LEVEL || envConfig.service?.logLevel || 'info',
        logTransports: envConfig.service?.logTransports || 'terminal',
      },
    };

    const localeRegex = /^[a-z]{2}_[A-Z]{2}$/;

    Object.assign(
      config.service,
      envConfig.service?.webhookUrl && { webhookUrl: envConfig.service.webhookUrl },
      envConfig.service?.redirectUrl && { redirectUrl: envConfig.service.redirectUrl },
      envConfig.service?.locale && envConfig.service.locale.match(localeRegex) && { locale: envConfig.service.locale },
    );
    Object.assign(config.commercetools, envConfig.commercetools?.authentication ? { authentication: envConfig.commercetools.authentication } : { authentication: { isBasicAuth: false } });
    Object.assign(config.commercetools, { enableRetry: envConfig.commercetools.enableRetry ?? true });

    const { valid, message } = isConfigValid(config);

    if (valid) {
      return config;
    } else {
      throw new Error(message);
    }
  } catch (e) {
    console.error(e);
    throw new Error('Commercetools - Mollie Integration configuration is missing or not provided in the valid JSON format');
  }
}

const ctMollieConfig = process.env.CT_MOLLIE_CONFIG;
const config = loadConfig(ctMollieConfig);

export default config;
