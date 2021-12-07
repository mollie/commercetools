import fetch from 'node-fetch-commonjs';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import config from '../../config/config';
import { version } from '../../package.json';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createLoggerMiddleware } from '@commercetools/sdk-middleware-logger';
import { createUserAgentMiddleware } from '@commercetools/sdk-middleware-user-agent';
import { createClient } from '@commercetools/sdk-client';
import Logger from '../logger/logger';

export function initialiseMollieClient(): MollieClient {
  const mollieApiKey = config.mollie.apiKey;
  const mollieUserAgentString = `MollieCommercetools-notifications/${version}`;
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

  let commercetoolsClient: any;

  if (Logger.level === 'http' || Logger.level === 'verbose' || Logger.level === 'debug') {
    commercetoolsClient = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare, createLoggerMiddleware()] });
  } else {
    commercetoolsClient = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare] });
  }
  return commercetoolsClient;
}
