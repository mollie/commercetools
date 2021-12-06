import createMollieClient, { MollieClient } from '@mollie/api-client';
import { ClientBuilder, Client, AuthMiddlewareOptions, HttpMiddlewareOptions } from '@commercetools/sdk-client-v2';
import config from '../../config/config';
import { version } from '../../package.json';

export function initialiseMollieClient(): MollieClient {
  const mollieApiKey = config.mollie.apiKey;
  const mollieUserAgentString = `MollieCommercetools-extension/${version}`;
  const mollieClient = createMollieClient({ apiKey: mollieApiKey, versionStrings: mollieUserAgentString });
  return mollieClient;
}

export function initialiseCommercetoolsClient(): Client {
  const {
    commercetools: { projectKey, clientId, clientSecret, host, authUrl, scopes },
  } = config;

  const authMiddlewareOptions: AuthMiddlewareOptions = {
    host: authUrl,
    projectKey,
    credentials: {
      clientId,
      clientSecret,
    },
    scopes,
    fetch,
  };

  const httpMiddlewareOptions: HttpMiddlewareOptions = {
    host,
    fetch,
  };

  const client: Client = new ClientBuilder()
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .withUserAgentMiddleware()
    .build();

  return client;
}
