import createMollieClient, { MollieClient } from '@mollie/api-client';
import config from '../../config/config';
import { version } from '../../package.json';

export default function initialiseMollieClient(): MollieClient {
  const mollieApiKey = config.mollie.apiKey;
  const mollieUserAgentStrings = [`MollieCommercetools-extension/${version}`, 'uap/NJTCs6RvSnqbvawh'];
  const mollieClient = createMollieClient({ apiKey: mollieApiKey, versionStrings: mollieUserAgentStrings });
  return mollieClient;
}
