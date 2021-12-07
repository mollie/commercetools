import fetch from 'node-fetch-commonjs';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createUserAgentMiddleware } from '@commercetools/sdk-middleware-user-agent';
import { createClient } from '@commercetools/sdk-client';

import config from '../../config/config';
import { version } from '../../package.json';

export function initialiseMollieClient(): MollieClient {
  const mollieApiKey = config.mollie.apiKey;
  const mollieUserAgentString = `MollieCommercetools-extension/${version}`;
  const mollieClient = createMollieClient({ apiKey: mollieApiKey, versionStrings: mollieUserAgentString });
  return mollieClient;
}

export function initialiseCommercetoolsClient(): any {
  const {
    commercetools: { projectKey, clientId, clientSecret, host, authUrl, scopes },
  } = config;

  const userAgentMiddleware = createUserAgentMiddleware({
    libraryName: 'MollieCommercetools-notification',
    libraryVersion: version,
  });

  const ctAuthMiddleware = createAuthMiddlewareForClientCredentialsFlow({
    host: authUrl,
    projectKey,
    credentials: {
      clientId,
      clientSecret,
    },
    scopes,
    fetch,
  });

  const ctHttpMiddleWare = createHttpMiddleware({
    host,
    fetch,
  });

  const commercetoolsApi = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare] });
  return { commercetoolsApi, projectKey };
}
