import fetch from 'node-fetch-commonjs';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
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

  const ctHttpMiddleWare = createHttpMiddleware({
    host,
    enableRetry,
    fetch,
  });

  const commercetoolsClient = createClient({ middlewares: [userAgentMiddleware, ctAuthMiddleware, ctHttpMiddleWare] });
  return commercetoolsClient;
}
