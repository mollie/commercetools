import fetch from 'node-fetch-commonjs';
import { v4 as uuid } from 'uuid';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createCorrelationIdMiddleware } from '@commercetools/sdk-middleware-correlation-id';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createUserAgentMiddleware } from '@commercetools/sdk-middleware-user-agent';
import { createClient } from '@commercetools/sdk-client';

import config from '../../config/config';
import { version } from '../../package.json';

export default function initialiseCommercetoolsClient(): any {
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
  const httpOptions = {
    host,
    enableRetry,
    fetch,
  };
  enableRetry && Object.assign(httpOptions, { retryConfig: { maxDelay: 10000 } });
  const ctHttpMiddleWare = createHttpMiddleware(httpOptions);
  const correlationIdMiddleWare = createCorrelationIdMiddleware({
    generate: () => `mollie-integration-${uuid()}`,
  });

  const commercetoolsClient = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare, correlationIdMiddleWare] });
  return commercetoolsClient;
}
