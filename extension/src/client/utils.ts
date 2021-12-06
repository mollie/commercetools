import createMollieClient, { MollieClient } from '@mollie/api-client';
import config from '../../config/config';
import { version } from '../../package.json';

export function initialiseMollieClient(): MollieClient {
  const mollieApiKey = config.mollie.apiKey;
  const mollieUserAgentString = `MollieCommercetools-extension/${version}`;
  const mollieClient = createMollieClient({ apiKey: mollieApiKey, versionStrings: mollieUserAgentString });
  return mollieClient;
}
