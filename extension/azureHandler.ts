import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { HandleRequestInput, HandleRequestSuccess } from './src/types';

loadSettings();

import handleRequest from "./src/requestHandlers/handleRequest";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  /*
        The azure HttpRequest object does not expose the path, it can be configured directly in the function config
        https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=javascript
     */
  const requestInput = new HandleRequestInput('/', req.method!.toString(), req.body);
  const headers = new Map([['authorization', req.headers['authorization'] ?? '']]);
  const result = await handleRequest(requestInput);
  if (result instanceof HandleRequestSuccess) {
    context.res = {
      status: 200,
      body: { actions: result.actions }
    }
  } else {
    context.res = {
      status: result.status,
      body: { errors: result.errors }
    }
  }
};

/*
    Azure settings do not support nested json configuration, so it needs manual object creation
    https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2#access-environment-variables-in-code
 */
function loadSettings() {
  const config = {
    commercetools: {
      authUrl: process.env['CT_MOLLIE_CONFIG:commercetools:authUrl'],
      clientId: process.env['CT_MOLLIE_CONFIG:commercetools:clientId'],
      clientSecret: process.env['CT_MOLLIE_CONFIG:commercetools:clientSecret'],
      host: process.env['CT_MOLLIE_CONFIG:commercetools:host'],
      projectKey: process.env['CT_MOLLIE_CONFIG:commercetools:projectKey'],
    },
    mollie: {
      apiKey: process.env['CT_MOLLIE_CONFIG:mollie:apiKey'],
    },
    service: {
      port: process.env['CT_MOLLIE_CONFIG:service:port'],
      logLevel: process.env['CT_MOLLIE_CONFIG:service:logLevel'],
      logTransports: process.env['CT_MOLLIE_CONFIG:service:logTransports'],
      webhookUrl: process.env['CT_MOLLIE_CONFIG:service:webhookUrl'],
      redirectUrl: process.env['CT_MOLLIE_CONFIG:service:redirectUrl'],
    },
  };
  process.env.CT_MOLLIE_CONFIG = JSON.stringify(config);
}

export default httpTrigger;
