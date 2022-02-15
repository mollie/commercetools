import fetch from 'node-fetch-commonjs';
import config from '../../config/config';
import { version } from '../../package.json';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createLoggerMiddleware } from '@commercetools/sdk-middleware-logger';
import { createUserAgentMiddleware } from '@commercetools/sdk-middleware-user-agent';
import { createClient } from '@commercetools/sdk-client';
import Logger from '../logger/logger';

export function initialiseCommercetoolsClient(): any {
  const {
    commercetools: { projectKey, clientId, clientSecret, host, authUrl, scopes, enableRetry },
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

  // Retries are enabled with exponential backoff (recommended to prevent spamming of the server)
  // The maxDelay sets an upper limit on long to wait before retrying, useful when the delay time grows
  // exponentialy more than reasonable.
  // https://commercetools.github.io/nodejs/sdk/api/sdkMiddlewareHttp.html#named-arguments-options
  const ctHttpMiddleWare = createHttpMiddleware({
    host,
    enableRetry,
    maxDelay: 10000,
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
